FROM python:3.12-slim

# Keeps Python from writing .pyc files and buffers logs less
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

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

# Expose the port the Django app runs on
EXPOSE 8000

# Create a non-root user
RUN addgroup --system appgroup && \
  adduser --system --ingroup appgroup appuser && \
  chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Run the Django development server
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]