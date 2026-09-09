export const ESPN_API_URL =
  "https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=2026&seasontype=2&week=";

// Bump this each week when the new spreadsheet is added to public/spreadsheets.
export const CURRENT_WEEK = 1;

export const PLAYERS = [
  "Adam",
  "Alex",
  "Ben",
  "Kylee",
  "Nick",
  "Rick",
  "Ricky",
  "Tammy",
  "Connor",
  "Noah",
  "Jake",
] as const;

// Derive Player type from the PLAYERS array
export type Player = typeof PLAYERS[number];

const RICK_TO_ESPN_ENTRIES = [
  ["ATL", "ATL"],
  ["AZ", "ARI"],
  ["BALT", "BAL"],
  ["BUF", "BUF"],
  ["CAR", "CAR"],
  ["CHIC", "CHI"],
  ["LAC", "LAC"],
  ["CLEV", "CLE"],
  ["CN", "CIN"],
  ["DAL", "DAL"],
  ["DEN", "DEN"],
  ["DET", "DET"],
  ["GB", "GB"],
  ["GIA", "NYG"],
  ["HOU", "HOU"],
  ["INDY", "IND"],
  ["JAX", "JAX"],
  ["JETS", "NYJ"],
  ["KC", "KC"],
  ["LV", "LV"],
  ["MIA", "MIA"],
  ["MN", "MIN"],
  ["NE", "NE"],
  ["NO", "NO"],
  ["PITT", "PIT"],
  ["PHIL", "PHI"],
  ["RAMS", "LAR"],
  ["SEAT", "SEA"],
  ["SF", "SF"],
  ["TB", "TB"],
  ["TN", "TEN"],
  ["WASH", "WSH"],
] as const;

// Derive team code types from the mapping arrays
export type RickTeamCode = typeof RICK_TO_ESPN_ENTRIES[number][0];
export type ESPNTeamCode = typeof RICK_TO_ESPN_ENTRIES[number][1];

// Type-safe Maps for O(1) lookups
export const RICK_TO_ESPN_MAP = new Map<RickTeamCode, ESPNTeamCode>(
  RICK_TO_ESPN_ENTRIES.map(([rick, espn]) => [rick, espn])
);

export const ESPN_TO_RICK_MAP = new Map<ESPNTeamCode, RickTeamCode>(
  RICK_TO_ESPN_ENTRIES.map(([rick, espn]) => [espn, rick])
);
