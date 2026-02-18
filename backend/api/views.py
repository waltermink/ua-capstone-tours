from django.shortcuts import render
from django.contrib.gis.db.models.functions import Distance as DistanceFunc
from django.contrib.gis.geos import Point
from django.contrib.gis.measure import Distance as DistanceMeasure
from rest_framework.decorators import api_view # type: ignore
from rest_framework.response import Response # type: ignore
from rest_framework import generics # type: ignore
from rest_framework.exceptions import ValidationError # type: ignore
from locations_db.models import Landmark, LandmarkPhoto
from .serializers import LandmarkListSerializer, LandmarkDetailSerializer, LandmarkNearbySerializer

@api_view(["GET"])
# Simple health check endpoint to verify that the API is running
def health(request):
    return Response({"status": "ok"})

# List view for landmarks, returns basic info for all published landmarks
class LandmarkListView(generics.ListAPIView):
    serializer_class = LandmarkListSerializer

    def get_queryset(self):
        return Landmark.objects.filter(is_published=True).order_by("name")

# Detail view for a single landmark, returns detailed info for one published landmark   
class LandmarkDetailView(generics.RetrieveAPIView):
    serializer_class = LandmarkDetailSerializer
    
    def get_queryset(self):
        return Landmark.objects.filter(is_published=True)

# View to find nearby landmarks based on lat/lon and radius query parameters
class LandmarkNearbyView(generics.ListAPIView):
    serializer_class = LandmarkNearbySerializer

    def get_queryset(self):
        params = self.request.query_params

        lat = params.get("lat")
        lon = params.get("lon")
        radius_m = params.get("radius_m", "500")  # default 500m

        if lat is None or lon is None:
            raise ValidationError({"detail": "lat and lon are required query parameters."})

        try:
            lat = float(lat)
            lon = float(lon)
            radius_m = float(radius_m)
        except ValueError:
            raise ValidationError({"detail": "lat, lon, and radius_m must be numbers."})

        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            raise ValidationError({"detail": "lat/lon are out of valid range."})

        if radius_m <= 0 or radius_m > 20000:
            raise ValidationError({"detail": "radius_m must be between 0 and 20000."})

        user_point = Point(lon, lat, srid=4326)  # IMPORTANT: Point(x=lon, y=lat)

        return (
            Landmark.objects.filter(is_published=True)
            .filter(location__distance_lte=(user_point, DistanceMeasure(m=radius_m)))
            .annotate(distance=DistanceFunc("location", user_point))
            .order_by("distance")
        )
