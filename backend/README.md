# Rovelo backend

Spring Boot 4.1 (Java 21) + PostgreSQL 17 în Docker. Auth cu JWT (HS256), parole BCrypt.

## Prima dată
```bash
cd backend
cp .env.example .env        # schimbă POSTGRES_PASSWORD și JWT_SECRET în .env
docker compose up -d        # pornește PostgreSQL
mvn spring-boot:run         # pornește serverul pe portul 8080
```
`JWT_SECRET`: minim 32 de caractere, ex. `openssl rand -base64 48`.

## Endpoint-uri
| Metodă | Cale                  | Auth   | Ce face                                        |
|--------|-----------------------|--------|------------------------------------------------|
| GET    | `/api/health`         | –      | serverul rulează + conexiunea la DB            |
| POST   | `/api/auth/register`  | –      | `{name, email, password}` → `{token, user}`    |
| POST   | `/api/auth/login`     | –      | `{email, password}` → `{token, user}`          |
| GET    | `/api/me`             | Bearer | contul logat                                   |
| PUT    | `/api/me`             | Bearer | `{name, email}` → contul actualizat            |
| DELETE | `/api/me`             | Bearer | șterge contul                                  |

Erorile sunt JSON: `{"error": "..."}`, plus `"fields"` la validare.
Coduri: 400 date invalide, 401 fără token / token invalid / parolă greșită, 409 email deja folosit.

## Test rapid cu curl
```bash
# health
curl http://localhost:8080/api/health

# register (o singură dată per email)
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Flavius","email":"demo@rovelo.app","password":"rovelo123"}'

# login → copiază "token" din răspuns
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@rovelo.app","password":"rovelo123"}'

# contul meu
TOKEN=<token-ul de mai sus>
curl http://localhost:8080/api/me -H "Authorization: Bearer $TOKEN"
```
De pe telefon (aceeași rețea): `http://<IP-laptop>:8080/...` (IP-ul din `hostname -I`).

## Baza de date
Tabelele le creează Hibernate la pornire (`ddl-auto: update`). Ca să te uiți în ea:
```bash
docker exec -it rovelo-db psql -U rovelo -d rovelo -c 'select id, name, email, created_at from users;'
```
