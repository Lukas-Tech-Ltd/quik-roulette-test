import dotenv from 'dotenv';
import rng from './rng/rng';
import { randomBytes } from 'crypto';
import express, { Express } from 'express';
import { createServer, Server } from 'http';
import { ServerOptions, Socket } from 'socket.io';

import { BetResult } from './schema/bet-schema';
import { QuickSocketServer } from './socket/quick-socket-server';
import { QuickGameState, QuickGameStateEvent } from './schema/state-schema';
import { QuickGameStateMachine } from './state/quick-game-state-machine';
import {
  QuickSocketIncomingMessageEvent,
  QuickSocketOutgoingMessageEvent,
  SocketBetData,
  SocketResultDataPacket,
  SocketResultReadyDataPacket,
} from './schema/comms-schema';
import { getPayoutMultiplier, isWinningBet } from './utils/bet';

class QuikServer {
  protected expressApp: Express;
  protected http: Server;
  protected io: QuickSocketServer;
  protected state: QuickGameStateMachine;
  protected betRecords: BetResult[];

  constructor() {
    this.expressApp = this.createExpressApp();
    this.http = createServer(this.expressApp);
    this.io = this.createSocket();
    this.createStateMachine();
    this.betRecords = [];
  }

  public init(port: number | string = 3000): void {
    this.http.listen(port, () => console.log(`> Listening on port ${port}`));
    this.createEventListeners();
    this.io.init();
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
    this.io.events.on(QuickSocketIncomingMessageEvent.DISCONNECT, () =>
      this.onPlayerDisconnected()
    );
    this.io.events.on(
      QuickSocketIncomingMessageEvent.BET,
      (data: SocketBetData, socket: Socket) => this.onPlayerBet(data, socket)
    );
    this.io.events.on(
      QuickSocketIncomingMessageEvent.READY_FOR_RESULT,
      (socket: Socket) => this.onPlayerReadyForResult(socket)
    );
    this.io.events.on(QuickSocketIncomingMessageEvent.IDLE, () =>
      this.onPlayerIdle()
    );
    // state events
    this.state.events.on(QuickGameStateEvent.ENTER, (state: QuickGameState) =>
      this.onEnterState(state)
    );
  }

  protected createStateMachine(): void {
    this.state = new QuickGameStateMachine([
      QuickGameState.IDLE,
      QuickGameState.IN_PLAY,
      QuickGameState.FINISHING,
    ]);
  }

  protected onEnterState(state: QuickGameState): void {
    this.io.broadcastState(state);
  }

  protected onPlayerDisconnected(): void {
    console.log(`[PLAYER] Player disconnected, resetting state`);
    this.state.init();
  }

  protected onPlayerBet(data: SocketBetData, socket: Socket): void {
    if (this.state.currentState() !== QuickGameState.IDLE) {
      return;
    }

    this.state.nextState();

    const result = rng.generate(0, 36);

    const successfulBets = data.bets
      .filter(({ position }) => isWinningBet(position, result))
      .map(({ position, amount }) => ({
        position,
        amount: amount + amount * getPayoutMultiplier(position),
      }));

    const failedBets = data.bets.filter(
      ({ position }) => !isWinningBet(position, result)
    );

    const totalWin = successfulBets.reduce((sum, bet) => sum + bet.amount, 0);

    const betResult: BetResult = {
      betId: randomBytes(6).toString('base64url'),
      playerId: data.id,
      result,
      totalWin,
      bets: data.bets,
      failedBets,
      successfulBets,
      createdAt: Date.now(),
    };

    this.betRecords.push(betResult);

    console.log(`[PLAYER] Player bet`, betResult);

    const resultReadyData: SocketResultReadyDataPacket = {
      event: QuickSocketOutgoingMessageEvent.RESULT_READY,
      data: { message: 'Result is ready' },
    };
    socket.emit('message', resultReadyData);
  }

  protected onPlayerReadyForResult(socket: Socket): void {
    if (this.state.currentState() !== QuickGameState.IN_PLAY) {
      return;
    }
    this.state.nextState();

    const result = this.betRecords[this.betRecords.length - 1];

    const resultData: SocketResultDataPacket = {
      event: QuickSocketOutgoingMessageEvent.RESULT,
      data: { result },
    };

    socket.emit('message', resultData);
  }

  protected onPlayerIdle(): void {
    if (this.state.currentState() !== QuickGameState.FINISHING) {
      return;
    }

    this.state.nextState();

    const result = this.betRecords[this.betRecords.length - 1];

    this.io.broadcastResult(result);
  }
}

// load the environment variables from .env file
dotenv.config();

console.log(`Environment:`, {
  NODE_ENV: process.env.NODE_ENV,
  SERVER_PORT: process.env.SERVER_PORT || 3001,
});

new QuikServer().init(process.env.SERVER_PORT);
