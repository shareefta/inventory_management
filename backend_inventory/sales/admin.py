# sales/admin.py
from django.contrib import admin
from .models import SalesChannel, SalesSection, SectionProductPrice, Sale, SaleItem

@admin.register(SalesChannel)
class SalesChannelAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)

@admin.register(SalesSection)
class SalesSectionAdmin(admin.ModelAdmin):
    list_display = ("id", "channel", "name", "location")
    list_filter = ("channel", "location")
    search_fields = ("name", "location__name")

@admin.register(SectionProductPrice)
class SectionProductPriceAdmin(admin.ModelAdmin):
    list_display = ("id", "section", "product", "price")
    list_filter = ("section__channel", "section")
    search_fields = ("product__item_name", "product__unique_id", "section__name")

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = (
        "product", "product_name", "product_barcode", "product_brand", "product_variant",
        "serial_number", "price", "quantity", "total", "location"
    )

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = ("id", "sale_datetime", "channel", "section", "payment_mode", "total_amount", "discount", "created_by")
    list_filter = ("channel", "section", "payment_mode", "sale_datetime")
    search_fields = ("customer_name", "customer_mobile")
    inlines = [SaleItemInline]