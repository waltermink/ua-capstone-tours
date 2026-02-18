from rest_framework import serializers # type: ignore
from locations_db.models import Landmark, LandmarkPhoto

# Serializes a list of landmarks with basic info for the list view
class LandmarkListSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()

    class Meta:
        model = Landmark
        fields = ["id", "name", "short_description", "lat", "lon"]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None
    
    def get_lon(self, obj):
        return obj.location.x if obj.location else None
    
# Serializes detailed info about a single landmark for the detail view
class LandmarkDetailSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()

    class Meta:
        model = Landmark
        fields = ["id", "name", "short_description", "long_description", "lat", "lon", "address"]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None
    
    def get_lon(self, obj):
        return obj.location.x if obj.location else None
    
# Serializes nearby landmarks with distance info for the nearby landmarks endpoint
class LandmarkNearbySerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()
    distance_m = serializers.SerializerMethodField()

    class Meta:
        model = Landmark
        fields = ["id", "name", "short_description", "lat", "lon", "distance_m"]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None
    
    def get_lon(self, obj):
        return obj.location.x if obj.location else None
    
    def get_distance_m(self, obj):
        dist = getattr(obj, "distance", None)
        return round(dist.m, 2) if dist is not None else None