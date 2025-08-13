# sales/management/commands/seed_sales_channels.py
from django.core.management.base import BaseCommand
from sales.models import SalesChannel

class Command(BaseCommand):
    help = "Seed SalesChannel with Online and Offline"

    def handle(self, *args, **options):
        for name in ["Online", "Offline"]:
            SalesChannel.objects.get_or_create(name=name)
        self.stdout.write(self.style.SUCCESS("Seeded SalesChannel"))