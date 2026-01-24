import type { Player, RickTeamCode } from "../utils/constants";

// Game status union type
export type GameStatus = 'Final' | 'In Progress' | 'Scheduled' | 'End of Period';

// ESPN API Types
export interface ESPNEvent {
  shortName: string;
  date: string;
  status: {
    type: { description: GameStatus; completed: boolean };
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

// Competitor type extracted for reuse
export type Competitor = ESPNEvent['competitions'][0]['competitors'][number];

// Game Types with stronger typing
export interface Pick {
  player: Player;
  pick: RickTeamCode;
}

export interface Game {
  home: RickTeamCode;
  away: RickTeamCode;
  picks: Pick[];
}

export interface GameScore {
  status: string; // Can be GameStatus or formatted clock like "Q2 5:30"
  away_score: number;
  home_score: number;
}

// Player Types
export type PlayerScoreTuple = [Player, number];
export type PlayersProjectedMNFPoints = Partial<Record<Player, number>>;
