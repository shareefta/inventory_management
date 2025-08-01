from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.decorators import api_view, action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category, Location, Purchase
from .serializers import ProductSerializer, CategorySerializer, LocationSerializer, PurchaseSerializer, PurchaseDetailSerializer

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

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all().order_by('-purchase_date')
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    parser_classes = [MultiPartParser, JSONParser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['supplier_name', 'payment_mode', 'purchase_date']
    search_fields = ['supplier_name', 'invoice_number']

    @action(detail=True, methods=['get'], url_path='details')
    def purchase_details(self, request, pk=None):
        purchase = self.get_object()
        serializer = PurchaseDetailSerializer(purchase)
        return Response(serializer.data)

@api_view(['GET'])
def scan_barcode(request):
    barcode = request.query_params.get('barcode')
    
    if not barcode:
        return Response({'error': 'Barcode number is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        product = Product.objects.get(unique_id=barcode)
        serializer = ProductSerializer(product, context={'request': request})
        return Response({'found': True, 'product': serializer.data}, status=status.HTTP_200_OK)
    except Product.DoesNotExist:
        return Response({'found': False, 'product': None}, status=status.HTTP_200_OK)