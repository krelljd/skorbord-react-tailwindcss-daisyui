# Skorbord App (Frontend)

This is the frontend for the Skorbord Card Scoring App, built with Vite, React, TailwindCSS, and DaisyUI (dark theme, mobile-first).

## Features

- Mobile-first, touch-friendly UI
- Dark theme by default (DaisyUI)
- Real-time updates via REST and Socket.IO
- Proxy `/api` requests to backend at `http://localhost:2525`

## Development

```sh
npm install
npm run dev
```

## Folder Structure

- `src/components/` – Reusable UI components
- `src/pages/` – Page components and routes
- `src/App.jsx` – App shell and layout

## Styling

- TailwindCSS and DaisyUI are configured for dark mode and relative font sizes (vw units)

## Proxy

- Vite is configured to proxy `/api` to the backend (`http://localhost:2525`)

## Component Usage Examples

### PlayerList

```jsx
<PlayerList
  players={[{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }]}
  onSelect={player => console.log(player)}
/>
```

### ScoreControls

```jsx
<ScoreControls
  value={10}
  onChange={newValue => setScore(newValue)}
  min={0}
  max={100}
/>
```

### GameTypeSelector

```jsx
<GameTypeSelector
  gameTypes={[
    { id: 1, name: 'Hearts', description: 'Classic trick-taking game' },
    { id: 2, name: 'Spades' }
  ]}
  value={1}
  onChange={id => setGameType(id)}
/>
```

### RivalrySelector

```jsx
<RivalrySelector
  rivalries={[
    { id: 1, team1_id: 1, team2_id: 2, team1_name: 'Team A', team2_name: 'Team B' }
  ]}
  value={1}
  onChange={id => setRivalry(id)}
/>
```

### TeamManager

```jsx
<TeamManager
  teams={[
    { id: 1, name: 'Team 1', players: [{ id: 1, name: 'Alice' }] },
    { id: 2, name: 'Team 2', players: [{ id: 2, name: 'Bob' }] }
  ]}
  availablePlayers={[]}
  onAddTeam={() => {}}
  onRemoveTeam={id => {}}
  onAddPlayerToTeam={(teamId, playerId) => {}}
  onRemovePlayerFromTeam={(teamId, playerId) => {}}
  onEditTeamName={(teamId, newName) => {}}
  onEditPlayerName={(playerId, newName) => {}}
/>
```

---

See the main project README for full details.
