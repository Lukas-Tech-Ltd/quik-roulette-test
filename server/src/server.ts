import dotenv from 'dotenv';
import express, { Express } from 'express';
import { createServer, Server } from 'http';
import { ServerOptions } from 'socket.io';

import { BetResult } from './schema/bet-schema';
import { QuickSocketServer } from './socket/quick-socket-server';
import { QuickGameState, QuickGameStateEvent } from './schema/state-schema';
import { QuickGameStateMachine } from './state/quick-game-state-machine';
import { QuickSocketMessageEvent, SocketBetData } from './schema/comms-schema';

class QuikServer {
  protected expressApp: Express;
  protected http: Server;
  protected socket: QuickSocketServer;
  protected state: QuickGameStateMachine;
  protected betRecords: BetResult[];

  constructor() {
    this.expressApp = this.createExpressApp();
    this.http = createServer(this.expressApp);
    this.socket = this.createSocket();
    this.createStateMachine();
    this.betRecords = [];
  }

  public init(port: number | string = 3000): void {
    this.http.listen(port, () => console.log(`> Listening on port ${port}`));
    this.createEventListeners();
    this.socket.init();
    this.state.init();
  }

  protected createExpressApp(): Express {
    const expressApp = express();
    expressApp.use(express.json());

    expressApp.get('/', (_req, res) => {
      res.send('Game server is live');
    });

    return expressApp;
  }

  protected createSocket(): QuickSocketServer {
    let serverOptions: Partial<ServerOptions> = {};
    if (process.env.NODE_ENV === 'development') {
      const cors = require('cors');
      serverOptions = {
        cors: {
          origin: '*',
          methods: ['GET', 'POST'],
        },
      };
      this.expressApp.use(cors());
    }
    return new QuickSocketServer(this.http, serverOptions);
  }

  protected createEventListeners(): void {
    // socket events
    this.socket.events.on(QuickSocketMessageEvent.BET, this.onPlayerBet);
    // state events
    this.state.events.on(QuickGameStateEvent.ENTER, this.onEnterState);
    this.state.events.on(QuickGameStateEvent.EXIT, this.onExitState);
  }

  protected createStateMachine(): void {
    this.state = new QuickGameStateMachine([
      QuickGameState.IDLE,
      QuickGameState.SPINNING,
      QuickGameState.STOPPING,
      QuickGameState.AWARD_WINS,
    ]);
  }

  protected onEnterState(state: QuickGameState): void {
    console.log(`[STATE] onEnter`, state);
  }

  protected onExitState(state: QuickGameState): void {
    console.log(`[STATE] onExit`, state);
  }

  protected onPlayerBet(data: SocketBetData): void {
    console.log(`Lukas - player bet`, data);
  }
}

// load the environment variables from .env file
dotenv.config();

console.log(`Environment:`, {
  NODE_ENV: process.env.NODE_ENV,
  SERVER_PORT: process.env.SERVER_PORT || 3001,
});

new QuikServer().init(process.env.SERVER_PORT);
