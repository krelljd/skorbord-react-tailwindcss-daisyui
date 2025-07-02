# Skorbord Card Scoring App

Skorbord is a real-time card scoring app for teams and players, optimized for mobile and Raspberry Pi deployment. This project contains both backend (API) and frontend (App) code.

## Project Structure

- `api/` – Node.js backend (Express, Socket.IO, SQLite)
- `app/` – React frontend (Vite, TailwindCSS, DaisyUI)

## Getting Started

1. Copy `.env.example` to `.env` in both `api/` and `app/` and fill in values as needed.
2. Install dependencies in both directories:

   ```sh
   cd api && npm install
   cd ../app && npm install
   ```

3. Run the backend:

   ```sh
   cd api && npm run dev
   ```

4. Run the frontend:

   ```sh
   cd app && npm run dev
   ```

See `card app llm action plan.md` for the full development plan.

## Deployment

See `deployment_steps.md` for Raspberry Pi and production deployment instructions.
