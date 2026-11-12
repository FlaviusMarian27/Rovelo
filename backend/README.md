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
| POST   | `/api/auth/register`  | –      | `{firstName, lastName, email, password}` → `{token, user}` |
| POST   | `/api/auth/login`     | –      | `{email, password}` → `{token, user}`          |
| GET    | `/api/me`             | Bearer | contul logat                                   |
| PUT    | `/api/me`             | Bearer | `{firstName, lastName, nickname?, bio?, email}` → contul actualizat |
| PUT    | `/api/me/preferences` | Bearer | `{theme: system\|light\|dark}` → contul actualizat |
| DELETE | `/api/me`             | Bearer | șterge contul (și rutele salvate)              |
| GET    | `/api/routes`         | Bearer | rutele salvate, cele mai noi primele           |
| POST   | `/api/routes`         | Bearer | body = ruta (JSON) → `{id, savedAt, route}`    |
| DELETE | `/api/routes/{id}`    | Bearer | șterge o rută salvată (doar a ta)              |
| GET    | `/api/places`         | Bearer | locurile salvate, cele mai noi primele         |
| PUT    | `/api/places/{key}`   | Bearer | body = locul (JSON); salvează / actualizează   |
| DELETE | `/api/places/{key}`   | Bearer | scoate locul din salvate                       |

`user` = `{id, firstName, lastName, nickname, bio, email, theme}`. Nickname-ul e unic (3–30: litere, cifre, `.` `_`, salvat cu litere mici), bio max 160 caractere.

Erorile sunt JSON: `{"error": "..."}`, plus `"fields"` la validare.
Coduri: 400 date invalide, 401 fără token / token invalid / parolă greșită, 409 email deja folosit.

## Test rapid cu curl
```bash
# health
curl http://localhost:8080/api/health

# register (o singură dată per email)
curl -X POST http://localhost:8080/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"firstName":"Flavius","lastName":"Marian","email":"demo@rovelo.app","password":"rovelo123"}'

# login → copiază "token" din răspuns
curl -X POST http://localhost:8080/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@rovelo.app","password":"rovelo123"}'

# contul meu
TOKEN=<token-ul de mai sus>
curl http://localhost:8080/api/me -H "Authorization: Bearer $TOKEN"

# salvează o rută, apoi listează
curl -X POST http://localhost:8080/api/routes -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d '{"id":"r-test","title":"Test route","stops":[]}'
curl http://localhost:8080/api/routes -H "Authorization: Bearer $TOKEN"
```
De pe telefon (aceeași rețea): `http://<IP-laptop>:8080/...` (IP-ul din `hostname -I`).

## Baza de date
Tabelele le creează Hibernate la pornire (`ddl-auto: update`). Ca să te uiți în ea:
```bash
docker exec -it rovelo-db psql -U rovelo -d rovelo -c 'select id, first_name, last_name, nickname, email, theme from users;'
docker exec -it rovelo-db psql -U rovelo -d rovelo -c 'select id, user_id, saved_at, left(route_json, 60) from saved_routes;'
docker exec -it rovelo-db psql -U rovelo -d rovelo -c 'select place_key, saved_at, left(place_json, 60) from saved_places;'
```
