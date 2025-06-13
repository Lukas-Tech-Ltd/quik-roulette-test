import { randomBytes } from 'node:crypto';
import { UserCredentials, UserSession, UserType } from '../schema/user-schema';

class MockDatabase {
  protected users: Map<string, UserCredentials>;

  constructor() {
    this.users = new Map();

    this.userRegister({
      id: 'QuickClient',
      pass: 'MySuperSecurePassword123',
      type: UserType.SPECTATOR,
    });

    this.userRegister({
      id: 'LukasTech',
      pass: 'MySuperSecurePassword123',
      type: UserType.PLAYER,
    });
  }

  public async isAuth(
    credentials: UserCredentials
  ): Promise<Partial<UserSession>> {
    return new Promise(
      (resolve: (userSession: Partial<UserSession>) => void) => {
        const { id, pass } = credentials;

        let userSession: Partial<UserSession> = {};
        const userCredentials = this.users.get(id);
        if (userCredentials && userCredentials?.pass === pass) {
          userSession.id = id;
          userSession.sessionToken = this.generateSessionToken();
          userSession.type = userCredentials.type;
        }
        setTimeout(() => resolve(userSession), Math.random() * 200); // fake latency
      }
    );
  }

  protected userRegister(user: UserCredentials): void {
    this.users.set(user.id, user);
  }

  protected generateSessionToken(length = 16): string {
    return randomBytes(length).toString('base64url');
  }
}

export default new MockDatabase();
