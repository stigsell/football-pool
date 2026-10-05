import { ESPNEvent, ESPNScoresResponse, Game, PlayerScoreTuple, PlayersProjectedMNFPoints, Pick } from "../types";
import { PLAYERS, Player, RickTeamCode } from "../utils/constants";

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

// A week down to its last game, mirroring a real Week 2 finish.
// Ben, Nick, Rick and Ricky lead on 10; Connor, Noah and Adam sit on 9.
// Everyone but Adam picked RAMS in the closer, so Connor and Noah cannot win
// (RAMS win and the leaders move to 11; GIA win and the leaders stay ahead on
// 10), while Adam can still tie the leaders on 10 and take it to the MNF
// tiebreaker.
const lastGamePicks: Pick[] = [
  pick("Nick", "RAMS"),
  pick("Adam", "GIA"),
  pick("Alex", "RAMS"),
  pick("Ben", "RAMS"),
  pick("Kylee", "RAMS"),
  pick("Rick", "RAMS"),
  pick("Ricky", "RAMS"),
  pick("Tammy", "RAMS"),
  pick("Connor", "RAMS"),
  pick("Noah", "RAMS"),
  pick("Jake", "RAMS"),
];

// Winners of the finished games, used to build each player's running score.
const FINISHED_GAME_WINNERS: RickTeamCode[] = ["KC", "MIA", "DET", "BUF"];

// How many of the four finished games each player got right.
const CORRECT_SO_FAR: Record<Player, number> = {
  Nick: 4, Ben: 4, Rick: 4, Ricky: 4,
  Connor: 3, Noah: 3, Adam: 3,
  Alex: 2, Kylee: 2, Tammy: 2, Jake: 2,
};

const finishedGamePicks = (gameIndex: number, loser: RickTeamCode): Pick[] =>
  PLAYERS.map((player) =>
    pick(
      player,
      gameIndex < CORRECT_SO_FAR[player]
        ? FINISHED_GAME_WINNERS[gameIndex]
        : loser
    )
  );

export const mockGamesLastGameLeft: Game[] = [
  { home: "KC", away: "BUF", picks: finishedGamePicks(0, "BUF") },
  { home: "NE", away: "MIA", picks: finishedGamePicks(1, "NE") },
  { home: "DET", away: "CHIC", picks: finishedGamePicks(2, "CHIC") },
  { home: "JETS", away: "BUF", picks: finishedGamePicks(3, "JETS") },
  { home: "RAMS", away: "GIA", picks: lastGamePicks },
];

const finalEvent = (shortName: string, date: string, home: string, away: string): ESPNEvent => ({
  shortName,
  date,
  status: { type: { description: "Final", completed: true }, period: 4, displayClock: "0:00" },
  competitions: [{
    competitors: [
      { homeAway: "home", score: home },
      { homeAway: "away", score: away },
    ],
  }],
});

export const mockScoresLastGameLeft: ESPNScoresResponse = {
  events: [
    finalEvent("BUF @ KC", "2025-01-18T18:00Z", "27", "24"),
    finalEvent("MIA @ NE", "2025-01-18T21:00Z", "21", "28"),
    finalEvent("CHI @ DET", "2025-01-19T13:00Z", "35", "14"),
    finalEvent("BUF @ NYJ", "2025-01-19T16:00Z", "17", "20"),
    {
      shortName: "NYG @ LAR",
      date: "2025-01-20T00:15Z",
      status: { type: { description: "Scheduled", completed: false }, period: 0, displayClock: "0:00" },
      competitions: [{
        competitors: [
          { homeAway: "home", score: "0" },
          { homeAway: "away", score: "0" },
        ],
      }],
    },
  ],
};

// The real Week 4 of 2026, with every game final except Monday night's
// ATL @ NO. Picks are listed in PLAYERS order.
const week4Picks: [RickTeamCode, RickTeamCode, string][] = [
  ["PITT", "CLEV", "PITT CLEV PITT PITT PITT CLEV PITT PITT PITT PITT CLEV"],
  ["INDY", "WASH", "INDY INDY INDY WASH WASH WASH INDY INDY WASH INDY INDY"],
  ["NE", "BUF", "BUF BUF BUF BUF BUF BUF BUF BUF BUF BUF BUF"],
  ["JETS", "CHIC", "CHIC CHIC CHIC CHIC CHIC CHIC CHIC CHIC CHIC CHIC CHIC"],
  ["JAX", "CN", "JAX CN CN CN JAX JAX JAX CN JAX JAX JAX"],
  ["AZ", "GIA", "AZ GIA GIA AZ GIA GIA AZ AZ AZ AZ AZ"],
  ["RAMS", "PHIL", "PHIL RAMS RAMS PHIL RAMS RAMS PHIL PHIL RAMS RAMS RAMS"],
  ["GB", "TB", "GB GB GB TB GB GB GB GB TB GB GB"],
  ["TN", "BALT", "BALT BALT BALT BALT BALT BALT BALT BALT BALT BALT BALT"],
  ["DAL", "HOU", "DAL HOU DAL HOU HOU DAL HOU HOU DAL DAL HOU"],
  ["MIA", "MN", "MN MN MN MN MN MN MN MN MN MN MN"],
  ["KC", "LV", "KC KC KC KC KC LV KC KC KC KC KC"],
  ["DEN", "SF", "SF DEN DEN SF SF SF SF SF DEN SF SF"],
  ["LAC", "SEAT", "SEAT SEAT SEAT SEAT SEAT SEAT SEAT SEAT SEAT SEAT SEAT"],
  ["DET", "CAR", "DET DET CAR DET DET DET DET DET DET DET DET"],
  ["ATL", "NO", "NO NO NO NO ATL NO ATL NO ATL NO NO"],
];

export const mockWeek4Games: Game[] = week4Picks.map(([away, home, picks]) => ({
  away,
  home,
  picks: picks.split(" ").map((pick, i) => ({
    player: PLAYERS[i],
    pick: pick as RickTeamCode,
  })),
}));

export const mockWeek4ProjectedMNFPoints: PlayersProjectedMNFPoints = {
  Adam: 46,
  Alex: 48,
  Ben: 39,
  Kylee: 44,
  Nick: 42,
  Rick: 39,
  Ricky: 49,
  Tammy: 38,
  Connor: 46,
  Noah: 45,
  Jake: 45,
};

const week4Results: [string, string, number, number][] = [
  ["PIT @ CLE", "2026-10-02T00:15Z", 24, 27],
  ["IND VS WSH", "2026-10-04T13:30Z", 30, 13],
  ["NE @ BUF", "2026-10-04T17:00Z", 29, 26],
  ["NYJ @ CHI", "2026-10-04T17:00Z", 12, 23],
  ["JAX @ CIN", "2026-10-04T17:00Z", 22, 17],
  ["ARI @ NYG", "2026-10-04T17:00Z", 24, 36],
  ["LAR @ PHI", "2026-10-04T17:00Z", 24, 20],
  ["GB @ TB", "2026-10-04T17:00Z", 17, 14],
  ["TEN @ BAL", "2026-10-04T17:00Z", 18, 24],
  ["DAL @ HOU", "2026-10-04T17:00Z", 34, 30],
  ["MIA @ MIN", "2026-10-04T20:05Z", 10, 15],
  ["KC @ LV", "2026-10-04T20:25Z", 30, 27],
  ["DEN @ SF", "2026-10-04T20:25Z", 14, 24],
  ["LAC @ SEA", "2026-10-04T20:25Z", 23, 30],
  ["DET @ CAR", "2026-10-05T00:20Z", 26, 32],
  ["ATL @ NO", "2026-10-06T00:15Z", 0, 0],
];

type Week4GameState = {
  description: "Final" | "In Progress" | "Scheduled";
  away?: number;
  home?: number;
};

// Week 4's scores with ATL @ NO scheduled, and any game overridden by its
// ESPN short name (e.g. to leave a second game unfinished).
export const createWeek4Scores = (
  overrides: Record<string, Week4GameState> = { "ATL @ NO": { description: "Scheduled" } }
): ESPNScoresResponse => ({
  events: week4Results.map(([shortName, date, away, home]) => {
    const override = overrides[shortName];
    const description = override?.description ?? "Final";
    return {
      shortName,
      date,
      status: {
        type: { description, completed: description === "Final" },
        period: description === "Scheduled" ? 0 : 4,
        displayClock: "0:00",
      },
      competitions: [{
        competitors: [
          { homeAway: "home", score: String(override?.home ?? (override ? 0 : home)) },
          { homeAway: "away", score: String(override?.away ?? (override ? 0 : away)) },
        ],
      }],
    };
  }),
});
