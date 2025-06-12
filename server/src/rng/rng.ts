import { randomInt } from 'node:crypto';

class Rng {
  public generate(from: number = 1, to: number = 100): number {
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
      throw new Error('Both min and max must be integers');
    }
    if (to < from) {
      throw new Error('max must be >= min');
    }
    return randomInt(from, to + 1);
  }
}

export default new Rng();
