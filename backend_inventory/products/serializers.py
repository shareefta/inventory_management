from itertools import product
from rest_framework import serializers
import json
from .models import Product, Category, Location, ProductLocation, Purchase, PurchaseItem, PurchaseItemLocation
from django.db.models import Sum
from rest_framework.validators import UniqueValidator
import uuid
from rest_framework.exceptions import ValidationError
from django.db import transaction

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

    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'unique_id', 'item_name', 'brand', 'serial_number', 'variants',
            'category', 'category_id', 'rate', 'active', 'image', 'created_at', 
            'locations', 'total_quantity', 'description'
            ]

        read_only_fields = ['id', 'unique_id', 'created_at']
        
    def get_total_quantity(self, obj):
        return obj.product_locations.aggregate(total=Sum('quantity'))['total'] or 0

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
    
class PurchaseItemLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PurchaseItemLocation
        fields = ['id', 'location', 'quantity']

class PurchaseItemSerializer(serializers.ModelSerializer):
    item_locations = PurchaseItemLocationSerializer(many=True)

    class Meta:
        model = PurchaseItem
        fields = [
            'id',
            'product',
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

    class Meta:
        model = Purchase
        fields = [
            'id', 'supplier_name', 'contact_number',
            'invoice_number', 'invoice_image', 'purchase_date',
            'payment_mode', 'discount', 'total_amount', 'purchased_by', 'items'
        ]
        read_only_fields = ['total_amount']

    def to_internal_value(self, data):
        # Parse items JSON string before validation
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

        purchase = Purchase.objects.create(created_by=request.user, **validated_data)

        for item_data in items_data:
            locs_data = item_data.pop('item_locations', [])

            # Fetch product instance for backup
            product = item_data.get('product')
            if product:
                item_data['product_name'] = product.item_name
                item_data['product_barcode'] = product.unique_id
                item_data['product_brand'] = product.brand or ''
                item_data['product_variant'] = product.variants or ''
                item_data['serial_number'] = product.serial_number or ''

            item = PurchaseItem.objects.create(purchase=purchase, **item_data)

            for loc_data in locs_data:
                PurchaseItemLocation.objects.create(purchase_item=item, **loc_data)

        purchase.total_amount = purchase.calculate_total_amount()
        purchase.save(update_fields=["total_amount"])
        return purchase

    @transaction.atomic
    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)

        if items_data is not None:
            instance.items.all().delete()
            for item_data in items_data:
                locs_data = item_data.pop('item_locations', [])

                product = item_data.get('product')
                if product:
                    item_data['product_name'] = product.item_name
                    item_data['product_barcode'] = product.unique_id
                    item_data['product_brand'] = product.brand or ''
                    item_data['product_variant'] = product.variants or ''
                    item_data['serial_number'] = product.serial_number or ''

                item = PurchaseItem.objects.create(purchase=instance, **item_data)

                for loc_data in locs_data:
                    PurchaseItemLocation.objects.create(purchase_item=item, **loc_data)

                if item.rate != item.product.rate:
                    item.product.rate = item.rate
                    item.product.save()

        # Update other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.total_amount = instance.calculate_total_amount()
        instance.save()
        return instance
    
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
