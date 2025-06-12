export interface BetData {
  position: string;
  amount: number;
}

export interface BetResult {
  result: number;
  bets: BetData[];
  failedBets: BetData[];
  successfulBets: BetData[];
}
