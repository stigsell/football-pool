// ESPN API Types
export interface ESPNEvent {
  shortName: string;
  date: string;
  status: {
    type: { description: string; completed: boolean };
    period: number;
    displayClock: string;
  };
  competitions: [{
    competitors: Array<{ homeAway: 'home' | 'away'; score: string }>;
  }];
}

export interface ESPNScoresResponse {
  events: ESPNEvent[];
}

// Game Types
export interface Pick {
  player: string;
  pick: string;
}

export interface Game {
  home: string;
  away: string;
  picks: Pick[];
}

export interface GameScore {
  status: string;
  away_score: number;
  home_score: number;
}

// Player Types
export type PlayerScoreTuple = [string, number];
export type PlayersProjectedMNFPoints = Record<string, number>;
