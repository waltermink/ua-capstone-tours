from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('locations_db', '0002_landmarkphoto'),
    ]

    operations = [
        migrations.CreateModel(
            name='LandmarkAudio',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('audio', models.FileField(upload_to='landmark_audio/%Y/%m/')),
                ('caption', models.CharField(blank=True, max_length=255)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('landmark', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='audio_files', to='locations_db.landmark')),
            ],
            options={
                'ordering': ['sort_order', 'uploaded_at'],
            },
        ),
        migrations.CreateModel(
            name='LandmarkVideo',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('video', models.FileField(upload_to='landmark_videos/%Y/%m/')),
                ('caption', models.CharField(blank=True, max_length=255)),
                ('sort_order', models.PositiveIntegerField(default=0)),
                ('uploaded_at', models.DateTimeField(auto_now_add=True)),
                ('landmark', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='video_files', to='locations_db.landmark')),
            ],
            options={
                'ordering': ['sort_order', 'uploaded_at'],
            },
        ),
    ]