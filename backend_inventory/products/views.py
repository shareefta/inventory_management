from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticatedOrReadOnly
import json
from rest_framework import status
from rest_framework.response import Response
from .models import Product, Category, Location
from .serializers import ProductSerializer, CategorySerializer, LocationSerializer

# ----------------------------
# Product ViewSet
# ----------------------------

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().order_by('-created_at')
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['item_name', 'brand', 'serial_number']
    ordering_fields = ['item_name', 'rate', 'created_at']

    def get_serializer_context(self):
        return {'request': self.request}

# ----------------------------
# Category ViewSet
# ----------------------------

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

# ----------------------------
# Location ViewSet
# ----------------------------

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]