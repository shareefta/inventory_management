# sales/serializers.py
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.db.models import F
from rest_framework import serializers
from .models import SalesChannel, SalesSection, SectionProductPrice, Sale, SaleItem
from products.models import Product, ProductLocation, Location
from django.utils import timezone
from django.db.models import Count

def quantize_money(value):
    return Decimal(value).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

class SalesChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesChannel
        fields = ["id", "name"]


class SalesSectionSerializer(serializers.ModelSerializer):
    channel = SalesChannelSerializer(read_only=True)
    channel_id = serializers.PrimaryKeyRelatedField(
        source="channel", queryset=SalesChannel.objects.all(), write_only=True
    )
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all())

    class Meta:
        model = SalesSection
        fields = ["id", "name", "location", "channel", "channel_id"]


class SectionProductPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SectionProductPrice
        fields = ["id", "section", "product", "price"]


# --- Sale write items (from POS/cart) ---
class SaleItemWriteSerializer(serializers.Serializer):
    # Either send product (id) or at least product_name + product_barcode (for permanence)
    product = serializers.IntegerField(required=False, allow_null=True)
    product_name = serializers.CharField()
    product_barcode = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    product_brand = serializers.CharField(required=False, allow_blank=True)
    product_variant = serializers.CharField(required=False, allow_blank=True)
    serial_number = serializers.CharField(required=False, allow_blank=True)

    price = serializers.DecimalField(max_digits=12, decimal_places=2)
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3)
    total = serializers.DecimalField(max_digits=14, decimal_places=2)

    def validate(self, data):
        q = Decimal(data["quantity"])
        p = Decimal(data["price"])
        t = Decimal(data["total"])
        # Small rounding safety
        if quantize_money(q * p) != quantize_money(t):
            raise serializers.ValidationError("Item total must equal price * quantity.")
        return data


class SaleItemReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = [
            "id",
            "product",
            "product_name",
            "product_barcode",
            "product_brand",
            "product_variant",
            "serial_number",
            "price",
            "quantity",
            "total",
            "location",
        ]


class SaleSerializer(serializers.ModelSerializer):
    """
    Write with `items_write`, read with `items`.
    """
    items = SaleItemReadSerializer(many=True, read_only=True)
    items_write = SaleItemWriteSerializer(many=True, write_only=True)
    created_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Sale
        fields = [
            "id",
            "channel",
            "section",
            "sale_datetime",
            "customer_name",
            "customer_mobile",
            "payment_mode",
            "discount",
            "total_amount",
            "created_by",
            "items",
            "items_write",
        ]

    def validate(self, attrs):
        section = attrs.get("section") or getattr(self.instance, "section", None)
        channel = attrs.get("channel") or getattr(self.instance, "channel", None)
        if section and channel and section.channel_id != channel.id:
            raise serializers.ValidationError("Selected section does not belong to the chosen channel.")
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items_write")
        request = self.context["request"]
        user = request.user

        # --- Generate invoice number ---
        section = validated_data["section"]
        today = timezone.now().date()
        prefix = section.name[:3].upper()
        date_part = today.strftime("%y%m%d")

        # Count how many sales exist today for this section
        daily_count = Sale.objects.filter(section=section, sale_datetime__date=today).count()
        next_number = daily_count + 1

        invoice_number = f"{prefix}{date_part}{next_number:03d}"  # zero-padded 3 digits
        validated_data["invoice_number"] = invoice_number

        # Create sale with actor & timestamp
        sale = Sale.objects.create(created_by=user, **validated_data)

        # Resolve stock location from section
        location = sale.section.location

        # Optional: enforce non-negative stock
        enforce_stock = True

        # Build items and collect stock adjustments
        to_create = []
        stock_moves = []  # (product_id, qty)
        
        for item in items_data:
            product_obj = None
            if item.get("product"):
                product_obj = Product.objects.filter(pk=item["product"]).first()

            to_create.append(SaleItem(
                sale=sale,
                product=product_obj,
                product_name=item["product_name"],
                product_barcode=item.get("product_barcode"),
                product_brand=item.get("product_brand", "") or "",
                product_variant=item.get("product_variant", "") or "",
                serial_number=item.get("serial_number", "") or "",
                price=item["price"],
                quantity=item["quantity"],
                total=item["total"],
                location=location,
            ))

            if product_obj:
                stock_moves.append((product_obj.id, item["quantity"]))

        # Create all items at once
        SaleItem.objects.bulk_create(to_create)

        # Deduct stock per ProductLocation (lock rows for safe concurrent sales)
        for product_id, qty in stock_moves:
            pl = ProductLocation.objects.select_for_update().filter(
                product_id=product_id, location=location
            ).first()

            if not pl:
                if enforce_stock:
                    raise serializers.ValidationError(
                        f"No stock record for product {product_id} at {location.name}."
                    )
                # else, create it as zero then go negative:
                pl = ProductLocation.objects.create(product_id=product_id, location=location, quantity=0)

            # Check & deduct
            if enforce_stock and pl.quantity < qty:
                raise serializers.ValidationError(
                    f"Insufficient stock for product {product_id} at {location.name} (have {pl.quantity}, need {qty})."
                )

            pl.quantity = F("quantity") - qty
            pl.save(update_fields=["quantity"])

        return sale
