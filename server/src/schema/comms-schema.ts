import { BetData, BetResult } from './bet-schema';
import { QuickGameState } from './state-schema';

/**
 * Outgoing
 */

export enum QuickSocketOutgoingMessageEvent {
  CONNECTED = 'connected',
  MESSAGE = 'message',
  STATE = 'state',
  RESULT_READY = 'result_ready',
  RESULT = 'result',
}

export interface SocketConnectedDataPacket {
  event: QuickSocketOutgoingMessageEvent.CONNECTED;
  data: { sessionToken: string };
}

export interface SocketMessageDataPacket {
  event: QuickSocketOutgoingMessageEvent.MESSAGE;
  data: { message: string };
}

export interface SocketStateDataPacket {
  event: QuickSocketOutgoingMessageEvent.STATE;
  data: { state: QuickGameState };
}

export interface SocketResultReadyDataPacket {
  event: QuickSocketOutgoingMessageEvent.RESULT_READY;
  data: { message: string };
}

export interface SocketResultDataPacket {
  event: QuickSocketOutgoingMessageEvent.RESULT;
  data: {
    result: BetResult;
  };
}

/**
 * Incoming
 */

export enum QuickSocketIncomingMessageEvent {
  DISCONNECT = 'disconnect',
  MESSAGE = 'message',
  BET = 'bet',
  READY_FOR_RESULT = 'ready_for_result',
  RESULT = 'result',
  IDLE = 'idle',
}

export interface SocketBetData {
  id: string;
  sessionToken: string;
  bets: BetData[];
}

export interface SocketBetDataPacket {
  event: QuickSocketIncomingMessageEvent.BET;
  data: SocketBetData;
}

export interface SocketReadyResultData {
  sessionToken: string;
}

export interface SocketReadyResultDataPacket {
  event: QuickSocketIncomingMessageEvent.READY_FOR_RESULT;
  data: SocketReadyResultData;
}

export interface SocketIdleData {
  sessionToken: string;
}

export interface SocketIdleDataPacket {
  event: QuickSocketIncomingMessageEvent.IDLE;
  data: SocketIdleData;
}
