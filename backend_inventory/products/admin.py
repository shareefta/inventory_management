from django.contrib import admin
import nested_admin
from .models import Category, Location, Product, ProductLocation, Purchase, PurchaseItem, PurchaseItemLocation

class ProductLocationInline(admin.TabularInline):
    model = ProductLocation
    extra = 1

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductLocationInline]
    list_display = ('item_name', 'unique_id', 'total_quantity', 'rate', 'active')
    search_fields = ('item_name', 'unique_id', 'brand', 'serial_number')

@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    search_fields = ['name']
    
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    search_fields = ['name']

class PurchaseItemLocationInline(nested_admin.NestedTabularInline):
    model = PurchaseItemLocation
    extra = 1
    autocomplete_fields = ['location']

class PurchaseItemInline(nested_admin.NestedStackedInline):
    model = PurchaseItem
    extra = 1
    autocomplete_fields = ['product']
    inlines = [PurchaseItemLocationInline]

@admin.register(Purchase)
class PurchaseAdmin(nested_admin.NestedModelAdmin):
    list_display = ['supplier_name', 'invoice_number', 'purchase_date', 'payment_mode', 'total_amount', 'purchased_by', 'created_by']
    list_filter = ['purchase_date', 'supplier_name', 'payment_mode']
    search_fields = ['supplier_name', 'invoice_number']
    inlines = [PurchaseItemInline]
    readonly_fields = ['created_by', 'created_at', 'total_amount']
    date_hierarchy = 'purchase_date'

    def save_model(self, request, obj, form, change):
        if not obj.created_by:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        form.instance.total_amount = form.instance.calculate_total_amount()
        form.instance.save(update_fields=["total_amount"])

@admin.register(PurchaseItem)
class PurchaseItemAdmin(admin.ModelAdmin):
    list_display = ['purchase', 'product', 'rate']
    list_filter = ['product']
    search_fields = ['purchase__supplier_name', 'product__item_name']
