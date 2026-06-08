# Restaurants Finder API

A Fastify-based REST API for searching and managing restaurant locations. It supports JWT authentication, geospatial search with PostGIS, bulk JSON uploads via streaming, and rate limiting backed by Redis.

---

## Tech Stack Choices

### Core

| Layer                 | Choice                    |
|-----------------------|---------------------------|
| Runtime               | Node.js 22                |
| Framework             | Fastify 5                 |
| Language              | TypeScript                |
| Database              | PostgreSQL 16 + PostGIS   |
| Cache / rate limiting | Redis                     |
| ORM                   | TypeORM                   |

### TypeORM

TypeORM was chosen as the data access layer because it integrates cleanly with PostgreSQL and PostGIS, supports migrations and entity definitions in TypeScript, and provides both repository APIs and raw SQL when spatial queries need fine-grained control.


### Rate Limiter with Redis

`@fastify/rate-limit` is configured with an **ioredis** client so rate-limit counters are shared across all application instances. This matters when the API runs behind a load balancer or in multiple containers.

### Stream Data Upload

Large location datasets are imported through `POST /v1/locations/upload` without loading the entire JSON file into memory, `stream-json` + `stream-chain` to parse JSON incrementally.

### Dependency Injection (Singleton Services)

Services are registered once per Fastify instance via a dedicated plugin (`servicesPlugin`). Each service receives its required dependencies at construction time:

- `AuthService` — `DataSource`, logger
- `LocationService` — `DataSource`, logger

The database connection is also a singleton: `createDb()` initializes a single TypeORM `DataSource` and reuses it for the lifetime of the process. Services are exposed on the Fastify instance (`fastify.authService`, `fastify.locationService`) so route handlers stay thin and testable.


### Geospatial Storage: PostGIS vs Cache Grids vs Elasticsearch

When designing the location search API to find restaurants near a user's coordinate `(x, y)` within their custom delivery radius, three primary architectural strategies were evaluated.

| Approach                              | The Upside                                | The Downside                                              |
| :-------------------------------------| :---------------------------------------- | :-------------------------------------------------------- |
| **PostGIS** <br>*(Chosen)*            | **Perfect For Current Scale:** Effortlessly handles up to **2,000–3,000 read/write RPS** natively. It keeps spatial data instantly consistent with users/auth data in a single relational store. **Zero extra infrastructure to maintain.** | Scaling beyond 3,000+ RPS requires complex replica management; advanced full-text fuzzy matching is not its primary strength compared to dedicated engines. |
| **Elasticsearch**                     | **The Big Tech Gold Standard:** Unmatched speed for full-text, fuzzy, and faceted searches (e.g., matching *"Steakhaus open now"*). Highly horizontally scalable for massive, read-heavy global infrastructure. | **Overengineering for This Exercise:** Moving data across a network boundary introduces sync lag (eventual consistency). |
| **Cache Grids** <br>*(e.g., Redis)*   | **Sub-Millisecond Speed:** Incredibly fast point lookups if geometric data fits entirely into in-memory key-value pairs or hashes. | **Math & Invalidation Nightmare:** Calculating dynamic, variable delivery radii per restaurant inside a strict grid tile system is highly complex. High concurrent bulk writes make cache invalidation complicated using mutex locking. |

### Architectural Decision

We chose **PostGIS** because it perfectly matches the current scale requirements of this exercise without introducing premature optimization or unnecessary infrastructure. 

Since the system already utilizes PostgreSQL for user management and token authentication, leveraging PostGIS allows us to build a highly optimized, single-database spatial search pipeline using native database features:

1. **`ST_MakeEnvelope` / `ST_Expand`:** Instantly narrows down spatial rows to a localized bounding box using a high-performance **GiST index**.
2. **`<->` Operator:** Employs index-driven K-Nearest Neighbors (KNN) to sort matching restaurants by distance instantly.
3. **`distance <= radius`:** Dynamically filters out any restaurant whose custom delivery radius cannot reach the user's current coordinates.

## Prerequisites

- Node.js >= 20
- Docker and Docker Compose (for PostgreSQL, PostGIS, and Redis)


## Running the Application

### Local development

#### 1. Start infrastructure

```bash
docker compose up postgres redis -d
```

PostgreSQL listens on port **5433** (mapped from container `5432`). 
Redis listens on **6379**.

#### 2. Configure environment

```bash
cp .env.example .env
```

Adjust values in `.env` if needed. Defaults match the Docker Compose services.

#### 3. Install dependencies

```bash
npm install
```

#### 4. Build and prepare the database

```bash
npm run build
npm run typeorm -- migration:run
npm run seed
```

#### 5. Start the server

```bash
# Development (watch mode)
npm run dev

# Production
npm start
```

Server output will include:

```
Server listening on http://0.0.0.0:3000
Swagger docs available at http://0.0.0.0:3000/docs
```

### Default seed admin user

After seeding, an admin account is created:

| Field    | Value          |
|----------|----------------|
| Username | `kashif.ali`   |
| Password | `admin`        |

Use `POST /v1/auth/token` to obtain a JWT, then pass it as `Authorization: Bearer <token>` on protected routes.

### Upload format

Upload a JSON file with a top-level `"locations"` array:

```json
{
  "locations": [
    {
      "name": "Example Restaurant",
      "type": "restaurant",
      "radius": 500,
      "coordinates": "x=100,y=200"
    }
  ]
}
```

---

## Running Tests

```bash
npm test
```

This prepares the test database (`restaurants_test`) and runs the Vitest integration suite.

---

## Useful Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled server |
| `npm run typeorm -- migration:run` | Apply database migrations |
| `npm run typeorm -- migration:revert` | Revert last migration |
| `npm run seed` | Seed admin user |
| `npm test` | Run integration tests |
| `npm run lint` | Lint and format |

---

See `.env.example` for a full template.
