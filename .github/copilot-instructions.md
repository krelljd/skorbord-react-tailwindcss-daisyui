# Copilot Instructions for Skorbord App
<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This project is a scoring app using Node.js, Vite, Express, React, Socket.IO, TailwindCSS, DaisyUI and SQLite. The backend provides REST and WebSocket APIs for real-time score tracking and management. The frontend eventually hold multiple Views that should be able to be accessed at individual URL segments under a root (e.g. root: https://skorbord.app app views live under /score/:sqid and /board/:sqid and /cards/:sqid). The apps will mostly be viewed on mobile devies, iPhones and iPads. Data is persisted in SQLite. Secure access to each scoreboard is via a unique encoded URL parameter (Sqids). All files should be well structured and follow best practices for maintainability and accessibility. Limitations include minimal use of third-party libraries for the frontend, except for TailwindCSS and DaisyUI, and no use of TypeScript. The app should be built with a focus on accessibility, responsiveness, and real-time updates. Use the latest versions of all libraries and frameworks.

- Backend code is in the `api/` directory.
- Frontend code is in the `app/` directory.
- Use REST and WebSocket APIs for all scoreboard data operations.
- Follow the app specification in `scoreboard app specification.md` for the /score and /board business logic and data model details.
