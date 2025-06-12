import { UserCredentials } from '../schema/user-schema';

class MockDatabase {
  protected users: Map<string, UserCredentials>;

  constructor() {
    this.users = new Map();

    this.userRegister({
      id: 'QuickClient',
      pass: 'MySuperSecurePassword123',
    });
    this.userRegister({
      id: 'LukasTech',
      pass: 'MySuperSecurePassword123',
    });
  }

  public async isAuth(credentials: UserCredentials): Promise<boolean> {
    return new Promise((resolve: (isAuth: boolean) => void) => {
      const { id, pass } = credentials;

      let passCorrect = false;
      if (this.users.has(id)) {
        const userCredentials = this.users.get(id);
        passCorrect = userCredentials?.pass === pass;
      }

      setTimeout(() => resolve(passCorrect), Math.random() * 200);
    });
  }

  protected userRegister(user: UserCredentials): void {
    this.users.set(user.id, user);
  }
}

export default new MockDatabase();
