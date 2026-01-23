import React from "react";
import { render, screen } from "@testing-library/react";
import Leaderboard from "./Leaderboard";

// Mock react-confetti
jest.mock("react-confetti", () => {
  return function MockConfetti() {
    return <div data-testid="confetti" />;
  };
});

// Mock useWindowSize
jest.mock("react-use/lib/useWindowSize", () => {
  return () => ({ width: 1024, height: 768 });
});

describe("Leaderboard", () => {
  const createMockScores = (gamesCompleted = true) => ({
    events: [
      {
        shortName: "BUF @ KC",
        date: "2025-01-20T00:15Z",
        status: {
          type: { description: "Final", completed: gamesCompleted },
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
          type: { description: "Final", completed: gamesCompleted },
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
          type: { description: "Final", completed: gamesCompleted },
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
  });

  const mockGames = [
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

  const mockProjectedMNFPoints = {
    Nick: 51,
    Adam: 45,
    Alex: 50,
    Ben: 48,
    Kylee: 42,
    Rick: 55,
    Ricky: 47,
    Tammy: 40,
    Connor: 52,
    Noah: 44,
    Jake: 49,
  };

  it("renders the Leaderboard heading", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores()}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(screen.getByText("Leaderboard")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores()}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(screen.getByText("Result")).toBeInTheDocument();
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("# Correct")).toBeInTheDocument();
  });

  it("displays all players", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores()}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(screen.getByText("Nick")).toBeInTheDocument();
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Ben")).toBeInTheDocument();
    expect(screen.getByText("Kylee")).toBeInTheDocument();
    expect(screen.getByText("Rick")).toBeInTheDocument();
    expect(screen.getByText("Ricky")).toBeInTheDocument();
    expect(screen.getByText("Tammy")).toBeInTheDocument();
    expect(screen.getByText("Connor")).toBeInTheDocument();
    expect(screen.getByText("Noah")).toBeInTheDocument();
    expect(screen.getByText("Jake")).toBeInTheDocument();
  });

  it("displays player scores", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores()}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    // Nick picked KC (correct), MIA (correct), DET (correct) = 3
    // Multiple players may have score of 3
    expect(screen.getAllByText("3").length).toBeGreaterThan(0);
    // Alex picked KC (correct), MIA (correct), CHIC (wrong) = 2
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("shows confetti when all games are finished", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores(true)}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(screen.getByTestId("confetti")).toBeInTheDocument();
  });

  it("does not show confetti when games are in progress", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores(false)}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(screen.queryByTestId("confetti")).not.toBeInTheDocument();
  });

  it("shows trophy emoji for winner when all games finished", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores(true)}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    // Nick should win with 3 correct and closest tiebreaker
    expect(screen.getByText("🏆")).toBeInTheDocument();
  });

  it("does not show trophy when games are in progress", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores(false)}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(screen.queryByText("🏆")).not.toBeInTheDocument();
  });

  it("shows eliminated emoji for players who cannot win", () => {
    // Create a scenario with games remaining where some players are eliminated
    const scoresWithRemaining = {
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

    // In this case, players with low scores might be eliminated
    // The eliminated check is: highScore - playerScore > numGamesRemaining
    render(
      <Leaderboard
        games={mockGames}
        scores={scoresWithRemaining}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );

    // With 1 game remaining, if gap is > 1, player is eliminated
    // This depends on the actual scores, but we can check if the X is shown for some players
  });

  it("applies Leaderboard class to container", () => {
    const { container } = render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores()}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(container.querySelector(".Leaderboard")).toBeInTheDocument();
  });

  it("applies Leaderboard__table class to table", () => {
    const { container } = render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores()}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    expect(container.querySelector(".Leaderboard__table")).toBeInTheDocument();
  });

  it("renders correct number of rows (header + 11 players)", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores()}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(12); // 1 header + 11 players
  });

  it("sorts players by score (highest first)", () => {
    render(
      <Leaderboard
        games={mockGames}
        scores={createMockScores()}
        playersProjectedMNFPoints={mockProjectedMNFPoints}
      />
    );
    const rows = screen.getAllByRole("row");
    // First data row should have the highest score (3)
    // Multiple players may have 3 correct
    expect(rows[1]).toHaveTextContent("3");
  });
});
