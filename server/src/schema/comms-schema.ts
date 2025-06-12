import { BetData } from './bet-schema';

/**
 * Outgoing
 */

export enum QuickSocketOutgoingMessageEvent {
  CONNECTED = 'connected',
  MESSAGE = 'message',
  GAME_STATE = 'state',
}

export interface SocketConnectedData {
  event: QuickSocketOutgoingMessageEvent.CONNECTED;
  data: { sessionToken: string };
}

export interface SocketMessageData {
  event: QuickSocketOutgoingMessageEvent.MESSAGE;
  data: { message: string };
}

/**
 * Incoming
 */

export enum QuickSocketIncomingMessageEvent {
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  BET = 'bet',
}

export interface SocketBetData {
  event: QuickSocketIncomingMessageEvent.BET;
  data: { sessionToken: string; bets: BetData[] };
}
