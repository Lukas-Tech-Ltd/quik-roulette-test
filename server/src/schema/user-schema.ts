export interface UserCredentials {
  id: string;
  pass: string;
}

export interface UserSession {
  id: string;
  sessionToken: string;
  socketId: string;
}
