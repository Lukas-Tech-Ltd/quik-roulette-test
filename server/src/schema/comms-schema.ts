export enum QuickSocketMessageEvent {
  CONNECTED = 'connected',
  MESSAGE = 'message',
  BET = 'bet',
}

export interface SocketConnectedData {
  sessionToken: string;
}

export interface SocketMessageData {
  sessionToken: string;
}

export interface SocketBetData {
  bets: {
    value: number;
    amount: number;
  };
}
