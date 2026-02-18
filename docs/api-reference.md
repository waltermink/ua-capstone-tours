# API Reference

All API routes are under `/api/`.

## Health Check

### `GET /api/health/`

Returns service status.

Example response:

```json
{
  "status": "ok"
}
```

## Landmarks List

### `GET /api/landmarks/`

Returns all published landmarks ordered by name.

Response fields:

- `id`
- `name`
- `short_description`
- `lat`
- `lon`

Example item:

```json
{
  "id": 1,
  "name": "Denny Chimes",
  "short_description": "Historic campus clock tower",
  "lat": 33.2095,
  "lon": -87.5433
}
```

## Landmark Detail

### `GET /api/landmarks/<id>/`

Returns one published landmark with full details and related photos.

Response fields:

- `id`
- `name`
- `short_description`
- `long_description`
- `lat`
- `lon`
- `address`
- `photos` (ordered by `sort_order`, then upload time)

Photo object fields:

- `id`
- `url`
- `caption`
- `alt_text`
- `sort_order`

Behavior notes:

- Returns `404` if landmark does not exist or is unpublished.
- Photo `url` is absolute when request context is present.

## Nearby Landmarks

### `GET /api/landmarks/nearby/?lat=<value>&lon=<value>&radius_m=<meters>`

Finds published landmarks within a radius from a user point.

Query parameters:

- `lat` (required)
- `lon` (required)
- `radius_m` (optional, default `500`, max `20000`, must be > `0`)

Returns results ordered by nearest first.

Response fields:

- `id`
- `name`
- `short_description`
- `lat`
- `lon`
- `distance_m` (rounded to 2 decimals)
- `cover_photo_url` (first related photo, if present)

Validation errors return HTTP `400` with a `detail` message, including:

- Missing coordinates: `lat and lon are required query parameters.`
- Invalid numeric values: `lat, lon, and radius_m must be numbers.`
- Invalid coordinate range: `lat/lon are out of valid range.`
- Invalid radius range: `radius_m must be between 0 and 20000.`

## Temporary Non-API Route

`GET /locations_db/` returns a simple plain-text response used as a temporary app route.
