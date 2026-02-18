from django import forms
from django.contrib import admin
from django.contrib.gis.geos import Point
from .models import Landmark, LandmarkPhoto

# Creates a custom form for adding and editing landmarks in the Django admin interface
class LandmarkAdminForm(forms.ModelForm):
    # These fields are not part of the model but are used for inputting the location while the base map UI seems to be broken
    latitude = forms.FloatField(required=True)
    longitude = forms.FloatField(required=True)

    # Controls which fields are shown in the admin form from the Landmark model, we exclude the location field since we handle it with latitude and longitude
    class Meta:
        model = Landmark
        fields = ["name", "short_description", "long_description", "address", "is_published"]

    # When editing an existing landmark, we want to populate the latitude and longitude fields with the current location values
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.location:
            self.fields["latitude"].initial = self.instance.location.y
            self.fields["longitude"].initial = self.instance.location.x

    # We validate the latitude and longitude values to ensure they are within valid ranges before saving the landmark
    def clean(self):
        cleaned = super().clean()
        lat = cleaned.get("latitude")
        lon = cleaned.get("longitude")

        if lat is None or lon is None:
            return cleaned

        if not (-90 <= lat <= 90):
            self.add_error("latitude", "Latitude must be between -90 and 90.")
        if not (-180 <= lon <= 180):
            self.add_error("longitude", "Longitude must be between -180 and 180.")

        return cleaned

    # When saving the landmark, we convert the latitude and longitude into a Point object and assign it to the location field of the model before saving to the database
    def save(self, commit=True):
        obj = super().save(commit=False)
        lat = self.cleaned_data["latitude"]
        lon = self.cleaned_data["longitude"]
        obj.location = Point(lon, lat, srid=4326)  # lon,lat order
        if commit:
            obj.save()
        return obj
    
# Allows us to manage photos associated with a landmark directly from the landmark edit page
class LandmarkPhotoInline(admin.TabularInline):
    model = LandmarkPhoto
    extra = 1
    fields = ("image", "caption", "alt_text", "sort_order")

# We register the Landmark model with the custom LandmarkAdmin to use our form and display settings in the Django admin interface
@admin.register(Landmark)
class LandmarkAdmin(admin.ModelAdmin):
    form = LandmarkAdminForm
    list_display = ("name", "is_published")
    search_fields = ("name",)
    inlines = [LandmarkPhotoInline]