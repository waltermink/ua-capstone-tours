from django.shortcuts import render
from rest_framework.decorators import api_view # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import generics # type: ignore
from locations_db.models import Landmark, LandmarkPhoto
from .serializers import LandmarkListSerializer, LandmarkDetailSerializer

@api_view(["GET"])
# Simple health check endpoint to verify that the API is running
def health(request):
    return Response({"status": "ok"})

class LandmarkListView(generics.ListAPIView):
    serializer_class = LandmarkListSerializer

    def get_queryset(self):
        return Landmark.objects.filter(is_published=True).order_by("name")
    
class LandmarkDetailView(generics.RetrieveAPIView):
    serializer_class = LandmarkDetailSerializer
    
    def get_queryset(self):
        return Landmark.objects.filter(is_published=True)


