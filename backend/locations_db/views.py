from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    return HttpResponse("Testing Testing")

def map_view(request):
    return render(request, "map/map.html")