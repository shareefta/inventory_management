from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_role(request):
    user = request.user
    groups = user.groups.values_list('name', flat=True)
    return Response({'username': user.username, 'roles': list(groups)})
