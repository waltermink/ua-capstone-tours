from django.contrib.gis.geos import Point
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from locations_db.models import Landmark


class LandmarkApiIntegrationTests(APITestCase):
    def create_landmark(
        self,
        *,
        name,
        lat,
        lon,
        is_published=True,
        short_description="Short description",
        long_description="Long description",
        address="Tuscaloosa, AL",
    ):
        return Landmark.objects.create(
            name=name,
            short_description=short_description,
            long_description=long_description,
            address=address,
            is_published=is_published,
            location=Point(lon, lat, srid=4326),
        )

    def test_landmark_list_returns_only_published_landmarks_ordered_by_name(self):
        self.create_landmark(name="Bryant Museum", lat=33.2110, lon=-87.5410)
        self.create_landmark(name="Alabama Museum", lat=33.2100, lon=-87.5400)
        self.create_landmark(
            name="Hidden Landmark",
            lat=33.2150,
            lon=-87.5500,
            is_published=False,
        )

        response = self.client.get(reverse("landmark-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual(len(payload), 2)
        self.assertEqual([item["name"] for item in payload], ["Alabama Museum", "Bryant Museum"])
        self.assertEqual(payload[0]["lat"], 33.21)
        self.assertEqual(payload[0]["lon"], -87.54)

    def test_landmark_detail_returns_published_landmark_and_404_for_unpublished(self):
        published = self.create_landmark(
            name="Denny Chimes",
            lat=33.2095,
            lon=-87.5433,
            short_description="Clock tower",
            long_description="Historic clock tower on campus.",
            address="719 University Blvd, Tuscaloosa, AL",
        )
        unpublished = self.create_landmark(
            name="Internal Site",
            lat=33.2085,
            lon=-87.5420,
            is_published=False,
        )

        ok_response = self.client.get(reverse("landmark-detail", args=[published.id]))

        self.assertEqual(ok_response.status_code, status.HTTP_200_OK)
        ok_payload = ok_response.json()
        self.assertEqual(ok_payload["id"], published.id)
        self.assertEqual(ok_payload["name"], "Denny Chimes")
        self.assertEqual(ok_payload["address"], "719 University Blvd, Tuscaloosa, AL")
        self.assertEqual(ok_payload["photos"], [])

        not_found_response = self.client.get(reverse("landmark-detail", args=[unpublished.id]))
        self.assertEqual(not_found_response.status_code, status.HTTP_404_NOT_FOUND)

    def test_landmark_nearby_returns_only_published_landmarks_within_radius_sorted_by_distance(self):
        near = self.create_landmark(name="Near Landmark", lat=33.2090, lon=-87.5690)
        middle = self.create_landmark(name="Middle Landmark", lat=33.2100, lon=-87.5690)
        self.create_landmark(name="Far Landmark", lat=33.2400, lon=-87.5690)
        self.create_landmark(
            name="Hidden Nearby",
            lat=33.2091,
            lon=-87.5690,
            is_published=False,
        )

        response = self.client.get(
            reverse("landmark-nearby"),
            {"lat": "33.2090", "lon": "-87.5690", "radius_m": "300"},
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        payload = response.json()
        self.assertEqual([item["id"] for item in payload], [near.id, middle.id])
        self.assertLessEqual(payload[0]["distance_m"], payload[1]["distance_m"])

    def test_landmark_nearby_requires_lat_and_lon_query_params(self):
        response = self.client.get(reverse("landmark-nearby"))

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            response.json()["detail"],
            "lat and lon are required query parameters.",
        )
