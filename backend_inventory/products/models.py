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
    unique_id = models.CharField(max_length=12, unique=True, editable=False)
    item_name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    serial_number = models.CharField(max_length=100, blank=True)
    variants = models.CharField(max_length=200, blank=True)
    
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, related_name='products')
    locations = models.ManyToManyField(Location, through='ProductLocation')
    
    rate = models.DecimalField(max_digits=10, decimal_places=2)
    active = models.BooleanField(default=True)

    image = models.ImageField(upload_to=product_image_upload_path, blank=True, null=True)
    barcode_image = models.ImageField(upload_to=barcode_image_upload_path, blank=True, null=True)
    description = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def total_quantity(self):
        return sum(loc.quantity for loc in self.product_locations.all())

    def save(self, *args, **kwargs):
        if not self.unique_id:
            self.unique_id = str(uuid.uuid4()).replace('-', '')[:12].upper()
        super().save(*args, **kwargs)

        if not self.barcode_image:
            barcode = Code128(self.unique_id, writer=ImageWriter())
            buffer = BytesIO()
            barcode.write(buffer)
            buffer.seek(0)

            image_file = File(buffer, name=f"{self.unique_id}_barcode.png")
            self.barcode_image.save(f"{self.unique_id}_barcode.png", image_file, save=False)

            buffer.close()
            super().save(update_fields=["barcode_image"])

    def __str__(self):
        return f"{self.item_name} ({self.unique_id})"

class ProductLocation(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='product_locations')
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ('product', 'location')  # Ensure one entry per location per product

    def __str__(self):
        return f"{self.product.item_name} at {self.location.name} - Qty: {self.quantity}"