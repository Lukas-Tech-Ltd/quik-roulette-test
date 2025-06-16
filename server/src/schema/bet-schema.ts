export interface BetData {
  position: string;
  amount: number;
}

export interface BetResult {
  betId: string;
  playerId: string;
  result: number;
  totalWin: number;
  bets: BetData[];
  failedBets: BetData[];
  successfulBets: BetData[];
  createdAt: number;
}
