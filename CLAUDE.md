# Rovelo — context pentru Claude

Proiect PAAM (Proiectarea și analiza aplicațiilor mobile), anul 4, UPT. Proiect *vibe-coded*:
codul se scrie cu Claude, eu (Flavius) decid produsul, designul și arhitectura și testez pe telefon.

## Cum lucrăm
- Vorbește-mi în română, direct, casual și concis. Termenii tehnici pot rămâne în engleză.
- Pas cu pas: o schimbare / un ecran odată, ca să pot testa pe telefon între pași.
- Commit-uri mici, mesaje clare, în engleză.
- Când ceva nu merge, cere-mi eroarea exactă sau un screenshot de pe telefon.

## Reguli
- Niciodată chei de API sau `.env` în git. Cheia modelului AI stă doar pe server.
- Nu rula `npm audit fix --force`.
- Pachete Expo: `npx expo install <pachet>` (versiuni compatibile cu SDK-ul), nu `npm install`.
- Ignoră erorile/avertismentele din varianta web; testez doar pe telefon cu Expo Go.
- Culori, spațieri, fonturi doar din `mobile/src/constants/theme.ts`, nu hardcodate în ecrane.

## Ideea
Ghid de plimbare prin orice oraș, condus de un agent AI preantrenat (apelat prin API, nu
antrenat de mine). Alegi timpul (1h / 2h / 3h+), interesele și startul; agentul face un traseu
pe jos din date OpenStreetMap; aplicația te ghidează live și replanifică dacă întârzii; pozezi o
clădire și primești povestea ei. Timișoara e orașul de test.
Uneltele agentului (function calling): `search_places`, `build_route`,
`get_current_location_context`, `recognize_landmark`, `save_trip`.

## Stack
- `mobile/`: React Native + Expo SDK 58, expo-router (rutele în `src/app/`, nu `app/`),
  TypeScript, Reanimated, react-native-maps, expo-location, expo-camera, expo-image-picker,
  lucide-react-native, font Inter.
- `backend/`: Spring Boot 4.1 (Java 21, Maven), PostgreSQL 17 în Docker, auth JWT (HS256) +
  BCrypt. Pachete în `ro.rovelo.backend`: `auth`, `user`, `route`, `security`, `common`, `health`.
  Endpoint-urile sunt în `backend/README.md`. Spring AI: încă nu.
- `docs/`: prototip Figma (`Rovelo.png` / `.pdf`), use case diagram, iconița.

Rulare (3 terminale):
1. `cd backend && docker compose up -d && mvn spring-boot:run`
2. firewall (doar cât lucrez): `sudo ufw allow from 192.168.0.0/24 to any port 8080 proto tcp`
   (și 8081 pentru Expo cu `--lan`)
3. `cd mobile && npx expo start --lan -c` (sau `--tunnel` pentru Expo; API-ul merge direct pe IP)
`mobile/.env`: `EXPO_PUBLIC_API_URL=http://<IP-laptop>:8080` (IP din `hostname -I`). După orice
schimbare în `.env`, Expo trebuie repornit cu `-c`. Secretele backend-ului: `backend/.env`.
Cont demo în PostgreSQL: `demo@rovelo.app` / `rovelo123`.
Rețea: pe S24 conexiunea spre laptop e blocată (VPN / setare pe telefon); testez pe S10+.
Wi-Fi-ul căminului merge doar cu regula de firewall. Alternativă sigură: cablu USB + `adb reverse`.
Claude nu poate compila backend-ul (Maven Central blocat în mediul lui): eu rulez `mvn` și trimit erorile.

## Structura `mobile/src`
- `app/_layout.tsx`: fonturi, splash animat, `SessionProvider` → `TransitionProvider` →
  `RouteProvider` (key = user) → Stack cu `Stack.Protected` (auth vs app).
- `app/(auth)/`: welcome, login, register.
- `app/(tabs)/`: `home` (Preferences), `route/` (Stack: `index` = Your route,
  `navigation`, `place/[id]`), `saved`, `profile`.
- `app/scan.tsx`: camera, modal full-screen peste taburi.
- `components/ui/`: Button, Input, Chip, Segmented, StartSelect, Menu, EmptyState, AuthForm…
- `components/route/route-map.tsx` (+ `.web.tsx` doar ca web-ul să nu crape).
- `components/animated-splash.tsx`: animația de pornire din straturile iconiței
  (`assets/images/splash/`).
- `context/session.tsx`: auth prin backend; `signIn`/`signUp` doar verifică, `startSession` pornește
  sesiunea (ca animația de intrare să acopere ecranul înainte). Token în `expo-secure-store`,
  verificat la pornire cu `GET /api/me`. Guest = doar local.
- `services/api.ts`: clientul HTTP (timeout, erori `{error}` de la server); `services/routes-api.ts`.
- `context/transition.tsx`: animațiile auth ↔ app.
- `context/route.tsx`: ruta activă, progresul pe traseu (`walk`), rute salvate (pe server, prin
  `/api/routes`; Guest local), locuri salvate (încă doar în memorie).
- `hooks/use-position.ts` (GPS + demo), `hooks/use-walk-progress.ts` (sosire/plecare, întârziere).
- `services/agent.ts`: **mock-urile "agentului"** (replan, recognize); generarea rutei e mock în
  `context/route.tsx`. Se înlocuiesc cu apeluri spre backend, fără să schimbi ecranele.
- `data/mock.ts`: locuri și rute din Timișoara, poveștile locurilor.
- `utils/geo.ts` (distanțe, `buildRoute`), `utils/schedule.ts` (plan în timp, întârziere).
- `types/index.ts`: `Route`, `Stop`, `Leg`, `Coord`, `PlaceStory`… = forma răspunsurilor API.

## Decizii luate
- **Ordinea opririlor o alege cine creează ruta.** Aplicația nu optimizează ordinea; păstrează
  `stops` exact cum vin și calculează doar drumul și timpii dintre ele. Opțional mai târziu:
  „Suggest best order”.
- Rutele au oricâte opriri (limită rezonabilă ~8–10); UI-ul nu presupune un număr fix.
- Forma rutei: `stops` (cu `coord`, `visitMinutes`), `legs` (minute + metri între opriri),
  `path` (linia de pe hartă), `totalMinutes`, `distanceKm`. Acum `path` = linie dreaptă și
  timpii sunt estimați (distanță × 1.3, 75 m/min); backend-ul va da drumul pe străzi.
- Harta: **nativă** (Google pe Android, Apple pe iOS) cu stil alb în `constants/map-style.ts`.
  Tile-urile CARTO cer cheie, tile.openstreetmap.org nu e permis pentru aplicații. Pentru un
  build propriu pe Android trebuie cheie Google Maps.
- Navigare: sosire la ≤30 m, plecare automată la >60 m; ceasul planului pornește la prima
  oprire; banner de întârziere de la 5 min; demo mode pentru test de acasă.
- Replan: scoate opririle viitoare care economisesc cel mai mult timp; card
  „Updated route: removed X, saved N min” cu Accept / Keep original.
- „Add to route” adaugă la finalul rutei.
- Roșul: `#BF1C21` (din `docs/icon.png`), singurul accent.
- Bara de jos: Home · Route · Saved · Profile. Mai târziu, socialul (For you / Friends) ar
  înlocui Saved cu Explore, iar salvatele trec în Profile.

## Status
- [x] UI complet cu date false: auth + animații, Preferences, Your route + hartă,
  Live navigation (GPS, demo, întârziere, Replan), Scan + Place story, Saved, Profile.
- [x] Mutarea opririlor prin tragere; carduri de rute salvate; Edit profile / Delete account.
- [x] Backend: PostgreSQL în Docker, auth JWT (register/login/me), rute salvate pe cont.
- [ ] Backend: locuri salvate, generare rută (Overpass + rutare pe jos), replan, recunoaștere.
- [ ] Agentul AI cu unelte OSM (Overpass pentru locuri, motor de rutare pe jos).
- [ ] Social: share rute, feed For you / Friends.
