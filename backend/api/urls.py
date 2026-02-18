from django.urls import path
from .views import health, LandmarkListView, LandmarkDetailView

urlpatterns = [
    path("health/", health, name="api-health"),
    path("landmarks/", LandmarkListView.as_view(), name="landmark-list"),
    path("landmarks/<int:pk>/", LandmarkDetailView.as_view(), name="landmark-detail"),
]