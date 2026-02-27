# INFX_CMPS_490

A full-stack web application using Django (backend) and Vite + React (frontend).

## Project Structure

```
.
├── backend/          # Django project settings
├── api/              # Django REST API app
├── frontend/         # Vite + React frontend
├── manage.py         # Django management script
├── requirements.txt  # Python dependencies
└── db.sqlite3        # SQLite database (created after migrations)
```

## Prerequisites

- Python 3.8+
- Node.js 16+
- npm 8+

## Backend Setup (Django)

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run database migrations:
```bash
python manage.py migrate
```

3. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

4. Start the Django development server:
```bash
python manage.py runserver
```

The Django API will be available at `http://localhost:8000/`

### Local Database Setup

1. Ensure that PostgreSQL version 17 is installed

2. Once PostgreSQL is setup, create a new database named "phishfree_db"

3. Run the following command:
```bash
pip install django psycopg2-binary
```

4. Ensure python-dotenv is installed:
```bash
pip install python-dotenv
```

5. Create a .env file in the project (if not already made), ensure it is included in .gitignore, and put this in it:
```bash
DB_NAME=phishfree_db
DB_USER=postgres
DB_PASSWORD=password
DB_HOST=localhost
DB_PORT=5432
```
6. Replace "DB_PASSWORD" with your own password for Postgres

7. If you would like to use a different user, replace DB_USER

8. Run the following to create the tables:
```bash
pytgon manage.py makemigrations
python manage.py migrate
```
Your local database is now set up!

### API Endpoints

- `http://localhost:8000/api/hello/` - Test endpoint that returns a greeting
- `http://localhost:8000/api/auth/signup/` - User registration
- `http://localhost:8000/api/auth/login/` - User login, returns JWT access/refresh tokens
- `http://localhost:8000/api/auth/password-policy/` - Password policy for frontend validation
- `http://localhost:8000/admin/` - Django admin interface

## Frontend Setup (Vite + React)

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the Vite development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173/`

## Development Workflow

1. Start the Django backend:
```bash
python manage.py runserver
```

2. In a separate terminal, start the Vite frontend:
```bash
cd frontend
npm run dev
```

3. The Vite dev server will proxy API requests to Django automatically.

## Features

- **Django Backend**: REST API with Django REST Framework
- **CORS Support**: Pre-configured for local development
- **Vite Frontend**: Fast HMR (Hot Module Replacement) for React development
- **API Proxy**: Vite configured to proxy `/api` requests to Django backend
- **SQLite Database**: Simple database setup for development

## Building for Production

### Frontend Build

```bash
cd frontend
npm run build
```

This creates a production-ready build in `frontend/dist/`

### Serving Frontend from Django

To serve the built frontend from Django in production:

1. Build the frontend (see above)
2. Update Django settings to serve static files from `frontend/dist/`
3. Deploy using your preferred method (e.g., Gunicorn, uWSGI)

## Technology Stack

- **Backend**: Django 6.0.2, Django REST Framework 3.16.1
- **Frontend**: Vite 8.x, React 18.x
- **Database**: SQLite (development)
- **CORS**: django-cors-headers 4.9.0
