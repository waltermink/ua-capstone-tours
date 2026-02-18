from django.contrib.gis.db import models

# Defines the Landmark model with fields for name, descriptions, location, address, publication status, and timestamps.
class Landmark(models.Model):
    name = models.CharField(max_length=200)

    short_description = models.TextField(
        help_text="Brief text for map popups and lists"
    )

    long_description = models.TextField(
        help_text="Full description shown on the detail page"
    )

    location = models.PointField(
        srid=4326,
        geography=True,
        help_text="Latitude/longitude of the landmark"
    )

    address = models.CharField(
        max_length=255,
        blank=True
    )

    is_published = models.BooleanField(
        default=True,
        help_text="Controls whether this landmark is visible to users"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name

# Defines the LandmarkPhoto model which is related to the Landmark model and includes fields for the image, caption,
# alt text, sort order, and upload timestamp.
class LandmarkPhoto(models.Model):
    landmark = models.ForeignKey(
        Landmark,
        related_name='photos',
        on_delete=models.CASCADE
    )

    image = models.ImageField(upload_to='landmark_photos/%Y/%m/')
    caption = models.CharField(max_length=255, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'uploaded_at']

    def __str__(self):
        return f"Photo for {self.landmark.name}"