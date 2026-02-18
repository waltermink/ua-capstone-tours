from rest_framework import serializers # type: ignore
from locations_db.models import Landmark, LandmarkPhoto

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