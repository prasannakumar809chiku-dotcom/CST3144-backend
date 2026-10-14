# CST3144 Backend (After-school Classes API)

Production-ready Node.js + Express backend for CST3144 coursework.

## Live backend URL

- https://cst3144-m01030169-backend.onrender.com

## Frontend URL

- GitHub Pages placeholder: `https://prasannakumar809chiku-dotcom.github.io/CST3144-frontend`

## Tech stack

- Node.js + Express
- MongoDB Atlas (native `mongodb` driver only)
- CORS + request logging middleware
- Static image serving from `/public/images`

## Environment variables

Copy `.env.example` to `.env` and set values:

- `PORT` (default 3000)
- `MONGODB_URI` (MongoDB Atlas connection string)
- `DB_NAME` (database name)
- `FRONTEND_URL` (your GitHub Pages frontend URL)

> Never commit credentials.

## Install and run

```bash
npm install
npm run seed
npm start
```

For development:

```bash
npm run dev
```

## API endpoints

### `GET /health`
Service health and database ping.

### `GET /lessons`
Returns lessons collection.

Supported query params:

- `q` or `search`: full search across lesson fields
- `teacher`: filter by teacher name
- `sortBy`: `subject | location | price | spaces | teacherName`
- `order`: `asc | desc`
- `minPrice`, `maxPrice`
- `page`, `limit` (pagination, limit max 200)

Example:

`/lessons?q=science&teacher=sarah&sortBy=price&order=asc`

### `POST /orders`
Creates an order and decrements lesson spaces.

Body:

```json
{
  "name": "John Smith",
  "phone": "07123456789",
  "items": [
    { "lessonId": "<lesson_object_id>", "quantity": 1 }
  ]
}
```

Validation:

- Name letters-only pattern
- Phone numbers-only pattern
- Quantity must be positive integer (max 10 per item)
- Max 20 items per order payload
- Prevents booking when spaces are insufficient

### `PUT /lessons/:id`
Updates any allowed lesson field (`subject`, `location`, `price`, `spaces`, `image`, `icon`, `description`, `teacher`, `teacherName`).

### `GET /enrolment/:lessonid`
Returns enrolment summary for a lesson:

- `spacesRemaining`
- `totalEnrolled`

## Seed and sample data

- Seed input: `data/lessons.seed.json` (10 lessons)
- Mongo export samples:
  - `data/exports/lessons.sample.json`
  - `data/exports/orders.sample.json`

## Postman

- Collection: `postman/CST3144-backend.postman_collection.json`

## Render deployment notes

- Included `render.yaml`
- Health check path: `/health`
- Set `MONGODB_URI`, `DB_NAME`, `FRONTEND_URL` in Render dashboard

## Static images

- Served from: `/images/*`
- Local sample assets:
  - `/images/sample-classroom.svg`
  - `/images/sample-science.svg`

## Health checks

For Render uptime checks, use `GET /health`.
