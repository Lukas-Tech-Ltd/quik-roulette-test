const RED_NUMBERS = new Set([
  1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36,
]);

const BLACK_NUMBERS = new Set([
  2, 4, 6, 8, 10, 11, 13, 15, 17, 20, 22, 24, 26, 28, 29, 31, 33, 35,
]);

export const isWinningBet = (position: string, result: number): boolean => {
  switch (position) {
    case '1st12':
      return result >= 1 && result <= 12;
    case '2nd12':
      return result >= 13 && result <= 24;
    case '3rd12':
      return result >= 25 && result <= 36;
    case '1to18':
      return result >= 1 && result <= 18;
    case '19to36':
      return result >= 19 && result <= 36;
    case 'EVEN':
      return result !== 0 && result % 2 === 0;
    case 'ODD':
      return result % 2 === 1;
    case 'RED':
      return RED_NUMBERS.has(result);
    case 'BLACK':
      return BLACK_NUMBERS.has(result);
    case '2to1_0':
      return result !== 0 && result % 3 === 1;
    case '2to1_1':
      return result !== 0 && result % 3 === 2;
    case '2to1_2':
      return result !== 0 && result % 3 === 0;
    default:
      return parseInt(position) === result;
  }
};

export const getPayoutMultiplier = (position: string): number => {
  switch (position) {
    case '1st12':
    case '2nd12':
    case '3rd12':
    case '2to1_0':
    case '2to1_1':
    case '2to1_2':
      return 2;
    case '1to18':
    case '19to36':
    case 'EVEN':
    case 'ODD':
    case 'RED':
    case 'BLACK':
      return 1;
    default:
      if (/^\D$/.test(position)) {
        return 35;
      }
      return 0;
  }
};
