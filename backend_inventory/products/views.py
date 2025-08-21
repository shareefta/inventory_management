from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, AllowAny
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from .models import Product, Category, Location, Purchase, ProductLocation, PurchaseItemLocation
from .serializers import ProductSerializer, CategorySerializer, LocationSerializer, PurchaseSerializer, PurchaseDetailSerializer
import io
import barcode
from barcode.writer import ImageWriter
from django.http import HttpResponse
import openpyxl
from django.db.models import Prefetch, Sum, F
from sales.models import SectionProductPrice
from django.utils.timezone import now
from datetime import date
import datetime

# ----------------------------
# Pagination
# ----------------------------
from rest_framework.pagination import PageNumberPagination

class ProductPagination(PageNumberPagination):
    page_size = 25           # default rows per page
    page_size_query_param = 'limit'  # allow frontend to control
    max_page_size = 100

# ----------------------------
# Product ViewSet
# ----------------------------

class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'unique_id',
        'item_name',
        'brand',
        'serial_number',
        'variants',
        'category__name',
    ]
    ordering_fields = ['item_name', 'rate', 'created_at']

    pagination_class = ProductPagination

    def get_queryset(self):
        # Prefetch section_prices with related section to avoid N+1 queries
        return Product.objects.all().order_by('-created_at').prefetch_related(
            Prefetch(
                'section_prices',
                queryset=SectionProductPrice.objects.select_related('section'),
                to_attr='prefetched_section_prices'
            )
        )

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

@api_view(['GET'])
@permission_classes([AllowAny])
def generate_barcode(request, unique_id):
    try:
        barcode_class = barcode.get_barcode_class('code128')
        barcode_img = barcode_class(unique_id, writer=ImageWriter())

        buffer = io.BytesIO()
        barcode_img.write(buffer, options={'module_width': 0.3, 'module_height': 15, 'font_size': 10})
        buffer.seek(0)

        return HttpResponse(buffer.getvalue(), content_type='image/png')
    
    except Exception as e:
        return HttpResponse(f"Error generating barcode: {str(e)}", status=500)

@api_view(['GET'])
def product_stats(request):
    active_count = Product.objects.filter(active=True).count()

    total_data = ProductLocation.objects.aggregate(
        total_quantity=Sum('quantity'),
        total_cost=Sum(F('quantity') * F('product__rate'))
    )

    return Response({
        'active_count': active_count,
        'total_quantity': total_data['total_quantity'] or 0,
        'total_cost': total_data['total_cost'] or 0
    })

@api_view(['GET'])
def export_products_excel(request):
    """
    Export all product details including separate columns for each location
    """
    search = request.GET.get('search', None)
    queryset = Product.objects.all().order_by('item_name')

    if search:
        queryset = queryset.filter(item_name__icontains=search)

    # Get all location names
    all_locations = list(
        Location.objects.all().order_by('name').values_list('name', flat=True)
    )

    # Create workbook
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Products"

    # Header
    headers = [
        'Product ID',
        'Item Name',
        'Brand',
        'Model No.',
        'Variants',
        'Category',
        'Rate',
        'Active',
        'Description',
        'Created At'
    ] + all_locations  # add one column per location
    ws.append(headers)

    # Data rows
    for p in queryset:
        # Create a dict of location -> quantity for this product
        loc_qty = {pl.location.name: pl.quantity for pl in p.product_locations.all()}

        # Build row
        row = [
            p.unique_id,
            p.item_name,
            p.brand,
            p.serial_number,
            p.variants,
            p.category.name if p.category else '',
            float(p.rate),
            'Yes' if p.active else 'No',
            p.description or '',
            p.created_at.strftime('%Y-%m-%d %H:%M'),
        ] + [loc_qty.get(loc, 0) for loc in all_locations]  # quantity per location

        ws.append(row)

    # Prepare response
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    response['Content-Disposition'] = 'attachment; filename=products.xlsx'
    wb.save(response)
    return response

def get_financial_year_dates(today: date):
    """Return start and end date of current financial year (Apr 1 - Mar 31)"""
    if today.month >= 4:
        fy_start = date(today.year, 4, 1)
        fy_end = date(today.year + 1, 3, 31)
    else:
        fy_start = date(today.year - 1, 4, 1)
        fy_end = date(today.year, 3, 31)
    return fy_start, fy_end

@api_view(['GET'])
def purchase_stats(request):
    today = now().date()
    month_start = today.replace(day=1)
    fy_start, fy_end = get_financial_year_dates(today)

    # Helper function
    def get_stats(queryset):
        total_amount = queryset.aggregate(total_amount=Sum('total_amount'))['total_amount'] or 0
        total_items = PurchaseItemLocation.objects.filter(
            purchase_item__purchase__in=queryset
        ).aggregate(total_qty=Sum('quantity'))['total_qty'] or 0
        return {
            'count': queryset.count(),
            'total_amount': total_amount,
            'total_items': total_items
        }

    # Month-wise totals for FY
    month_totals = []
    queryset_fy = Purchase.objects.filter(purchase_date__gte=fy_start, purchase_date__lte=fy_end)
    for month in range(4, 13):  # April (4) to December (12)
        month_queryset = queryset_fy.filter(purchase_date__month=month)
        month_totals.append(get_stats(month_queryset)['total_amount'])
    for month in range(1, 4):  # Jan (1) to Mar (3)
        month_queryset = queryset_fy.filter(purchase_date__month=month)
        month_totals.append(get_stats(month_queryset)['total_amount'])

    purchases = {
        'today': get_stats(Purchase.objects.filter(purchase_date=today)),
        'current_month': get_stats(Purchase.objects.filter(purchase_date__gte=month_start, purchase_date__lte=today)),
        'financial_year': get_stats(queryset_fy),
        'month_totals': month_totals  # April to March
    }

    return Response(purchases)