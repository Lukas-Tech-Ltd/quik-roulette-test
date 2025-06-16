import EventEmitter from 'node:events';
import TypedEmitter from 'typed-emitter';
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
  SocketStateDataPacket,
} from '../schema/comms-schema';
import { UserSession, UserType } from '../schema/user-schema';

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
  [QuickSocketIncomingMessageEvent.READY_FOR_RESULT]: (socket: Socket) => void;
};

export class QuickSocketServer extends SocketServer {
  public readonly events: EventEmitter;
  protected connectedPlayers: Map<string, Partial<UserSession>>;
  protected connectedSpectators: Map<string, Partial<UserSession>>;

  constructor(srv: TServerInstance, opts?: Partial<ServerOptions>) {
    super(srv, opts);
    this.events = new EventEmitter() as TypedEmitter<SocketServerEvents>;
  }

  public init(): void {
    this.connectedPlayers = new Map();
    this.connectedSpectators = new Map();
    this.on('connection', (socket) => this.onUserConnected(socket));
  }

  public broadcastState(state: QuickGameState): void {
    const resultReadyData: SocketStateDataPacket = {
      event: QuickSocketOutgoingMessageEvent.STATE,
      data: { state },
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
    const { userId, pass } = socket.handshake.auth;

    const userSession = await mockDatabase.isAuth({
      id: userId,
      pass: pass,
    });

    if (!userSession.sessionToken) {
      this.refuseAndDisconnect(socket, 'Connection refused');
      return Promise.resolve();
    }

    if (userSession.type === UserType.PLAYER) {
      if (this.connectedPlayers.size > 0) {
        this.refuseAndDisconnect(socket, 'This is a single-player only server');
        return;
      }
      this.connectedPlayers.set(socket.id, userSession);
      console.log('Player connected:', userSession);
    } else if (userSession.type === UserType.SPECTATOR) {
      console.log('Spectator connected:', userSession);
      this.connectedSpectators.set(socket.id, userSession);
    }

    socket.on('message', (data) => this.onUserMessage(data, socket));
    socket.on('disconnect', () => this.onUserDisconnected(socket));

    const socketConnectedData: SocketConnectedDataPacket = {
      event: QuickSocketOutgoingMessageEvent.CONNECTED,
      data: { sessionToken: userSession.sessionToken },
    };
    socket.emit('message', socketConnectedData);

    const msgData: SocketMessageDataPacket = {
      event: QuickSocketOutgoingMessageEvent.MESSAGE,
      data: { message: `Welcome to Quick Gaming Roulette, ${userId}!` },
    };

    socket.emit('message', msgData);
  }

  protected onUserMessage(data: any, socket: Socket): void {
    const user = this.connectedPlayers.get(socket.id);
    if (!user || user.type === UserType.SPECTATOR) {
      this.refuseAndDisconnect(socket);
      return;
    }

    switch (data.event) {
      case QuickSocketIncomingMessageEvent.BET:
        this.events.emit(QuickSocketIncomingMessageEvent.BET, data, socket);
        break;
      case QuickSocketIncomingMessageEvent.MESSAGE:
        this.events.emit(QuickSocketIncomingMessageEvent.MESSAGE, data);
        break;
      case QuickSocketIncomingMessageEvent.READY_FOR_RESULT:
        this.events.emit(
          QuickSocketIncomingMessageEvent.READY_FOR_RESULT,
          socket
        );
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
    const user =
      this.connectedPlayers.get(socket.id) ||
      this.connectedSpectators.get(socket.id);
    if (user) {
      this.connectedPlayers.delete(socket.id);
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
}
