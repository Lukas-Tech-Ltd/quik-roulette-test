import { BetData } from './bet-schema';

export enum QuickSocketMessageEvent {
  CONNECTED = 'connected',
  MESSAGE = 'message',
  BET = 'bet',
  AWARD_WINS = 'award_wins',
}

export interface SocketConnectedData {
  sessionToken: string;
}

export interface SocketMessageData {
  sessionToken: string;
}

export interface SocketBetData {
  bets: BetData[];
}
