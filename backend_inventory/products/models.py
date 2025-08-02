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

User = get_user_model()

barcode_validator = RegexValidator(
    regex=r'^[A-Z0-9]{8,13}$',
    message='Barcode must be 8–13 characters, uppercase letters and digits only.'
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
    
    rate = models.DecimalField(max_digits=10, decimal_places=2)

    active = models.BooleanField(default=True)

    image = models.ImageField(upload_to=product_image_upload_path, blank=True, null=True)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def total_quantity(self):
        return sum(loc.quantity for loc in self.product_locations.all())
        
    def save(self, *args, **kwargs):
        if not self.unique_id:
            self.unique_id = str(uuid.uuid4()).replace('-', '')[:13].upper()
        
        self.full_clean()
        super().save(*args, **kwargs)

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


class Purchase(models.Model):
    PAYMENT_CHOICES = [
        ('Cash', 'Cash'),
        ('Credit', 'Credit'),
        ('Card', 'Card'),
        ('Online', 'Online'),
    ]

    PURCHASED_BY = [
        ('AZIZIYAH_SHOP', 'AZIZIYAH_SHOP'),
        ('ALWAB_SHOP', 'ALWAB_SHOP'),
        ('MAIN_STORE', 'MAIN_STORE'),
        ('JAMSHEER', 'JAMSHEER'),
        ('FAWAS', 'FAWAS'),
        ('IRSHAD', 'IRSHAD'),
        ('MOOSA', 'MOOSA'),
        ('FATHIH', 'FATHIH'),
        ('FIROZ', 'FIROZ'),
    ]

    supplier_name = models.CharField(max_length=100)
    contact_number = models.CharField(max_length=20, blank=True, null=True)
    payment_mode = models.CharField(max_length=20, choices=PAYMENT_CHOICES, blank=True, null=True)
    purchased_by = models.CharField(max_length=20, choices=PURCHASED_BY, blank=True, null=True)
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
    rate = models.DecimalField(max_digits=10, decimal_places=2)

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
        if self.product and not self.pk:
            self.product_name = self.product.item_name
            self.product_barcode = self.product.unique_id
            self.product_brand = self.product.brand
            self.product_variant = self.product.variants
            self.serial_number = self.product.serial_number

        super().save(*args, **kwargs)

        # Update product rate if needed
        if self.product and self.rate != self.product.rate:
            self.product.rate = self.rate
            self.product.save()

class PurchaseItemLocation(models.Model):
    purchase_item = models.ForeignKey(PurchaseItem, on_delete=models.CASCADE, related_name='item_locations')
    location = models.ForeignKey('products.Location', on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()

    class Meta:
        unique_together = ('purchase_item', 'location')

    def __str__(self):
        return f"{self.purchase_item.product} @ {self.location} - Qty: {self.quantity}"

    def save(self, *args, **kwargs):
        is_new = self._state.adding

        # For updates, calculate the difference
        if not is_new:
            previous = PurchaseItemLocation.objects.get(pk=self.pk)
            quantity_diff = self.quantity - previous.quantity
        else:
            quantity_diff = self.quantity

        super().save(*args, **kwargs)

        # Update ProductLocation stock
        product_location, _ = ProductLocation.objects.get_or_create(
            product=self.purchase_item.product,
            location=self.location
        )
        product_location.quantity += quantity_diff
        product_location.save()

        # Update total on the Purchase
        self.purchase_item.purchase.save()