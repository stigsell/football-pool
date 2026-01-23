import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import Games from "./Games";

describe("Games", () => {
  const mockScores = {
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
              { homeAway: "away", score: "21" },
            ],
          },
        ],
      },
    ],
  };

  const mockGames = [
    {
      home: "KC",
      away: "BUF",
      picks: [
        { player: "Nick", pick: "KC" },
        { player: "Adam", pick: "BUF" },
        { player: "Alex", pick: "KC" },
      ],
    },
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

  it("renders the Games heading", () => {
    render(<Games games={mockGames} scores={mockScores} />);
    expect(screen.getByText("Games")).toBeInTheDocument();
  });

  it("renders filter checkboxes", () => {
    render(<Games games={mockGames} scores={mockScores} />);
    expect(screen.getByLabelText("Show Completed Games")).toBeInTheDocument();
    expect(screen.getByLabelText("Show Unanimous Games")).toBeInTheDocument();
  });

  it("hides completed games by default", () => {
    const { container } = render(<Games games={mockGames} scores={mockScores} />);
    // KC game is completed and non-unanimous, but hidden because completed
    // MIA @ NE is in progress but unanimous, so also hidden
    // With both filters off by default, no games should show
    expect(container.querySelectorAll(".Game").length).toBe(0);
  });

  it("shows completed games when checkbox is checked", () => {
    render(<Games games={mockGames} scores={mockScores} />);

    const checkbox = screen.getByLabelText("Show Completed Games");
    fireEvent.click(checkbox);

    // Now completed games should show (if non-unanimous)
    // KC and BUF may appear multiple times (as team names and as picks)
    expect(screen.getAllByText("KC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("BUF").length).toBeGreaterThan(0);
  });

  it("hides unanimous games by default", () => {
    const { container } = render(<Games games={mockGames} scores={mockScores} />);
    // MIA @ NE is unanimous (all picked MIA) - hidden by default
    // Both filters are off, so no games should display
    expect(container.querySelectorAll(".Game").length).toBe(0);
  });

  it("shows unanimous games when checkbox is checked", () => {
    render(<Games games={mockGames} scores={mockScores} />);

    // First show completed games
    fireEvent.click(screen.getByLabelText("Show Completed Games"));
    // Then show unanimous games
    fireEvent.click(screen.getByLabelText("Show Unanimous Games"));

    // Now all games should be visible (team names may appear multiple times)
    expect(screen.getAllByText("KC").length).toBeGreaterThan(0);
    expect(screen.getAllByText("NE").length).toBeGreaterThan(0);
  });

  it("displays game scores", () => {
    render(<Games games={mockGames} scores={mockScores} />);

    fireEvent.click(screen.getByLabelText("Show Completed Games"));

    // KC game score: 24 - 27
    expect(screen.getByText("24 - 27")).toBeInTheDocument();
  });

  it("displays game status", () => {
    render(<Games games={mockGames} scores={mockScores} />);

    fireEvent.click(screen.getByLabelText("Show Completed Games"));

    expect(screen.getByText("Final")).toBeInTheDocument();
  });

  it("displays in-progress game clock", () => {
    render(<Games games={mockGames} scores={mockScores} />);

    // Show completed and unanimous to see all games
    fireEvent.click(screen.getByLabelText("Show Completed Games"));
    fireEvent.click(screen.getByLabelText("Show Unanimous Games"));

    expect(screen.getByText("Q3 5:30")).toBeInTheDocument();
  });

  it("renders player picks for each game", () => {
    render(<Games games={mockGames} scores={mockScores} />);

    fireEvent.click(screen.getByLabelText("Show Completed Games"));

    expect(screen.getByText("Nick")).toBeInTheDocument();
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("applies Game class to game containers", () => {
    const { container } = render(<Games games={mockGames} scores={mockScores} />);

    fireEvent.click(screen.getByLabelText("Show Completed Games"));

    expect(container.querySelector(".Game")).toBeInTheDocument();
  });

  it("applies Game__table class to tables", () => {
    const { container } = render(<Games games={mockGames} scores={mockScores} />);

    fireEvent.click(screen.getByLabelText("Show Completed Games"));

    expect(container.querySelector(".Game__table")).toBeInTheDocument();
  });

  it("applies Game__win class to correct picks when away team wins", () => {
    // Create a scenario where away team wins
    const awayWinScores = {
      events: [
        {
          shortName: "BUF @ KC",
          status: {
            type: { description: "Final", completed: true },
            period: 4,
            displayClock: "0:00",
          },
          competitions: [
            {
              competitors: [
                { homeAway: "home", score: "20" },
                { homeAway: "away", score: "27" },
              ],
            },
          ],
        },
      ],
    };

    const games = [
      {
        home: "KC",
        away: "BUF",
        picks: [
          { player: "Nick", pick: "BUF" }, // Correct pick
          { player: "Adam", pick: "KC" }, // Wrong pick
        ],
      },
    ];

    const { container } = render(<Games games={games} scores={awayWinScores} />);

    fireEvent.click(screen.getByLabelText("Show Completed Games"));

    const winCells = container.querySelectorAll(".Game__win");
    expect(winCells.length).toBeGreaterThan(0);
  });

  it("applies Game__win class to correct picks when home team wins", () => {
    const { container } = render(<Games games={mockGames} scores={mockScores} />);

    fireEvent.click(screen.getByLabelText("Show Completed Games"));

    // KC won at home, Nick and Alex picked KC
    const winCells = container.querySelectorAll(".Game__win");
    expect(winCells.length).toBeGreaterThan(0);
  });

  it("toggles showCompletedGames filter correctly", () => {
    render(<Games games={mockGames} scores={mockScores} />);

    const checkbox = screen.getByLabelText("Show Completed Games");

    // Initially unchecked
    expect(checkbox).not.toBeChecked();

    // Click to check
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Click to uncheck
    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("toggles showUnanimousGames filter correctly", () => {
    render(<Games games={mockGames} scores={mockScores} />);

    const checkbox = screen.getByLabelText("Show Unanimous Games");

    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).not.toBeChecked();
  });

  it("handles empty games array", () => {
    const { container } = render(<Games games={[]} scores={mockScores} />);

    expect(screen.getByText("Games")).toBeInTheDocument();
    // No game elements should be rendered
    expect(container.querySelector(".Game")).not.toBeInTheDocument();
  });
});
