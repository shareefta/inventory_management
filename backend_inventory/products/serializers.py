from itertools import product
from rest_framework import serializers
import json
from .models import Product, Category, Location, ProductLocation, Purchase, PurchaseItem, PurchaseItemLocation
from django.db.models import Sum
from rest_framework.validators import UniqueValidator
import uuid
from rest_framework.exceptions import ValidationError

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
    # barcode_image = serializers.ImageField(read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'unique_id', 'item_name', 'brand', 'serial_number', 'variants',
            'category', 'category_id', 'rate', 'active', 'image', 'created_at', 
            'locations', 'total_quantity', 'description','minimum_profit', 'selling_price'
            ]

        read_only_fields = ['id', 'unique_id', 'created_at']
        
    def get_total_quantity(self, obj):
        return obj.product_locations.aggregate(total=Sum('quantity'))['total'] or 0
    
    def validate(self, attrs):
        rate = attrs.get('rate', getattr(self.instance, 'rate', 0))
        minimum_profit = attrs.get('minimum_profit', getattr(self.instance, 'minimum_profit', 0))
        selling_price = attrs.get('selling_price', getattr(self.instance, 'selling_price', 0))

        if selling_price is not None and selling_price < (rate + minimum_profit):
            raise serializers.ValidationError({
                'selling_price': f'Selling price must be at least rate + minimum profit: {rate + minimum_profit}'
            })
        return attrs

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
    location = serializers.PrimaryKeyRelatedField(queryset=Location.objects.all())

    class Meta:
        model = PurchaseItemLocation
        fields = ['location', 'quantity']

class PurchaseItemSerializer(serializers.ModelSerializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    item_locations = PurchaseItemLocationSerializer(many=True)

    class Meta:
        model = PurchaseItem
        fields = ['product', 'rate', 'item_locations']

class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, write_only=True)
    invoice_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Purchase
        fields = [
            'id', 'supplier_name', 'invoice_number', 'purchase_date',
            'total_amount', 'discount', 'invoice_image', 'items', 'created_at', 'created_by'
        ]
        read_only_fields = ['total_amount']
    
    def to_internal_value(self, data):
        # Check if 'items' is passed as a JSON string from FormData
        if isinstance(data.get('items'), str):
            try:
                data['items'] = json.loads(data['items'])
            except json.JSONDecodeError:
                raise ValidationError({'items': 'Invalid JSON format'})
        return super().to_internal_value(data)

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        purchase = Purchase.objects.create(**validated_data)

        for item_data in items_data:
            item_locations_data = item_data.pop('item_locations')
            purchase_item = PurchaseItem.objects.create(purchase=purchase, **item_data)

            for loc_data in item_locations_data:
                PurchaseItemLocation.objects.create(purchase_item=purchase_item, **loc_data)

            product = purchase_item.product
            if purchase_item.rate != product.rate:
                product.rate = purchase_item.rate
                product.save()

            for loc in item_locations_data:
                location = loc['location']
                qty = loc['quantity']

        return purchase

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None) 

        if items_data:
            if isinstance(items_data, str):
                items_data = json.loads(items_data)
            
            PurchaseItem.objects.filter(purchase=instance).delete()

            for item_data in items_data:
                item_locations_data = item_data.pop('item_locations')
                purchase_item = PurchaseItem.objects.create(purchase=instance, **item_data)

                for loc_data in item_locations_data:
                    PurchaseItemLocation.objects.create(purchase_item=purchase_item, **loc_data)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance