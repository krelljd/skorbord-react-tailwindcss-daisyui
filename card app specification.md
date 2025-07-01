# Skorbord Card Scoring App - Specification

## Overview

- This app will allow users to track scoring in card games of all types.
- Users can track the scores of multiple players per game.
- Games require selection of a game type.
- Game types are a predefined list of game types that can be added to when games are started. Will be used with an autocomplete field.
- Game types have a default win or loss condition total. They should specify if the condition is a win or loss condition, and determine the result accordingly.
- Games can override their own win or loss condition total.
- Games require two or more players.
- Rivalries can be defined for a given set of players.
- Rivalries are tracked per game, aggregated by game type played.
- Rivalries should track average margin of victory, last 10 results (e.g. WWWLLLWLWL), minimum and maximum wins/loss margins. All stats should be updated when a game is finalized.
- Multiple concurrent rivalries can be tracked, each having different players.
- Team rivalries can be tracked, where multiple players are assigned to a Team.
- Team names should be player names grouped together (e.g. `Player 1 | Player 2 vs Player 3 | Player 4`)
- Players have names and default to `Player 1`, `Player 2`, etc (e.g. Player 1, Player 2, Player 3, player 4). Names should be editable.
- Players should be able to be added and removed from a game before the game begins.
- Selecting a rivalry should populate the pleyers for the game.
- Beginning a game should require the selection of a game type, and allow the selection of an existing rivalry that automatically populates the players for the game, or allow the option to input players that will be playing, automatically creating a rivalry behind the scenes, when the game is begun.
- Once a game has begin, the user should be able to update each player's score via easily touched + and - buttons that adjust points by 1. Additional buttons should allow +10 and -10 increments.
- Once a game's win or loss condition is reached, the winning player or team should be displayed as the winner.
- A game's scores must be editable until `finalize game` is selected. The result of the game is then stored and updates the rivalry data.
- Game types can be favorited.
- Users should be able to choose a randomized game to play based on favorited game types.
- All of this should be tracked independently per SQID environment.

## System Logic

- Real-time score updates are provided via REST and WebSocket (Socket.IO) APIs.
- All scoring data operations use REST and WebSocket APIs.
- Each loaded versions of this app should see real-time updates entered by any other loaded instance.
- Real-time updates can be sent if the API call to persist the data in a database fails, but must display to the users that data tracking is not working and historical data may not be working.
- Frontend build output is always in the `dist/` directory for deployment.
- Secure access to each card tracking instance is via a unique encoded URL parameter (Sqids).
- Administrative tasks should be handled by modal windows and should not interfere with core usage of game scoring.
- Rivalry stats should be prominently displayed in a model window after a game is finalized. You should also be able to access the stats separately from the starting screen.

## Data Model

- `Sqid`: Unique encoded identifier for secure access
- TBD

## UI/UX Requirements

- UI elements are optimized for mobile and touch use, and should work optimally in modern mobile browsers.
- Buttons and text use relative font sizes (vwh) for accessibility.
- TailwindCSS and DaisyUI should be used for themeing the application.
- DaisyUI theme `dark` should be used. (e.g.  @plugin "daisyui" {
   themes: dark --default;
 })

## Additional Notes

- Code should follow modern best practices and be structured for readability, extensibility and maintainability.
- Dependencies and libraries should run the latest stable version.
- Deployment steps and automation scripts are documented in `deployment_steps.md`.
- Generate and update a `code_map.json` for a machine-readable project structure and dependency map.
