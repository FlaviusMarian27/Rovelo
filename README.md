# Rovelo

AI-powered walking city guide that plans and adapts your route in any city.

## How it works
- Pick how much time you have and what interests you
- An AI agent builds a walking route from OpenStreetMap data
- Navigate live; the agent replans if you run late
- Photograph a building to get its story

## Tech stack
- **Mobile:** React Native with Expo (cross-platform, Android & iOS)
- **Backend:** Spring Boot (Java), REST API, JWT auth
- **Database:** PostgreSQL
- **AI:** pre-trained model called through an API (the key stays on the server)
- **Maps data:** OpenStreetMap

## Project structure
- `mobile/`: React Native app
- `backend/`: Spring Boot server
- `docs/`: use case diagram, Figma exports, documentation

## Status
Course project (PAAM). Design and use case diagram done; implementation in progress.