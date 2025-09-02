# customers/views.py
from rest_framework import generics
from .models import Customer
from .serializers import CustomerSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

class CustomerListAPIView(generics.ListAPIView):
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        search = self.request.query_params.get('search', '')
        qs = Customer.objects.all()
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(mobile__icontains=search))
        return qs.order_by('name')[:50]