export enum UserType {
  PLAYER = 'player',
  SPECTATOR = 'spectator',
}

export interface UserCredentials {
  id: string;
  pass: string;
  type?: UserType;
}

export interface UserSession {
  id: string;
  sessionToken?: string;
  socketId?: string;
  type: UserType;
}
