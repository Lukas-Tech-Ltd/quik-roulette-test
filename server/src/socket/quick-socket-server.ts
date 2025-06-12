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
  SocketConnectedData,
  SocketMessageData,
} from '../schema/comms-schema';
import { UserSession } from '../schema/user-schema';

import mockDatabase from '../database/mock-database';

export type TServerInstance =
  | HttpServer
  | HTTPSServer
  | Http2SecureServer
  | Http2Server;

type SocketServerEvents = {
  [QuickSocketIncomingMessageEvent.MESSAGE]: (data: SocketMessageData) => void;
  [QuickSocketIncomingMessageEvent.BET]: (data: SocketBetData) => void;
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
      socket.emit('message', `Connection refused`);
      socket.disconnect();
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

    const socketConnectedData: SocketConnectedData = {
      event: QuickSocketOutgoingMessageEvent.CONNECTED,
      data: { sessionToken },
    };
    socket.emit('message', socketConnectedData);

    const msgData: SocketMessageData = {
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
    socket.emit(QuickSocketOutgoingMessageEvent.MESSAGE, {
      event: QuickSocketOutgoingMessageEvent.MESSAGE,
      data: { message },
    });
    socket.disconnect();
  }

  protected generateSessionToken(length = 16): string {
    return randomBytes(length).toString('base64url');
  }
}
