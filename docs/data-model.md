# Data Model and Admin

This page documents the persisted schema in `locations_db` and the admin workflows built on top of it.

## Landmark Model

`locations_db.models.Landmark`

| Field | Type | Notes |
|---|---|---|
| `id` | `BigAutoField` | Primary key |
| `name` | `CharField(200)` | Landmark name |
| `short_description` | `TextField` | Used in list/map popup contexts |
| `long_description` | `TextField` | Used in detail view |
| `location` | `PointField(geography=True, srid=4326)` | Stored as longitude/latitude point |
| `address` | `CharField(255, blank=True)` | Optional display address |
| `is_published` | `BooleanField(default=True)` | Controls user visibility in API |
| `created_at` | `DateTimeField(auto_now_add=True)` | Creation timestamp |
| `updated_at` | `DateTimeField(auto_now=True)` | Last update timestamp |

Default ordering is by `name`.

## LandmarkPhoto Model

`locations_db.models.LandmarkPhoto`

| Field | Type | Notes |
|---|---|---|
| `id` | `BigAutoField` | Primary key |
| `landmark` | `ForeignKey(Landmark)` | Related name: `photos`, cascade delete |
| `image` | `ImageField` | Upload path: `landmark_photos/%Y/%m/` |
| `caption` | `CharField(255, blank=True)` | Optional caption |
| `alt_text` | `CharField(255, blank=True)` | Optional accessibility text |
| `sort_order` | `PositiveIntegerField(default=0)` | Manual photo ordering |
| `uploaded_at` | `DateTimeField(auto_now_add=True)` | Upload timestamp |

Default ordering is `sort_order`, then `uploaded_at`.

## Geospatial Conventions

- Points use SRID `4326`.
- Point creation order is `Point(lon, lat)`, not `Point(lat, lon)`.
- Serializer outputs expose separate `lat` and `lon` fields for clients.

## Publication Rules

- API list, detail, and nearby queries only return `is_published=True` landmarks.
- Unpublished landmarks are hidden from user-facing API responses.

## Django Admin Behavior

`locations_db.admin.LandmarkAdminForm` provides custom latitude/longitude form fields instead of direct `PointField` map input.

- Validates latitude in `[-90, 90]`
- Validates longitude in `[-180, 180]`
- Converts submitted values into `Point(lon, lat, srid=4326)` before save

`LandmarkPhoto` is managed inline within the `Landmark` admin edit page using a tabular inline.
