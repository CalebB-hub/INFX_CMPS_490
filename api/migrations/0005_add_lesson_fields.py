# Generated migration to add choices and answers fields to Lesson

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0004_module_lesson_completed_at_alter_lesson_score_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='lesson',
            name='choices',
            field=models.TextField(default='[]'),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='lesson',
            name='answers',
            field=models.TextField(default='[]'),
            preserve_default=False,
        ),
    ]
