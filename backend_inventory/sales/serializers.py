# sales/serializers.py
from decimal import Decimal, ROUND_HALF_UP
from django.db import transaction
from django.db.models import F, Sum
from rest_framework import serializers
from .models import SalesChannel, SalesSection, SectionProductPrice, Sale, SaleItem, SalesReturn, SalesReturnItem
from products.models import Product, ProductLocation, Location
from customers.models import Customer, WalletTransaction
from django.utils import timezone
from django.db.models import Count

REFUND_CHOICES = [
    ("cash", "Cash"),
    ("card", "Card"),
    ("online", "Online"),
    ("wallet", "Wallet"),
]

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
        fields = [
            "id",
            "name",
            "short_name",
            "building_no",
            "street_no",
            "zone_no",
            "place",
            "logo",
            "location",
            "channel",
            "channel_id",
        ]

class SectionProductPriceSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()

    class Meta:
        model = SectionProductPrice
        fields = ["id", "section", "product", "selling_price", "is_manual", "price"]

    def get_price(self, obj):
        return float(obj.final_price)

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
            "invoice_number",
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

        # --- Handle customer ---
        customer_name = validated_data.pop("customer_name", "").strip()
        customer_mobile = validated_data.pop("customer_mobile", "").strip()
        customer = None

        if customer_mobile:
            customer, created = Customer.objects.get_or_create(
                mobile=customer_mobile,
                defaults={"name": customer_name, "wallet_balance": 0},
            )
            if not created and customer_name and customer.name != customer_name:
                customer.name = customer_name
                customer.save(update_fields=["name"])

        # Attach customer FK to sale
        if customer:
            validated_data["customer"] = customer
            validated_data["customer_name"] = customer.name
            validated_data["customer_mobile"] = customer.mobile

        # --- Generate invoice number ---
        section = validated_data["section"]
        today = timezone.now().date()
        prefix = section.short_name.upper()
        date_part = today.strftime("%y%m%d")
        daily_count = Sale.objects.filter(section=section, sale_datetime__date=today).count()
        next_number = daily_count + 1
        invoice_number = f"{prefix}{date_part}{next_number:03d}"
        validated_data["invoice_number"] = invoice_number

        # Create sale
        sale = Sale.objects.create(created_by=user, **validated_data)

        # Resolve stock location from section
        location = sale.section.location

        # Build items and prepare stock updates
        to_create = []
        stock_moves = []

        for item in items_data:
            product_obj = (
                Product.objects.filter(pk=item["product"]).first()
                if item.get("product")
                else None
            )

            selling_price = item["price"]

            # --- Update / Create SectionProductPrice if user edited price ---
            if product_obj:
                spp, _ = SectionProductPrice.objects.get_or_create(
                    section=section,
                    product=product_obj,
                    defaults={"selling_price": selling_price, "is_manual": True},
                )
                if spp.selling_price != selling_price or not spp.is_manual:
                    spp.selling_price = selling_price
                    spp.is_manual = True
                    spp.save(update_fields=["selling_price", "is_manual"])

            to_create.append(SaleItem(
                sale=sale,
                product=product_obj,
                product_name=item["product_name"],
                product_barcode=item.get("product_barcode"),
                product_brand=item.get("product_brand") or "",
                product_variant=item.get("product_variant") or "",
                serial_number=item.get("serial_number") or "",
                price=selling_price,
                quantity=item["quantity"],
                total=item["total"],
                location=location,
            ))

            if product_obj:
                stock_moves.append((product_obj.id, item["quantity"]))

        # Bulk create items
        SaleItem.objects.bulk_create(to_create)

        # Deduct stock safely
        for product_id, qty in stock_moves:
            pl = ProductLocation.objects.select_for_update().filter(product_id=product_id, location=location).first()

            if not pl:
                # create stock record if missing
                pl = ProductLocation.objects.create(product_id=product_id, location=location, quantity=0)

            available_qty = pl.quantity
            if qty > available_qty:
                # Deduct only what is available
                pl.quantity = 0
                backorder_qty = qty - available_qty
                # Save backorder quantity in SaleItem
                sale_item = SaleItem.objects.filter(sale=sale, product_id=product_id).first()
                sale_item.backorder_quantity = backorder_qty
                sale_item.save(update_fields=["backorder_quantity"])
            else:
                pl.quantity = F("quantity") - qty

            pl.save(update_fields=["quantity"])

        return sale

# --- Sales Return Serializers ---
class SalesReturnItemWriteSerializer(serializers.Serializer):
    sale_item = serializers.IntegerField()
    quantity = serializers.DecimalField(max_digits=12, decimal_places=3)

    def validate(self, data):
        sale_item_id = data["sale_item"]
        qty = Decimal(data["quantity"])

        try:
            si = SaleItem.objects.get(id=sale_item_id)
        except SaleItem.DoesNotExist:
            raise serializers.ValidationError("Sale item not found.")

        if qty <= 0:
            raise serializers.ValidationError("Return quantity must be positive.")

        # Already returned?
        total_returned = (
            SalesReturnItem.objects.filter(sale_item_id=sale_item_id)
            .aggregate(total=Sum("quantity"))["total"]
            or Decimal("0")
        )

        if qty + total_returned > si.quantity:
            raise serializers.ValidationError(
                f"Cannot return {qty}. Already returned {total_returned}, "
                f"original sold {si.quantity}."
            )

        return data

class SalesReturnItemReadSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesReturnItem
        fields = [
            "id",
            "sale_item",
            "product",
            "location",
            "quantity",
            "price",
            "total",
        ]

class SalesReturnSerializer(serializers.ModelSerializer):
    items = SalesReturnItemReadSerializer(many=True, read_only=True)
    items_write = SalesReturnItemWriteSerializer(many=True, write_only=True)
    created_by = serializers.StringRelatedField(read_only=True)

    refund_mode = serializers.ChoiceField(choices=REFUND_CHOICES, default="cash")

    class Meta:
        model = SalesReturn
        fields = [
            "id",
            "sale",
            "customer",
            "refund_amount",
            "refund_to_wallet",
            "refund_mode",
            "created_at",
            "created_by",
            "items",
            "items_write",
        ]
        read_only_fields = ["refund_amount", "created_at", "refund_to_wallet"]

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items_write")
        refund_mode = validated_data.pop("refund_mode", "cash")
        request = self.context["request"]
        user = request.user

        sale = validated_data["sale"]
        customer = validated_data.get("customer") or sale.customer

        to_create = []
        total_refund = Decimal("0.00")

        # --- Proportional discount allocation ---
        total_sale_before_discount = sum(Decimal(i.price) * i.quantity for i in sale.items.all())
        discount_ratio = (sale.discount / total_sale_before_discount) if total_sale_before_discount else Decimal("0")

        for item in items_data:
            si = SaleItem.objects.get(id=item["sale_item"])
            qty = Decimal(item["quantity"])
            line_price = si.price

            line_total_before_disc = line_price * qty
            line_discount = line_total_before_disc * discount_ratio
            line_total = line_total_before_disc - line_discount

            total_refund += line_total

            to_create.append(
                SalesReturnItem(
                    sale_item=si,
                    product=si.product,
                    location=si.location,
                    quantity=qty,
                    price=line_price,
                    total=line_total,
                )
            )

        validated_data["refund_amount"] = total_refund
        validated_data["created_by"] = user
        validated_data["customer"] = customer
        validated_data["refund_to_wallet"] = refund_mode == "wallet"

        sales_return = SalesReturn.objects.create(**validated_data)

        for obj in to_create:
            obj.sales_return = sales_return
        SalesReturnItem.objects.bulk_create(to_create)

        # --- Update stock back ---
        for obj in to_create:
            pl = ProductLocation.objects.select_for_update().filter(
                product=obj.product, location=obj.location
            ).first()
            if not pl:
                pl = ProductLocation.objects.create(
                    product=obj.product, location=obj.location, quantity=0
                )
            pl.quantity = F("quantity") + obj.quantity
            pl.save(update_fields=["quantity"])

        if sales_return.refund_to_wallet and customer:
            WalletTransaction.credit(
                customer,
                total_refund,
                note=f"Refund for SalesReturn #{sales_return.id}",
                sales_return_id=sales_return.id
            )

        return sales_return