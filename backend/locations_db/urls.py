from django.urls import path
from . import views
from .views import map_view

urlpatterns = [
    path("", views.index, name="index"),
    path("map/", map_view, name="map"),
]