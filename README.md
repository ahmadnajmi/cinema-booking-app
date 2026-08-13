# Cinema Booking Mobile App

React Native (Expo) frontend for the Cinema Booking App technical assessment (Sime Darby Property — Section 4.1 Mobile Developer, combined with the 4.3 Backend API as instructed).

This app demonstrates the **real-time seat locking** requirement from Section 1.0: when a user selects a seat, it is instantly locked and broadcast to every other device viewing the same showtime, on a first-come-first-served basis.

> This is the mobile frontend. It consumes the Laravel backend API from a separate repository: [cinema-booking (backend)](#).

## Tech Stack

- **Framework:** React Native + Expo
- **HTTP Client:** Axios
- **Real-time:** Laravel Echo + Pusher JS client (connecting to a Laravel Reverb WebSocket server)
- **Local Storage:** AsyncStorage (token persistence)
- **Language:** TypeScript

## Scope

Given the time available, this app focuses only on the screens directly relevant to the real-time booking scenario described in Section 1.0, rather than the full wireframe flow:

- **Login screen** — authenticates against the Laravel Passport API, persists the token locally so the user isn't asked to log in again on every app reload
- **Seat map screen** — the core screen for this assessment:
  - Fetches the current seat map and status (`available` / `locked` / `booked`) from the backend
  - Subscribes to a WebSocket channel scoped to the current showtime
  - Instantly reflects seat status changes made by other users, in real time, without polling or refreshing
  - Locks a seat on tap, with conflict handling if another user has already locked it

Full booking (food & beverage, payment) is implemented on the backend (see the backend repo) but not wired up on the mobile UI in this submission, due to the assessment timeline.

## Requirements

- Node.js 18+
- Expo CLI (`npx expo`)
- The backend API running locally (see backend repo's README) with Redis, Reverb, and the queue worker all running

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
```

Edit `.env` to point at your local backend:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:8000/api
EXPO_PUBLIC_REVERB_HOST=localhost
EXPO_PUBLIC_REVERB_PORT=8080
EXPO_PUBLIC_REVERB_KEY=your_reverb_app_key
```

> **Note:** If testing on a physical device or simulator (not web), replace `localhost` with your machine's local network IP address, since `localhost` on a mobile device refers to the device itself, not your computer.

```bash
# 3. Run the app (web is the fastest way to demo)
npx expo start --web
```

Or, to run on a simulator/device:

```bash
npx expo start
# then press "i" for iOS simulator or "a" for Android emulator
```

## Testing the Real-Time Flow

1. Make sure the backend, Redis, Reverb (`php artisan reverb:start`), and the queue worker (`php artisan queue:work`) are all running
2. Log in with a seeded test user (e.g. `test@example.com` / `password123`)
3. Open the app in two browser tabs (or a browser + a simulator) and log in on both
4. On tab A, tap a seat — it turns orange (locked)
5. On tab B, the same seat updates to locked **instantly**, without refreshing — this confirms the Reverb WebSocket broadcast is working end to end
6. Tapping an already-locked seat on tab B shows a conflict message, demonstrating the Redis-backed atomic lock preventing double booking

## Project Structure

```
src/
  app/
    index.tsx      — login screen + session persistence
    seat-map.tsx    — real-time seat map screen
  config/
    api.ts          — API base URL and Reverb connection config
    auth.ts         — token storage helpers (AsyncStorage)
    echo.ts         — Laravel Echo / Reverb client setup
```

## Author

Ahmad Najmi