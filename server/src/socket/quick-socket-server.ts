import EventEmitter from 'node:events';
import TypedEmitter from 'typed-emitter';
import { randomBytes } from 'crypto';
import type { Server as HttpServer } from 'node:http';
import type { Server as HTTPSServer } from 'node:https';
import type { Http2SecureServer, Http2Server } from 'node:http2';
import { Server as SocketServer, ServerOptions, Socket } from 'socket.io';

import {
  QuickSocketIncomingMessageEvent,
  QuickSocketOutgoingMessageEvent,
  SocketBetData,
  SocketConnectedDataPacket,
  SocketMessageDataPacket,
  SocketResultDataPacket,
  SocketResultReadyDataPacket,
  SocketStateDataPacket,
} from '../schema/comms-schema';
import { UserSession } from '../schema/user-schema';

import mockDatabase from '../database/mock-database';
import { QuickGameState } from '../schema/state-schema';
import { BetResult } from '../schema/bet-schema';

export type TServerInstance =
  | HttpServer
  | HTTPSServer
  | Http2SecureServer
  | Http2Server;

type SocketServerEvents = {
  [QuickSocketIncomingMessageEvent.MESSAGE]: (
    data: SocketMessageDataPacket
  ) => void;
  [QuickSocketIncomingMessageEvent.BET]: (data: SocketBetData) => void;
  [QuickSocketIncomingMessageEvent.READY_FOR_RESULT]: () => void;
};

export class QuickSocketServer extends SocketServer {
  public readonly events: EventEmitter;
  protected connectedUsers: Map<string, UserSession>;

  constructor(srv: TServerInstance, opts?: Partial<ServerOptions>) {
    super(srv, opts);
    this.events = new EventEmitter() as TypedEmitter<SocketServerEvents>;
  }

  public init(): void {
    this.connectedUsers = new Map();
    this.on('connection', (socket) => this.onUserConnected(socket));
  }

  public broadcastState(state: QuickGameState): void {
    const resultReadyData: SocketStateDataPacket = {
      event: QuickSocketOutgoingMessageEvent.STATE,
      data: { state },
    };
    this.emit('message', resultReadyData);
  }

  public broadcastResultReady(): void {
    const resultReadyData: SocketResultReadyDataPacket = {
      event: QuickSocketOutgoingMessageEvent.RESULT_READY,
      data: { message: 'Result is ready' },
    };
    this.emit('message', resultReadyData);
  }

  public broadcastResult(result: BetResult): void {
    const resultData: SocketResultDataPacket = {
      event: QuickSocketOutgoingMessageEvent.RESULT,
      data: { result },
    };
    this.emit('message', resultData);
  }

  protected async onUserConnected(socket: Socket): Promise<void> {
    if (this.connectedUsers.size > 0) {
      this.refuseAndDisconnect(socket, 'This is a single-player only server');
      return;
    }

    const { userId, pass } = socket.handshake.auth;

    const isAuth = await mockDatabase.isAuth({
      id: userId,
      pass: pass,
    });

    if (!isAuth) {
      this.refuseAndDisconnect(socket, 'Connection refused');
      return Promise.resolve();
    }

    const sessionToken = this.generateSessionToken();

    const userSession: UserSession = {
      id: userId,
      sessionToken,
      socketId: socket.id,
    };
    this.connectedUsers.set(socket.id, userSession);
    console.log('Player connected:', userSession);

    socket.on('message', (data) => this.onUserMessage(data, socket));
    socket.on('disconnect', () => this.onUserDisconnected(socket));

    const socketConnectedData: SocketConnectedDataPacket = {
      event: QuickSocketOutgoingMessageEvent.CONNECTED,
      data: { sessionToken },
    };
    socket.emit('message', socketConnectedData);

    const msgData: SocketMessageDataPacket = {
      event: QuickSocketOutgoingMessageEvent.MESSAGE,
      data: { message: `Welcome to Quick Gaming Roulette, ${userId}!` },
    };

    socket.emit('message', msgData);
  }

  protected onUserMessage(data: any, socket: Socket): void {
    const user = this.connectedUsers.get(socket.id);
    if (!user) {
      this.refuseAndDisconnect(socket, 'Invalid session');
      return;
    }

    switch (data.event) {
      case QuickSocketIncomingMessageEvent.BET:
        this.events.emit(QuickSocketIncomingMessageEvent.BET, data);
        break;
      case QuickSocketIncomingMessageEvent.MESSAGE:
        this.events.emit(QuickSocketIncomingMessageEvent.MESSAGE, data);
        break;
      case QuickSocketIncomingMessageEvent.READY_FOR_RESULT:
        this.events.emit(QuickSocketIncomingMessageEvent.READY_FOR_RESULT);
        break;
      case QuickSocketIncomingMessageEvent.IDLE:
        this.events.emit(QuickSocketIncomingMessageEvent.IDLE);
        break;
      default:
        console.log(`Unknown data`, data);
        this.refuseAndDisconnect(socket);
    }
  }

  protected onUserDisconnected(socket: Socket): void {
    console.log(`Player disconnected`, socket.id);
    const user = this.connectedUsers.get(socket.id);
    if (user) {
      this.connectedUsers.delete(socket.id);
      socket.disconnect();
      this.events.emit(QuickSocketIncomingMessageEvent.DISCONNECT);
    }
  }

  protected refuseAndDisconnect(
    socket: Socket,
    message: string = 'Refused'
  ): void {
    const msgPacket: SocketMessageDataPacket = {
      event: QuickSocketOutgoingMessageEvent.MESSAGE,
      data: { message },
    };
    socket.emit('message', msgPacket);
    socket.disconnect();
  }

  protected generateSessionToken(length = 16): string {
    return randomBytes(length).toString('base64url');
  }
}
