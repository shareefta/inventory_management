from itertools import product
from rest_framework import serializers
import json
from .models import Product, Category, Location, ProductLocation
from django.db.models import Sum
from rest_framework.validators import UniqueValidator
import uuid

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
