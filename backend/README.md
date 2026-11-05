# Rovelo backend

Spring Boot 4.1 (Java 21) + PostgreSQL 17 în Docker.

## Prima dată
```bash
cd backend
cp .env.example .env        # apoi schimbă POSTGRES_PASSWORD în .env
docker compose up -d        # pornește PostgreSQL
mvn spring-boot:run         # pornește serverul pe portul 8080
```

## Verificare
```bash
curl http://localhost:8080/api/health
# {"status":"ok","db":"up"}
```
De pe telefon (aceeași rețea): `http://<IP-laptop>:8080/api/health` (IP-ul din `hostname -I`).

## Endpoint-uri
| Metodă | Cale          | Ce face                                |
|--------|---------------|----------------------------------------|
| GET    | `/api/health` | serverul rulează + conexiunea la DB    |
