FROM python:3.12-slim

# Keeps Python from writing .pyc files and buffers logs less
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    DJANGO_SETTINGS_MODULE=config.settings

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gdal-bin \
    libgdal-dev \
    libgeos-dev \
  && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Create a non-root user
RUN addgroup --system appgroup && \
  adduser --system --ingroup appgroup appuser && \
  chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 8080

# Run the Gunicorn WSGI server
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8080", "--workers", "2", "--log-level", "info"]