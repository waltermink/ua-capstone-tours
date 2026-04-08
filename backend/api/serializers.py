from rest_framework import serializers # type: ignore
from locations_db.models import Landmark, LandmarkPhoto
from django.contrib.gis.geos import Point

# Serializes photos related to a landmark, including the URL and metadata for each photo
class LandmarkPhotoSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = LandmarkPhoto
        fields = ["id", "url", "caption", "alt_text", "sort_order"]

    # Returns an absolute URL if possible, otherwise returns the relative URL
    def get_url(self, obj):
        if not obj.image:
            return None
        
        request = self.context.get("request")
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url

# Serializes a list of landmarks with basic info for the list view
class LandmarkListSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()

    class Meta:
        model = Landmark
        fields = ["id", "name", "short_description", "category", "lat", "lon"]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None
    
    def get_lon(self, obj):
        return obj.location.x if obj.location else None
    
class LandmarkFullListSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()
    photos = serializers.SerializerMethodField()

    class Meta:
        model = Landmark
        fields = ["id", "name", "short_description", "long_description", "category", "lat", "lon", "address", "photos"]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None

    def get_lon(self, obj):
        return obj.location.x if obj.location else None

    def get_photos(self, obj):
        first_photo = obj.photos.first()
        if not first_photo or not first_photo.image:
            return []
        request = self.context.get("request")
        url = first_photo.image.url
        return [{
            "id": first_photo.id,
            "url": request.build_absolute_uri(url) if request else url,
            "caption": first_photo.caption,
            "alt_text": first_photo.alt_text,
            "sort_order": first_photo.sort_order,
        }]

# Serializes detailed info about a single landmark for the detail view
class LandmarkDetailSerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()
    photos = LandmarkPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = Landmark
        fields = ["id", "name", "short_description", "long_description", "category", "lat", "lon", "address", "photos"]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None

    def get_lon(self, obj):
        return obj.location.x if obj.location else None

# Serializes nearby landmarks with distance info for the nearby landmarks endpoint
class LandmarkNearbySerializer(serializers.ModelSerializer):
    lat = serializers.SerializerMethodField()
    lon = serializers.SerializerMethodField()
    distance_m = serializers.SerializerMethodField()
    cover_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = Landmark
        fields = ["id", "name", "short_description", "category", "lat", "lon", "distance_m", "cover_photo_url"]

    def get_lat(self, obj):
        return obj.location.y if obj.location else None
    
    def get_lon(self, obj):
        return obj.location.x if obj.location else None
    
    # Returns the distance from query point in meters rounded to 2 decimal places, or None if distance is not available
    def get_distance_m(self, obj):
        dist = getattr(obj, "distance", None)
        return round(dist.m, 2) if dist is not None else None
    
    # Returns the URL of the first photo for this landmark, or None if no photos are available
    def get_cover_photo_url(self, obj):
        first_photo = obj.photos.first()
        
        if not first_photo or not first_photo.image:
            return None
        
        request = self.context.get("request")
        url = first_photo.image.url
        return request.build_absolute_uri(url) if request else url

# Serializer for creating a new landmark, accepts lat/lon as separate fields and converts to Point, defaults to unpublished
class LandmarkCreateSerializer(serializers.ModelSerializer):
    lat = serializers.FloatField(write_only=True)
    lon = serializers.FloatField(write_only=True)

    class Meta:
        model = Landmark
        fields = ["name", "short_description", "long_description", "category", "lat", "lon", "address"]

    def create(self, validated_data):
        lat = validated_data.pop("lat")
        lon = validated_data.pop("lon")
        location = Point(lon, lat, srid=4326)  # IMPORTANT: Point(x=lon, y=lat)
        landmark = Landmark.objects.create(
            location=location,
            is_published=False, # New landmarks are unpublished by default 
            **validated_data
        )
        return landmark
