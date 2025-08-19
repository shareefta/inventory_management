from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, CategoryViewSet, LocationViewSet, scan_barcode, PurchaseViewSet, generate_barcode, active_product_count, export_products_excel

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'purchases', PurchaseViewSet, basename='purchase')

urlpatterns = [
    path('', include(router.urls)),
    path('scan/', scan_barcode, name='scan_barcode'),
    path('barcode/<str:unique_id>/', generate_barcode, name='generate_barcode'),
    path('active-count/', active_product_count, name='active_product_count'),
    path('export-excel/', export_products_excel, name='export_products_excel'),
]