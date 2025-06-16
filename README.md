## Quick Roulette Game

A full-stack web-based roulette game, structured into three modular parts:

- `├── server/`
  - (Node.js) - WebSocket server handling player and spectator connections, set up to only allow one `player` connection
- `├── client/`
  - (Vue) - Frontend UI acting as a lobby of sorts, includes an iframe to the game view frontend for page layout and history panel
- `├── game/`
  - (PixiJS -) Frontend animations, betting placement, spinning sequence and result feedback

## Getting Started

This was created using **Node.js** v20.18.3 and npm v10.8.2. Clone the repository and run:

```bash
npm i && npm start
```

This will install dependencies, run the development version of each part and open the client (lobby) url which will load the game and connect to the sever
