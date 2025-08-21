from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, LocationViewSet, scan_barcode, PurchaseViewSet, generate_barcode, product_stats, export_products_excel, purchase_stats

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'purchases', PurchaseViewSet, basename='purchase')

urlpatterns = [
    path('', include(router.urls)),
    path('scan/', scan_barcode, name='scan_barcode'),
    path('barcode/<str:unique_id>/', generate_barcode, name='generate_barcode'),
    path('product-stats/', product_stats, name='product_stats'),
    path('export-excel/', export_products_excel, name='export_products_excel'),
    path('purchase-stats/', purchase_stats, name='purchase_stats'),
]