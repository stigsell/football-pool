import { ESPNEvent, ESPNScoresResponse, Game, PlayerScoreTuple, PlayersProjectedMNFPoints, Pick } from "../types";
import { Player, RickTeamCode } from "../utils/constants";

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

// Helper to create a typed pick
const pick = (player: Player, team: RickTeamCode): Pick => ({ player, pick: team });

// Mock games array (parsed from Excel)
export const mockGames: Game[] = [
  {
    home: "KC",
    away: "BUF",
    picks: [
      pick("Nick", "KC"),
      pick("Adam", "BUF"),
      pick("Alex", "KC"),
      pick("Ben", "KC"),
      pick("Kylee", "BUF"),
      pick("Rick", "KC"),
      pick("Ricky", "KC"),
      pick("Tammy", "BUF"),
      pick("Connor", "KC"),
      pick("Noah", "KC"),
      pick("Jake", "KC"),
    ],
  },
  {
    home: "NE",
    away: "MIA",
    picks: [
      pick("Nick", "MIA"),
      pick("Adam", "MIA"),
      pick("Alex", "MIA"),
      pick("Ben", "MIA"),
      pick("Kylee", "MIA"),
      pick("Rick", "MIA"),
      pick("Ricky", "MIA"),
      pick("Tammy", "MIA"),
      pick("Connor", "MIA"),
      pick("Noah", "MIA"),
      pick("Jake", "MIA"),
    ],
  },
  {
    home: "DET",
    away: "CHIC",
    picks: [
      pick("Nick", "DET"),
      pick("Adam", "DET"),
      pick("Alex", "CHIC"),
      pick("Ben", "DET"),
      pick("Kylee", "DET"),
      pick("Rick", "DET"),
      pick("Ricky", "DET"),
      pick("Tammy", "DET"),
      pick("Connor", "DET"),
      pick("Noah", "DET"),
      pick("Jake", "DET"),
    ],
  },
];

// Mock games with unanimous picks
export const mockGamesUnanimous: Game[] = [
  {
    home: "NE",
    away: "MIA",
    picks: [
      pick("Nick", "MIA"),
      pick("Adam", "MIA"),
      pick("Alex", "MIA"),
    ],
  },
];

// Mock games with mixed picks
export const mockGamesMixed: Game[] = [
  {
    home: "KC",
    away: "BUF",
    picks: [
      pick("Nick", "KC"),
      pick("Adam", "BUF"),
      pick("Alex", "KC"),
    ],
  },
];

// Mock player scores array (sorted high to low)
export const mockPlayersScores: PlayerScoreTuple[] = [
  ["Nick" as Player, 10],
  ["Adam" as Player, 9],
  ["Alex" as Player, 9],
  ["Ben" as Player, 8],
  ["Kylee" as Player, 8],
  ["Rick" as Player, 7],
  ["Ricky" as Player, 7],
  ["Tammy" as Player, 6],
  ["Connor" as Player, 5],
  ["Noah" as Player, 4],
  ["Jake" as Player, 3],
];

// Mock player scores with tie at top
export const mockPlayersScoresTied: PlayerScoreTuple[] = [
  ["Nick" as Player, 10],
  ["Adam" as Player, 10],
  ["Alex" as Player, 10],
  ["Ben" as Player, 8],
];

// Mock player scores with single winner
export const mockPlayersScoresSingleWinner: PlayerScoreTuple[] = [
  ["Nick" as Player, 12],
  ["Adam" as Player, 10],
  ["Alex" as Player, 9],
];

// Mock MNF projected points per player
export const mockPlayersProjectedMNFPoints: PlayersProjectedMNFPoints = {
  Nick: 45,
  Adam: 50,
  Alex: 42,
};
