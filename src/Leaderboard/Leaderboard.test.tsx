import React from "react";
import { render, screen } from "@testing-library/react";
import Leaderboard from "./Leaderboard";
import { Game, ESPNScoresResponse, PlayersProjectedMNFPoints, Pick } from "../types";
import { PLAYERS, Player, RickTeamCode } from "../utils/constants";

// Mock external libraries (not internal components)
jest.mock("react-confetti", () => {
  return function MockConfetti() {
    return <div data-testid="confetti" />;
  };
});

jest.mock("react-use/lib/useWindowSize", () => {
  return () => ({ width: 1024, height: 768 });
});

describe("Leaderboard", () => {
  // Helper to create player picks for all 11 players
  const createPicks = (pickFn: (player: Player) => RickTeamCode): Pick[] =>
    PLAYERS.map((player) => ({ player, pick: pickFn(player) }));

  const mockGames: Game[] = [
    {
      home: "KC",
      away: "BUF",
      picks: createPicks((p) => (["Adam", "Kylee", "Tammy"].includes(p) ? "BUF" : "KC") as RickTeamCode),
    },
    {
      home: "NE",
      away: "MIA",
      picks: createPicks(() => "MIA" as RickTeamCode),
    },
    {
      home: "DET",
      away: "CHIC",
      picks: createPicks((p) => (p === "Alex" ? "CHIC" : "DET") as RickTeamCode),
    },
  ];

  const mockProjectedMNFPoints: PlayersProjectedMNFPoints = {
    Nick: 51, Adam: 45, Alex: 50, Ben: 48, Kylee: 42,
    Rick: 55, Ricky: 47, Tammy: 40, Connor: 52, Noah: 44, Jake: 49,
  };

  const createScores = (completed = true): ESPNScoresResponse => ({
    events: [
      {
        shortName: "BUF @ KC",
        date: "2025-01-20T00:15Z",
        status: { type: { description: "Final", completed }, period: 4, displayClock: "0:00" },
        competitions: [{
          competitors: [
            { homeAway: "home", score: "27" },
            { homeAway: "away", score: "24" },
          ],
        }],
      },
      {
        shortName: "MIA @ NE",
        date: "2025-01-19T18:00Z",
        status: { type: { description: "Final", completed }, period: 4, displayClock: "0:00" },
        competitions: [{
          competitors: [
            { homeAway: "home", score: "21" },
            { homeAway: "away", score: "28" },
          ],
        }],
      },
      {
        shortName: "CHI @ DET",
        date: "2025-01-19T13:00Z",
        status: { type: { description: "Final", completed }, period: 4, displayClock: "0:00" },
        competitions: [{
          competitors: [
            { homeAway: "home", score: "35" },
            { homeAway: "away", score: "14" },
          ],
        }],
      },
    ],
  });

  const renderLeaderboard = (options: {
    games?: Game[];
    scores?: ESPNScoresResponse;
    projectedPoints?: PlayersProjectedMNFPoints;
  } = {}) => {
    const {
      games = mockGames,
      scores = createScores(),
      projectedPoints = mockProjectedMNFPoints,
    } = options;

    return render(
      <Leaderboard
        games={games}
        scores={scores}
        playersProjectedMNFPoints={projectedPoints}
      />
    );
  };

  it("renders heading and table headers", () => {
    renderLeaderboard();
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("# Correct")).toBeInTheDocument();
  });

  it("displays all 11 players", () => {
    renderLeaderboard();
    const players = ["Nick", "Adam", "Alex", "Ben", "Kylee", "Rick", "Ricky", "Tammy", "Connor", "Noah", "Jake"];
    players.forEach((player) => {
      expect(screen.getByText(player)).toBeInTheDocument();
    });
  });

  it("displays player scores sorted highest first", () => {
    renderLeaderboard();
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(12); // header + 11 players
    expect(rows[1]).toHaveTextContent("3"); // highest score first
  });

  it("shows confetti and trophy when all games finished", () => {
    renderLeaderboard({ scores: createScores(true) });
    expect(screen.getByTestId("confetti")).toBeInTheDocument();
    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("hides confetti and trophy when games in progress", () => {
    renderLeaderboard({ scores: createScores(false) });
    expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
    expect(screen.queryByText("🏆")).not.toBeInTheDocument();
  });

  it("shows eliminated emoji when player cannot catch up", () => {
    const scoresWithOneRemaining: ESPNScoresResponse = {
      events: [
        {
          shortName: "BUF @ KC",
          date: "2025-01-20T00:15Z",
          status: { type: { description: "Final", completed: true }, period: 4, displayClock: "0:00" },
          competitions: [{
            competitors: [
              { homeAway: "home", score: "27" },
              { homeAway: "away", score: "24" },
            ],
          }],
        },
        {
          shortName: "MIA @ NE",
          date: "2025-01-19T18:00Z",
          status: { type: { description: "Final", completed: true }, period: 4, displayClock: "0:00" },
          competitions: [{
            competitors: [
              { homeAway: "home", score: "21" },
              { homeAway: "away", score: "28" },
            ],
          }],
        },
        {
          shortName: "CHI @ DET",
          date: "2025-01-19T13:00Z",
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

    // Adam, Kylee and Tammy picked BUF (wrong) -> 1 correct after 2 games.
    // Others have 2 correct. Only DET @ CHI remains, and the trailing three
    // picked DET just like the leaders, so that game cannot close the gap.
    const { container } = renderLeaderboard({ scores: scoresWithOneRemaining });

    const eliminated = Array.from(container.querySelectorAll("tbody tr"))
      .filter((row) => row.querySelectorAll("td")[0].textContent === "❌")
      .map((row) => row.querySelectorAll("td")[1].textContent);
    expect(eliminated.sort()).toEqual(["Adam", "Kylee", "Tammy"]);
  });

  it("does not eliminate a trailing player who can still close the gap", () => {
    // Alex trails by one but picked CHIC while the leaders picked DET, so the
    // remaining game can still bring him level.
    const scoresWithOneRemaining: ESPNScoresResponse = {
      events: createScores().events.map((event) =>
        event.shortName === "CHI @ DET"
          ? {
              ...event,
              status: {
                type: { description: "Scheduled" as const, completed: false },
                period: 0,
                displayClock: "0:00",
              },
            }
          : event
      ),
    };

    const { container } = renderLeaderboard({ scores: scoresWithOneRemaining });

    const alexRow = Array.from(container.querySelectorAll("tbody tr")).find(
      (row) => row.querySelectorAll("td")[1].textContent === "Alex"
    ) as HTMLElement;
    expect(alexRow.querySelectorAll("td")[0].textContent).toBe("");
  });

  it("applies correct CSS classes", () => {
    const { container } = renderLeaderboard();
    expect(container.querySelector(".Leaderboard")).toBeInTheDocument();
    expect(container.querySelector(".Leaderboard__table")).toBeInTheDocument();
  });

  it("returns null when scores is undefined", () => {
    const { container } = render(
      <Leaderboard
        games={mockGames}
        scores={undefined}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(container.firstChild).toBeNull();
  });
});
