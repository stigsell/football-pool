import { ESPNEvent, ESPNScoresResponse, Game, PlayerScoreTuple, PlayersProjectedMNFPoints } from "../types";

// Mock ESPN API event structure
export const mockEvent: ESPNEvent = {
  shortName: "BUF @ KC",
  date: "2025-01-20T00:15Z",
  status: {
    type: { description: "Final", completed: true },
    period: 4,
    displayClock: "0:00",
  },
  competitions: [
    {
      competitors: [
        { homeAway: "home", score: "27" },
        { homeAway: "away", score: "24" },
      ],
    },
  ],
};

export const mockEventInProgress: ESPNEvent = {
  shortName: "BUF @ KC",
  date: "2025-01-20T00:15Z",
  status: {
    type: { description: "In Progress", completed: false },
    period: 1,
    displayClock: "12:34",
  },
  competitions: [
    {
      competitors: [
        { homeAway: "home", score: "7" },
        { homeAway: "away", score: "3" },
      ],
    },
  ],
};

export const mockEventEndOfPeriod: ESPNEvent = {
  shortName: "MIA @ NE",
  date: "2025-01-19T18:00Z",
  status: {
    type: { description: "End of Period", completed: false },
    period: 2,
    displayClock: "0:00",
  },
  competitions: [
    {
      competitors: [
        { homeAway: "home", score: "14" },
        { homeAway: "away", score: "10" },
      ],
    },
  ],
};

export const mockEventScheduled: ESPNEvent = {
  shortName: "DEN @ LV",
  date: "2025-01-21T01:20Z",
  status: {
    type: { description: "Scheduled", completed: false },
    period: 0,
    displayClock: "0:00",
  },
  competitions: [
    {
      competitors: [
        { homeAway: "home", score: "0" },
        { homeAway: "away", score: "0" },
      ],
    },
  ],
};

// Mock scores response (ESPN API format)
export const mockScoresResponse: ESPNScoresResponse = {
  events: [
    {
      shortName: "BUF @ KC",
      date: "2025-01-20T00:15Z",
      status: {
        type: { description: "Final", completed: true },
        period: 4,
        displayClock: "0:00",
      },
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "27" },
            { homeAway: "away", score: "24" },
          ],
        },
      ],
    },
    {
      shortName: "MIA @ NE",
      date: "2025-01-19T18:00Z",
      status: {
        type: { description: "Final", completed: true },
        period: 4,
        displayClock: "0:00",
      },
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "21" },
            { homeAway: "away", score: "28" },
          ],
        },
      ],
    },
    {
      shortName: "CHI @ DET",
      date: "2025-01-19T13:00Z",
      status: {
        type: { description: "Final", completed: true },
        period: 4,
        displayClock: "0:00",
      },
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "35" },
            { homeAway: "away", score: "14" },
          ],
        },
      ],
    },
  ],
};

export const mockScoresResponseWithIncomplete: ESPNScoresResponse = {
  events: [
    {
      shortName: "BUF @ KC",
      date: "2025-01-20T00:15Z",
      status: {
        type: { description: "Final", completed: true },
        period: 4,
        displayClock: "0:00",
      },
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "27" },
            { homeAway: "away", score: "24" },
          ],
        },
      ],
    },
    {
      shortName: "MIA @ NE",
      date: "2025-01-19T18:00Z",
      status: {
        type: { description: "In Progress", completed: false },
        period: 3,
        displayClock: "5:30",
      },
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "14" },
            { homeAway: "away", score: "17" },
          ],
        },
      ],
    },
    {
      shortName: "CHI @ DET",
      date: "2025-01-19T13:00Z",
      status: {
        type: { description: "Scheduled", completed: false },
        period: 0,
        displayClock: "0:00",
      },
      competitions: [
        {
          competitors: [
            { homeAway: "home", score: "0" },
            { homeAway: "away", score: "0" },
          ],
        },
      ],
    },
  ],
};

// Mock games array (parsed from Excel)
export const mockGames: Game[] = [
  {
    home: "KC",
    away: "BUF",
    picks: [
      { player: "Nick", pick: "KC" },
      { player: "Adam", pick: "BUF" },
      { player: "Alex", pick: "KC" },
      { player: "Ben", pick: "KC" },
      { player: "Kylee", pick: "BUF" },
      { player: "Rick", pick: "KC" },
      { player: "Ricky", pick: "KC" },
      { player: "Tammy", pick: "BUF" },
      { player: "Connor", pick: "KC" },
      { player: "Noah", pick: "KC" },
      { player: "Jake", pick: "KC" },
    ],
  },
  {
    home: "NE",
    away: "MIA",
    picks: [
      { player: "Nick", pick: "MIA" },
      { player: "Adam", pick: "MIA" },
      { player: "Alex", pick: "MIA" },
      { player: "Ben", pick: "MIA" },
      { player: "Kylee", pick: "MIA" },
      { player: "Rick", pick: "MIA" },
      { player: "Ricky", pick: "MIA" },
      { player: "Tammy", pick: "MIA" },
      { player: "Connor", pick: "MIA" },
      { player: "Noah", pick: "MIA" },
      { player: "Jake", pick: "MIA" },
    ],
  },
  {
    home: "DET",
    away: "CHIC",
    picks: [
      { player: "Nick", pick: "DET" },
      { player: "Adam", pick: "DET" },
      { player: "Alex", pick: "CHIC" },
      { player: "Ben", pick: "DET" },
      { player: "Kylee", pick: "DET" },
      { player: "Rick", pick: "DET" },
      { player: "Ricky", pick: "DET" },
      { player: "Tammy", pick: "DET" },
      { player: "Connor", pick: "DET" },
      { player: "Noah", pick: "DET" },
      { player: "Jake", pick: "DET" },
    ],
  },
];

// Mock games with unanimous picks
export const mockGamesUnanimous: Game[] = [
  {
    home: "NE",
    away: "MIA",
    picks: [
      { player: "Nick", pick: "MIA" },
      { player: "Adam", pick: "MIA" },
      { player: "Alex", pick: "MIA" },
    ],
  },
];

// Mock games with mixed picks
export const mockGamesMixed: Game[] = [
  {
    home: "KC",
    away: "BUF",
    picks: [
      { player: "Nick", pick: "KC" },
      { player: "Adam", pick: "BUF" },
      { player: "Alex", pick: "KC" },
    ],
  },
];

// Mock player scores array (sorted high to low)
export const mockPlayersScores: PlayerScoreTuple[] = [
  ["Nick", 10],
  ["Adam", 9],
  ["Alex", 9],
  ["Ben", 8],
  ["Kylee", 8],
  ["Rick", 7],
  ["Ricky", 7],
  ["Tammy", 6],
  ["Connor", 5],
  ["Noah", 4],
  ["Jake", 3],
];

// Mock player scores with tie at top
export const mockPlayersScoresTied: PlayerScoreTuple[] = [
  ["Nick", 10],
  ["Adam", 10],
  ["Alex", 10],
  ["Ben", 8],
];

// Mock player scores with single winner
export const mockPlayersScoresSingleWinner: PlayerScoreTuple[] = [
  ["Nick", 12],
  ["Adam", 10],
  ["Alex", 9],
];

// Mock MNF projected points per player
export const mockPlayersProjectedMNFPoints: PlayersProjectedMNFPoints = {
  Nick: 45,
  Adam: 50,
  Alex: 42,
};
