from rest_framework import serializers
from .models import Product, Category, Location

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'name', 'description']

class ProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.name', read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(), source='category', write_only=True
    )

    location = serializers.CharField(source='location.name', read_only=True)
    location_id = serializers.PrimaryKeyRelatedField(
        queryset=Location.objects.all(), source='location', write_only=True
    )

    image = serializers.ImageField(required=False, allow_null=True)
    barcode = serializers.ImageField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'unique_id', 'item_name', 'brand', 'serial_number', 'variants',
            'category', 'category_id',
            'location', 'location_id',
            'rate', 'quantity', 'active', 'image', 'barcode', 'created_at'
        ]
        read_only_fields = ['id', 'unique_id', 'barcode', 'created_at']