from itertools import product
from rest_framework import serializers
import json
from .models import Product, Category, Location, ProductLocation, Purchase, PurchaseItem, PurchaseItemLocation, PaymentMode, PurchasedBy
from django.db.models import Sum
from rest_framework.validators import UniqueValidator
import uuid
from rest_framework.exceptions import ValidationError
from django.db import transaction
from decimal import Decimal
from sales.models import SaleItem

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name']

class ProductLocationSerializer(serializers.ModelSerializer):
    location = LocationSerializer(read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), source='location', write_only=True
    )
    class Meta:
        model = ProductLocation
        fields = ['location', 'location_id', 'quantity']

class ProductSerializer(serializers.ModelSerializer):
    unique_id = serializers.CharField(
        validators=[UniqueValidator(queryset=Product.objects.all())],
        required=False
    )
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )
    locations = ProductLocationSerializer(source='product_locations', many=True, read_only=True)

    total_quantity = serializers.SerializerMethodField()

    auto_selling_price = serializers.SerializerMethodField()

    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'unique_id', 'item_name', 'brand', 'serial_number', 'variants',
            'category', 'category_id', 'rate', 'active', 'image', 'created_at', 
            'locations', 'total_quantity', 'description', 'auto_selling_price',
            ]

        read_only_fields = ['id', 'unique_id', 'created_at', 'auto_selling_price']

    def get_total_quantity(self, obj):
        return obj.product_locations.aggregate(total=Sum('quantity'))['total'] or 0
    
    def get_auto_selling_price(self, obj):
        # Calculate rate*1.2 with rounding
        from sales.models import round_to_last_digit_5
        return round_to_last_digit_5(obj.rate * Decimal("1.2"))

    def create(self, validated_data):
        request = self.context.get('request')

        # Generate barcode if not provided
        if 'unique_id' not in validated_data or not validated_data['unique_id']:
            validated_data['unique_id'] = uuid.uuid4().hex[:12].upper()

        locations_data = []
        if request and 'locations' in request.data:
            raw_locations = request.data.get('locations')
            if isinstance(raw_locations, str):
                try:
                    locations_data = json.loads(raw_locations)
                except json.JSONDecodeError:
                    raise serializers.ValidationError({'locations': 'Invalid JSON format'})
            else:
                locations_data = raw_locations

        product = Product.objects.create(**validated_data)

        for loc_data in locations_data:
            ProductLocation.objects.create(
                product=product,
                location_id=loc_data['location_id'],
                quantity=loc_data['quantity']
            )
        
        return product

    def update(self, instance, validated_data):        
        request = self.context.get('request')
        
        locations_data = None
        if request and 'locations' in request.data:
            raw_locations = request.data.get('locations')
            if isinstance(raw_locations, str):
                try:
                    locations_data = json.loads(raw_locations)
                except json.JSONDecodeError:
                    raise serializers.ValidationError({'locations': 'Invalid JSON format'})
            else:
                locations_data = raw_locations

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if locations_data is not None:
            # Delete old locations and add new ones
            instance.product_locations.all().delete()
            for loc_data in locations_data:
                ProductLocation.objects.create(
                    product=instance,
                    location_id=loc_data['location_id'],
                    quantity=loc_data['quantity']
                )
        
        return instance

# PaymentMode serializer
class PaymentModeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMode
        fields = ['id', 'name']

# PurchasedBy serializer
class PurchasedBySerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchasedBy
        fields = ['id', 'name']
    
class PurchaseItemLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseItemLocation
        fields = ['id', 'location', 'quantity']

class PurchaseItemSerializer(serializers.ModelSerializer):
    item_locations = PurchaseItemLocationSerializer(many=True)
    rate = serializers.DecimalField(max_digits=14, decimal_places=6)
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all(), write_only=True, source='product')

    class Meta:
        model = PurchaseItem
        fields = [
            'id',
            'product',
            'product_id',
            'rate',
            'product_name',
            'product_barcode',
            'product_brand',
            'product_variant',
            'serial_number',
            'item_locations',
        ]
        read_only_fields = [
            'product_name',
            'product_barcode',
            'product_brand',
            'product_variant',
            'serial_number',
        ]
    
    def validate_item_locations(self, value):
        seen_locations = set()
        for loc in value:
            location_id = loc.get('location')
            if location_id in seen_locations:
                raise serializers.ValidationError(
                    f"Duplicate location ID {location_id} in item_locations."
                )
            seen_locations.add(location_id)
        return value

class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True)
    payment_mode = PaymentModeSerializer(read_only=True)
    purchased_by = PurchasedBySerializer(read_only=True)
    payment_mode_id = serializers.PrimaryKeyRelatedField(
        queryset=PaymentMode.objects.all(), source='payment_mode', write_only=True
    )
    purchased_by_id = serializers.PrimaryKeyRelatedField(
        queryset=PurchasedBy.objects.all(), source='purchased_by', write_only=True
    )

    class Meta:
        model = Purchase
        fields = [
            'id', 'supplier_name', 'contact_number',
            'invoice_number', 'invoice_image', 'purchase_date',
            'discount', 'total_amount', 'items', 'payment_mode', 'purchased_by',
            'payment_mode_id', 'purchased_by_id'
        ]
        read_only_fields = ['total_amount']

    def to_internal_value(self, data):
        items = data.get('items')
        if isinstance(items, str):
            try:
                data = data.copy()
                data['items'] = json.loads(items)
            except json.JSONDecodeError:
                raise serializers.ValidationError({'items': 'Invalid JSON format'})
        return super().to_internal_value(data)

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get('request')
        items_data = validated_data.pop('items', [])
        purchase = Purchase.objects.create(created_by=getattr(request, 'user', None), **validated_data)

        for item_data in items_data:
            locs_data = item_data.pop('item_locations', [])

            product_value = item_data.get('product')
            if isinstance(product_value, int):
                item_data['product'] = Product.objects.get(pk=product_value)

            item = PurchaseItem.objects.create(purchase=purchase, **item_data)

            for loc_data in locs_data:
                loc_value = loc_data.get('location')
                location_obj = loc_value if not isinstance(loc_value, int) else Location.objects.get(pk=loc_value)
                quantity = Decimal(loc_data.get('quantity', 0))

                # Create PurchaseItemLocation
                PurchaseItemLocation.objects.create(
                    purchase_item=item,
                    location=location_obj,
                    quantity=quantity,
                )

                # **Update stock and fulfill backorders**
                self.fulfill_backorders(item.product, location_obj, quantity)

        # Calculate total
        purchase.total_amount = purchase.calculate_total_amount()
        purchase.save(update_fields=["total_amount"])
        return purchase

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        if items_data is not None:
            existing_items = {item.id: item for item in instance.items.all()}

            for item_data in items_data:
                locs_data = item_data.pop('item_locations', [])

                # Convert product ID to Product instance if necessary
                product_value = item_data.get('product')
                if isinstance(product_value, int):
                    item_data['product'] = Product.objects.get(pk=product_value)

                item_id = item_data.get('id')
                if item_id and item_id in existing_items:
                    # Update existing item
                    item = existing_items.pop(item_id)
                    for attr, value in item_data.items():
                        setattr(item, attr, value)
                    item.save()
                else:
                    # Create new item
                    item = PurchaseItem.objects.create(purchase=instance, **item_data)

                # Handle locations
                existing_locs = {loc.id: loc for loc in item.item_locations.all()}
                for loc_data in locs_data:
                    loc_id = loc_data.get('id')
                    loc_value = loc_data.get('location')
                    location_obj = loc_value if not isinstance(loc_value, int) else Location.objects.get(pk=loc_value)
                    quantity = Decimal(loc_data.get('quantity', 0))

                    if loc_id and loc_id in existing_locs:
                        loc_instance = existing_locs.pop(loc_id)
                        old_qty = loc_instance.quantity
                        if loc_instance.quantity != quantity or loc_instance.location != location_obj:
                            loc_instance.quantity = quantity
                            loc_instance.location = location_obj
                            loc_instance.save()

                            # Update stock difference and fulfill backorders
                            self.fulfill_backorders(item.product, location_obj, quantity - old_qty)
                    else:
                        # New location
                        PurchaseItemLocation.objects.create(
                            purchase_item=item,
                            location=location_obj,
                            quantity=quantity,
                        )
                        self.fulfill_backorders(item.product, location_obj, quantity)

                # Delete leftover locations
                for loc in existing_locs.values():
                    # Reduce stock before deleting
                    product_location, _ = ProductLocation.objects.get_or_create(
                        product=item.product,
                        location=loc.location
                    )
                    product_location.quantity -= loc.quantity
                    product_location.save()
                    loc.delete()

            # Delete leftover items
            for item in existing_items.values():
                # Reduce stock for all locations
                for loc in item.item_locations.all():
                    product_location, _ = ProductLocation.objects.get_or_create(
                        product=item.product,
                        location=loc.location
                    )
                    product_location.quantity -= loc.quantity
                    product_location.save()
                item.delete()

        # Update Purchase fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.total_amount = instance.calculate_total_amount()
        instance.save()
        return instance

    @staticmethod
    @transaction.atomic
    def fulfill_backorders(product, location, added_qty):
        """
        Fills backorders for a product at a location when new stock arrives.
        """
        product_location, _ = ProductLocation.objects.select_for_update().get_or_create(
            product=product, location=location, defaults={"quantity": 0}
        )
        product_location.quantity += added_qty
        product_location.save(update_fields=["quantity"])
        product_location.refresh_from_db()

        available_qty = product_location.quantity

        # Fulfill oldest backorders first
        backorders = SaleItem.objects.select_for_update().filter(
            product=product,
            location=location,
            backorder_quantity__gt=0
        ).order_by("sale__sale_datetime")

        for si in backorders:
            if available_qty <= 0:
                break
            fulfill_qty = min(si.backorder_quantity, available_qty)
            si.quantity += fulfill_qty
            si.backorder_quantity -= fulfill_qty
            si.total = si.price * si.quantity
            si.save(update_fields=["quantity", "backorder_quantity", "total"])
            available_qty -= fulfill_qty

        product_location.quantity = available_qty
        product_location.save(update_fields=["quantity"])

    
class PurchaseItemLocationReadSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = PurchaseItemLocation
        fields = ['id', 'location', 'location_name', 'quantity']

class PurchaseItemReadSerializer(serializers.ModelSerializer):
    item_locations = PurchaseItemLocationReadSerializer(many=True, read_only=True)

    class Meta:
        model = PurchaseItem
        fields = [
            'id', 'product_name', 'product_barcode', 'product_brand', 'serial_number',
            'product_variant', 'rate', 'item_locations'
        ]

class PurchaseDetailSerializer(serializers.ModelSerializer):
    items = PurchaseItemReadSerializer(many=True, read_only=True)
    created_by = serializers.StringRelatedField(read_only=True)
    created_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Purchase
        fields = [
            'id', 'supplier_name', 'invoice_number', 'purchase_date',
            'payment_mode', 'discount', 'total_amount', 'created_by', 'created_at',
            'items'
        ]