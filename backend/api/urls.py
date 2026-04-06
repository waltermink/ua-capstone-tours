from django.urls import path
from .views import health, LandmarkListView, LandmarkDetailView, LandmarkNearbyView, LandmarkFullListView, LandmarkMediaListView

urlpatterns = [
    path("health/", health, name="api-health"),
    path("landmarks/", LandmarkListView.as_view(), name="landmark-list"),
    path("landmarks/full/", LandmarkFullListView.as_view(), name="landmark-full-list"),
    path("landmarks/media/", LandmarkMediaListView.as_view(), name="landmark-media-list"),
    path("landmarks/<int:pk>/", LandmarkDetailView.as_view(), name="landmark-detail"),
    path("landmarks/nearby/", LandmarkNearbyView.as_view(), name="landmark-nearby"),
]