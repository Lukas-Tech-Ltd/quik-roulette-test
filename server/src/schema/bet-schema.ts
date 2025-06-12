export interface BetData {
  position: number;
  amount: number;
}

export interface BetResult {
  id: string;
  result: number;
  bets: BetData[];
  failedBets: BetData[];
  successfulBets: BetData[];
}
