import EventEmitter from 'node:events';
import TypedEmitter from 'typed-emitter';
import { randomBytes } from 'crypto';
import { Server as HttpServer } from 'node:http';
import type { Server as HTTPSServer } from 'node:https';
import { Http2SecureServer, Http2Server } from 'node:http2';
import { Server as SocketServer, ServerOptions, Socket } from 'socket.io';

import {
  QuickSocketMessageEvent,
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
  [QuickSocketMessageEvent.CONNECTED]: (data: SocketConnectedData) => void;
  [QuickSocketMessageEvent.MESSAGE]: (data: SocketMessageData) => void;
  [QuickSocketMessageEvent.BET]: (data: SocketBetData) => void;
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

    const userSession = {
      id: userId,
      sessionToken,
      socketId: socket.id,
    };

    this.connectedUsers.set(socket.id, userSession);

    socket.on('message', (data) => this.onUserMessage(data, socket));
    socket.on('disconnect', () => this.onUserDisconnected(socket));

    console.log('Player connected:', userSession);

    socket.emit('message', {
      event: QuickSocketMessageEvent.CONNECTED,
      data: { sessionToken },
    });

    socket.emit('message', {
      event: QuickSocketMessageEvent.MESSAGE,
      data: { message: `Welcome to Quick Gaming Roulette, ${userId}!` },
    });
  }

  protected onUserMessage(data: any, socket: Socket): void {
    const user = this.connectedUsers.get(data?.sessionToken);
    if (!user) {
      this.refuseAndDisconnect(socket, 'Invalid session');
      return;
    }

    switch (data.event) {
      case QuickSocketMessageEvent.BET:
        this.events.emit(QuickSocketMessageEvent.BET, data);
        break;
      case QuickSocketMessageEvent.MESSAGE:
        this.events.emit(QuickSocketMessageEvent.MESSAGE, data);
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
    }
  }

  protected refuseAndDisconnect(
    socket: Socket,
    message: string = 'Refused'
  ): void {
    socket.emit(QuickSocketMessageEvent.MESSAGE, {
      event: QuickSocketMessageEvent.MESSAGE,
      data: { message },
    });
    socket.disconnect();
  }

  protected generateSessionToken(length = 16): string {
    return randomBytes(length).toString('base64url');
  }
}
