from django.contrib.gis.db import models

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
