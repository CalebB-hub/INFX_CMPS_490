# Generated migration to remove old Lesson fields and align schema

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0005_add_lesson_fields'),
    ]

    operations = [
        # Remove user_id field that is NOT NULL
        migrations.RemoveField(
            model_name='lesson',
            name='user_id',
        ),
        # Remove module field
        migrations.RemoveField(
            model_name='lesson',
            name='module',
        ),
        # Remove score field
        migrations.RemoveField(
            model_name='lesson',
            name='score',
        ),
        # Remove completed_at field
        migrations.RemoveField(
            model_name='lesson',
            name='completed_at',
        ),
    ]
