# Course Scraper API

An application that serves school course listings from S3 with Redis caching.

## Admin UI Panel

The admin UI panel is available at `http://localhost:8000` after running the application.

**Default Admin Credentials:**
```
Username: course-scraper
Password: Z5pGa5hLs850
```

The admin panel allows you to:
- Test course listing API
- Manage school entries
- Monitor Flower tasks
- Browse S3 files

## API Documentation

### Course Listing API
```
GET https://course-scraper.kogocampus.com/api/course-listing/{school_name}
```

Retrieves course listing data for a specific school.

**Authentication:**
- Admin: Basic auth with admin credentials (same as admin UI)
- Students: Bearer token from student manager service

**Response Format:**
```json
{
  "courses": [
    {
      "code": "CMPT 120",
      "title": "Introduction to Computing Science and Programming I",
      "units": 3,
      "description": "An elementary introduction to computing science and computer programming...",
      "prerequisites": ["Grade 12 Computer Science or equivalent"],
      "sections": [
        {
          "type": "LEC",
          "section": "D100",
          "instructor": "John Doe",
          "schedule": ["Mon 10:30-12:20", "Wed 10:30-11:20"],
          "location": "AQ 3150",
          "enrollment": {"current": 120, "total": 150}
        }
      ]
    }
  ],
  "metadata": {
    "school": "SFU",
    "term": "Spring 2024",
    "last_updated": "2024-01-10T12:00:00Z"
  }
}
```

**Status Codes:**
- 200: Success
- 401: Authentication failed
- 404: School not found
- 500: Server error

## Setup
1. Copy .env.example to .env and populate with your values.
```
cp .env.example .env
```

2. Run docker compose to build and run the container:
```
docker compose up
# or
sudo docker compose up --build
```

## Edit the environment variables for the production environments

1. Install SOPS:
```
brew install sops
```

2. Decrypt the environment file:
```
sops --config .sops/sops.yaml -d -i .sops/prod.env
```

3. Fill in the missing values in the `values.env` file.

4. Encrypt the environment file:
```
sops --config .sops/sops.yaml -e -i .sops/prod.env
```