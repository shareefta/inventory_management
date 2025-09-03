import os
import uuid
from django.db import models
from django.utils.text import slugify
from io import BytesIO
from django.core.files import File
from django.conf import settings
from barcode import Code128
from barcode.writer import ImageWriter
from PIL import Image
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from decimal import Decimal
import random, time

User = get_user_model()

def generate_barcode():
    """
    Generate a unique 13-digit numeric barcode (EAN-13), optimized to avoid collisions.
    Uses microseconds + random digit(s) for uniqueness.
    """
    from .models import Product

    while True:
        # Timestamp with microseconds (14 digits) → take last 12 for payload
        timestamp_part = str(int(time.time() * 1000000))[-12:]
        random_part = str(random.randint(0, 9))  # 1 random digit
        base_digits = (timestamp_part + random_part)[:12]

        # Calculate EAN-13 check digit
        digits = [int(d) for d in base_digits]
        s = sum(d if i % 2 == 0 else d * 3 for i, d in enumerate(digits))
        check_digit = (10 - (s % 10)) % 10

        barcode = base_digits + str(check_digit)  # 13-digit numeric

        # Check uniqueness just in case
        if not Product.objects.filter(unique_id=barcode).exists():
            return barcode

barcode_validator = RegexValidator(
    regex=r'^[A-Za-z0-9\-]{8,30}$',
    message='Barcode must be 8–30 characters, letters, digits, and hyphens only.'
)

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.name

class Location(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

def product_image_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    new_filename = f"{uuid.uuid4()}{ext}"
    return f'product_images/{new_filename}'

def barcode_image_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    new_filename = f"{uuid.uuid4()}{ext}"
    return f'barcodes/{new_filename}'

class Product(models.Model):
    unique_id = models.CharField(max_length=64, unique=True, editable=True, validators=[barcode_validator],)
    item_name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    variants = models.CharField(max_length=200, blank=True)
    
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    locations = models.ManyToManyField(Location, through='ProductLocation')
    
    rate = models.DecimalField(max_digits=14, decimal_places=6)

    active = models.BooleanField(default=True)

    image = models.ImageField(upload_to=product_image_upload_path, blank=True, null=True)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def total_quantity(self):
        return sum(loc.quantity for loc in self.product_locations.all())
        
    def save(self, *args, **kwargs):
        if not self.unique_id or not self.unique_id.isdigit():
            self.unique_id = generate_barcode()

        is_new = self.pk is None
        old_rate = None
        if not is_new:
            old_rate = Product.objects.filter(pk=self.pk).values_list('rate', flat=True).first()
        
        self.full_clean()
        super().save(*args, **kwargs)

        # Check if rate is changed or product is new
        if is_new or (old_rate is not None and old_rate != self.rate):
            self.update_all_sections_price()

    def update_all_sections_price(self):
        """
        Update selling_price in all SectionProductPrice for this product:
        - selling_price = rate * 1.2 → two-level rounding
        - overwrite previous manual prices if needed
        """
        from sales.models import SectionProductPrice, SalesSection
        from sales.models import round_to_last_digit_5

        new_price = round_to_last_digit_5(self.rate * Decimal("1.2"))

        all_sections = SalesSection.objects.all()
        for section in all_sections:
            SectionProductPrice.objects.update_or_create(
                section=section,
                product=self,
                defaults={
                    "selling_price": new_price,
                    "is_manual": False,  # auto-calculated
                }
            )

    def __str__(self):
        return f"{self.item_name} ({self.unique_id})"

class ProductLocation(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='product_locations')
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('product', 'location')

    def __str__(self):
        return f"{self.product.item_name} at {self.location.name} - Qty: {self.quantity}"

def invoice_image_upload_path(instance, filename):
    ext = os.path.splitext(filename)[1]
    new_filename = f"{uuid.uuid4()}{ext}"
    return f'invoices/{new_filename}'

class PaymentMode(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class PurchasedBy(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

class Purchase(models.Model):
    supplier_name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    payment_mode = models.ForeignKey(PaymentMode, on_delete=models.SET_NULL, null=True, blank=True)
    purchased_by = models.ForeignKey(PurchasedBy, on_delete=models.SET_NULL, null=True, blank=True)
    invoice_number = models.CharField(max_length=100, blank=True, null=True)
    purchase_date = models.DateField()
    total_amount = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    discount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    invoice_image = models.ImageField(upload_to=invoice_image_upload_path, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.supplier_name} - {self.invoice_number or 'No Invoice'}"

    def calculate_total_amount(self):
        total = 0
        for item in self.items.all():
            for loc in item.item_locations.all():
                total += item.rate * loc.quantity
        return total - self.discount

class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey('products.Product', on_delete=models.SET_NULL, blank=True, null=True)
    rate = models.DecimalField(max_digits=14, decimal_places=6)
    fulfilled_backorder = models.PositiveIntegerField(default=0)

    # Snapshot fields
    product_name = models.CharField(max_length=200, blank=True, null=True)
    product_barcode = models.CharField(max_length=64, blank=True, null=True)
    product_brand = models.CharField(max_length=100, blank=True)
    product_variant = models.CharField(max_length=200, blank=True)
    serial_number = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.product_name} - {self.purchase}"

    def get_total_quantity(self):
        return sum(loc.quantity for loc in self.item_locations.all())

    def get_total_price(self):
        return self.get_total_quantity() * self.rate

    def save(self, *args, **kwargs):
        if self.product:
            # snapshot latest product info
            self.product_name = self.product.item_name
            self.product_barcode = self.product.unique_id
            self.product_brand = self.product.brand or ''
            self.product_variant = self.product.variants or ''
            self.serial_number = self.product.serial_number or ''

            # auto-sync product rate if changed
            if self.rate and self.rate != self.product.rate:
                self.product.rate = self.rate
                self.product.save(update_fields=["rate"])

        super().save(*args, **kwargs)

class PurchaseItemLocation(models.Model):
    purchase_item = models.ForeignKey(PurchaseItem, on_delete=models.CASCADE, related_name='item_locations')
    location = models.ForeignKey('products.Location', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
        unique_together = ('purchase_item', 'location')

    def __str__(self):
        return f"{self.purchase_item.product} @ {self.location} - Qty: {self.quantity}"