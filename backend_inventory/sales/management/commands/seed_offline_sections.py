# sales/management/commands/seed_offline_sections.py
from django.core.management.base import BaseCommand
from sales.models import SalesChannel, SalesSection
from products.models import Location

class Command(BaseCommand):
    help = "Create Offline SalesSection entries for each Location"

    def handle(self, *args, **options):
        offline, _ = SalesChannel.objects.get_or_create(name="Offline")
        created = 0
        for loc in Location.objects.all():
            obj, was_created = SalesSection.objects.get_or_create(
                channel=offline, location=loc, defaults={"name": loc.name}
            )
            if was_created:
                created += 1
        self.stdout.write(self.style.SUCCESS(f"Created {created} Offline sections"))
