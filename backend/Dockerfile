FROM python:3.12.12

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
	PYTHONUNBUFFERED=1 \
	DJANGO_SETTINGS_MODULE=backend.settings

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
	pip install --no-cache-dir -r /app/requirements.txt

COPY . /app

EXPOSE 10000

CMD ["sh", "-c", "python manage.py collectstatic --no-input && python manage.py migrate && gunicorn backend.wsgi:application --bind 0.0.0.0:${PORT:-10000} --workers ${WEB_CONCURRENCY:-2}"]