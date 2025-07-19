# Skorbord Auth0 + Custom WebSocket Hybrid Authentication Implementation Plan


## Overview

This plan details how to implement Auth0 for user management and a custom WebSocket security layer for real-time features. It is designed for the Skorbord app, using ports 2424 (frontend) and 2525 (API) in development, and 2525 for API in production.

---

## 1. Auth0 Setup (Manual Steps)

- Create an Auth0 account and SPA application.
- Set callback/logout/web origins to:
  - `http://localhost:2424`
  - `https://cards.skorbord.app`
- Create an Auth0 API with identifier: `https://api.skorbord.app`
- Note your Auth0 domain, client ID, and API audience.

---

## 2. Environment Configuration

- In `/app/.env`:

```env
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=https://api.skorbord.app
VITE_API_BASE_URL=http://localhost:2525
```

- In `/api/.env`:

```env
AUTH0_DOMAIN=your-domain.auth0.com
AUTH0_AUDIENCE=https://api.skorbord.app
NODE_ENV=development
```

---

## 3. Frontend Implementation

- Install: `npm install @auth0/auth0-react`
- Wrap your app in `Auth0Provider` in `main.jsx`, using env vars.
- Create `AuthContext.jsx` to expose Auth0 state and access token.
- Add login and loading components.
- Protect routes in `App.jsx` so only authenticated users access game features.
- Pass Auth0 access token to WebSocket connection in `ConnectionContext.jsx`.

---

## 4. Backend Implementation

- Install: `npm install jsonwebtoken jwks-rsa`
- Create `auth/websocket.js` to verify Auth0 JWTs using JWKS.
- Update WebSocket server to require and validate tokens on connection.
- Optionally, check user access to game rooms.
- Protect API routes with Auth0 JWT middleware.

---

## 5. Port Usage

- **Development:**
  - Frontend: `http://localhost:2424`
  - API/WebSocket: `http://localhost:2525`

- **Production:**
  - Frontend: `https://cards.skorbord.app`
  - API/WebSocket: `https://cards.skorbord.app` (proxy to port 2525)

---

## 6. Testing & Verification

- Test login, social logins, and token-based API/WebSocket access.
- Ensure only authenticated users can connect and interact in real-time.
- Validate correct port usage in both dev and prod.

---

## 7. Deployment Notes

- Update Auth0 settings for production domain.
- Ensure environment variables are set correctly on Raspberry Pi.
- Confirm API runs on port 2525 in all environments.

---

## Success Criteria

- Auth0 login and user management works.
- WebSocket connections require valid Auth0 tokens.
- API endpoints are protected.
- Real-time features work for authenticated users only.
- Correct ports are used in all environments.

---

**Manual steps are clearly marked. All other steps can be executed by an LLM or automated script.**
