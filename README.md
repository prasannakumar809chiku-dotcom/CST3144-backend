# CST3144 Backend – After School Classes

Node.js/Express/MongoDB backend for the CST3144 coursework application.

## Local setup

```bash
npm install
cp .env.example .env
npm start
```

Set `MONGODB_URI` in `.env` before starting. The server creates and seeds the `lesson` collection when it is empty.

## Environment variables

- `MONGODB_URI` – MongoDB Atlas connection string.
- `DB_NAME` – database name, normally `cst3144`.
- `FRONTEND_URL` – allowed frontend origin, or `*` for development.
- `PORT` – server port; Render supplies this automatically.

## API endpoints

- `GET /` – API information.
- `GET /health` – database readiness health check.
- `GET /lessons` – return all lessons.
- `GET /lessons/search?q=math` – search by topic, location, price, or available spaces.
- `POST /orders` – create an order with `name`, `phone`, `lessonIDs`, and `spaces`.
- `PUT /lessons/:id` – update lesson fields such as `space`.
- `GET /enrolment/:lessonid` – count orders containing a lesson ID.
- `GET /images/:filename` – serve files from `public/images`.

## Render deployment

Use build command `npm install`, start command `npm start`, and configure the environment variables above in Render. Never commit `.env` or database credentials.

## Postman testing

Import `postman_collection.json` into Postman. Set `baseUrl` to the local or deployed API, run **GET all lessons**, copy a returned `_id` into the `lessonId` collection variable, then test orders, updates, enrolment, and health.

Student M01030169 – CST3144 Full Stack Development 2026–27
