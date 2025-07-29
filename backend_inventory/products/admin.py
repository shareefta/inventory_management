from django.contrib import admin
from .models import Category, Location, Product, ProductLocation

class ProductLocationInline(admin.TabularInline):
    model = ProductLocation
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductLocationInline]
    list_display = ('item_name', 'unique_id', 'total_quantity', 'rate', 'minimum_profit', 'selling_price', 'active')
    search_fields = ('item_name', 'unique_id', 'brand', 'serial_number')

admin.site.register(Category)
admin.site.register(Location)
