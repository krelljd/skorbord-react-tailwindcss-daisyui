# Copilot Instructions for Skorbord App
<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

- Always generate standards-compliant code and files.
- Always generate standards-compliant markdown content. Do not generate markdown that causes lint errors.
- Follow the project structure and naming conventions as outlined in the project documentation.
- Use TailwindCSS and DaisyUI for styling, adhering to the dark theme.
- Ensure all code is optimized for mobile and touch use, with relative font sizes (vwh).
- Implement real-time updates using REST and WebSocket (Socket.IO) APIs.
- Use modern JavaScript (ES6+) features and avoid TypeScript.
- Ensure all components are reusable and maintainable.
- Always read the provided project documentation and specifications in full before generating code.
- Always read relevant code and comments files in full before generating new code.
- Ensure all code is well-documented and follows best practices for readability and maintainability. Comments should explain why certain decisions were made, not what the code does.
- Ensure all database scripts are idempotent and can be run multiple times without causing issues.
- Use SQLite for the database and ensure all migrations are documented.
- The app will be deployed on a Raspberry Pi, so ensure all code is optimized for that environment.
- Apps will be hosted at `https://skorbord.app/` in Production and via `http://localhost:{port}` in Development.
