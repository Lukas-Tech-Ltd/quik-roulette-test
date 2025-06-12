export interface BetData {
  position: string;
  amount: number;
}

export interface BetRequest {
  bets: BetData[];
}

export interface BetResult {
  failedBets: BetData[];
  successfulBets: BetData[];
}
