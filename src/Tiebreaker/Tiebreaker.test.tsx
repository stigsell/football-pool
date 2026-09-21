import React from "react";
import { render, screen } from "@testing-library/react";
import Tiebreaker from "./Tiebreaker";
import { Game, ESPNScoresResponse, PlayersProjectedMNFPoints, Pick } from "../types";
import { PLAYERS, Player, RickTeamCode } from "../utils/constants";

describe("Tiebreaker", () => {
  const mockProjectedMNFPoints: PlayersProjectedMNFPoints = {
    Adam: 45,
    Alex: 50,
    Ben: 42,
    Kylee: 48,
    Nick: 51,
    Rick: 44,
    Ricky: 46,
    Tammy: 40,
    Connor: 55,
    Noah: 38,
    Jake: 47,
  };

  it("renders the Tiebreaker heading", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    expect(screen.getByText("Tiebreaker")).toBeInTheDocument();
  });

  it("renders a table with Player and Estimated MNF Points columns", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    expect(screen.getByText("Player")).toBeInTheDocument();
    expect(screen.getByText("Estimated MNF Points")).toBeInTheDocument();
  });

  it("displays all 11 players", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Ben")).toBeInTheDocument();
    expect(screen.getByText("Kylee")).toBeInTheDocument();
    expect(screen.getByText("Nick")).toBeInTheDocument();
    expect(screen.getByText("Rick")).toBeInTheDocument();
    expect(screen.getByText("Ricky")).toBeInTheDocument();
    expect(screen.getByText("Tammy")).toBeInTheDocument();
    expect(screen.getByText("Connor")).toBeInTheDocument();
    expect(screen.getByText("Noah")).toBeInTheDocument();
    expect(screen.getByText("Jake")).toBeInTheDocument();
  });

  it("displays projected points for each player", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    expect(screen.getByText("45")).toBeInTheDocument(); // Adam
    expect(screen.getByText("51")).toBeInTheDocument(); // Nick
    expect(screen.getByText("55")).toBeInTheDocument(); // Connor
  });

  it("renders correct number of rows (header + 11 players)", () => {
    render(<Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />);
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(12); // 1 header + 11 players
  });

  it("has proper table structure with thead and tbody", () => {
    const { container } = render(
      <Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />
    );
    expect(container.querySelector("thead")).toBeInTheDocument();
    expect(container.querySelector("tbody")).toBeInTheDocument();
  });

  it("applies Tiebreaker class to container", () => {
    const { container } = render(
      <Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />
    );
    expect(container.querySelector(".Tiebreaker")).toBeInTheDocument();
  });

  it("applies Tiebreaker__table class to table", () => {
    const { container } = render(
      <Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />
    );
    expect(container.querySelector(".Tiebreaker__table")).toBeInTheDocument();
  });

  it("handles undefined projected points gracefully", () => {
    const partialPoints: PlayersProjectedMNFPoints = {
      Adam: 45,
      Nick: 51,
    };
    render(<Tiebreaker playersProjectedMNFPoints={partialPoints} />);
    // Players without projected points should still render
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
  });

  it("sorts players by estimated points from low to high", () => {
    const { container } = render(
      <Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />
    );
    const names = Array.from(container.querySelectorAll("tbody tr")).map(
      (row) => row.querySelectorAll("td")[0].textContent
    );
    expect(names).toEqual([
      "Noah",
      "Tammy",
      "Ben",
      "Rick",
      "Adam",
      "Ricky",
      "Jake",
      "Kylee",
      "Alex",
      "Nick",
      "Connor",
    ]);
  });

  it("lists players without projected points last", () => {
    const partialPoints: PlayersProjectedMNFPoints = {
      Nick: 51,
      Adam: 45,
    };
    const { container } = render(
      <Tiebreaker playersProjectedMNFPoints={partialPoints} />
    );
    const names = Array.from(container.querySelectorAll("tbody tr")).map(
      (row) => row.querySelectorAll("td")[0].textContent
    );
    expect(names.slice(0, 2)).toEqual(["Adam", "Nick"]);
    expect(names.slice(2)).toEqual([
      "Alex",
      "Ben",
      "Connor",
      "Jake",
      "Kylee",
      "Noah",
      "Rick",
      "Ricky",
      "Tammy",
    ]);
  });

  describe("eliminated players", () => {
    // Helper to create player picks for all 11 players
    const createPicks = (pickFn: (player: Player) => RickTeamCode): Pick[] =>
      PLAYERS.map((player) => ({ player, pick: pickFn(player) }));

    // Adam, Kylee and Tammy get the first game wrong; everyone else is perfect.
    const mockGames: Game[] = [
      {
        home: "KC",
        away: "BUF",
        picks: createPicks((p) =>
          (["Adam", "Kylee", "Tammy"].includes(p) ? "BUF" : "KC") as RickTeamCode
        ),
      },
      {
        home: "NE",
        away: "MIA",
        picks: createPicks((p) =>
          (["Adam", "Kylee", "Tammy"].includes(p) ? "NE" : "MIA") as RickTeamCode
        ),
      },
    ];

    const createScores = (lastGameCompleted: boolean): ESPNScoresResponse => ({
      events: [
        {
          shortName: "BUF @ KC",
          date: "2025-01-19T18:00Z",
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
          date: "2025-01-20T00:15Z",
          status: {
            type: {
              description: lastGameCompleted ? "Final" : "Scheduled",
              completed: lastGameCompleted,
            },
            period: lastGameCompleted ? 4 : 0,
            displayClock: "0:00",
          },
          competitions: [{
            competitors: [
              { homeAway: "home", score: lastGameCompleted ? "21" : "0" },
              { homeAway: "away", score: lastGameCompleted ? "28" : "0" },
            ],
          }],
        },
      ],
    });

    const getStruckThroughPlayers = (container: HTMLElement): string[] =>
      Array.from(
        container.querySelectorAll("tbody td.Tiebreaker__eliminated")
      )
        .filter((cell) => cell.matches("td:first-child"))
        .map((cell) => cell.textContent as string);

    it("strikes through the name and points of eliminated players", () => {
      const { container } = render(
        <Tiebreaker
          games={mockGames}
          scores={createScores(true)}
          playersProjectedMNFPoints={mockProjectedMNFPoints}
        />
      );

      // No games remain, so anyone below the high score is eliminated.
      expect(getStruckThroughPlayers(container).sort()).toEqual([
        "Adam",
        "Kylee",
        "Tammy",
      ]);

      // Eliminated players sort last, still low to high within each group.
      const names = Array.from(container.querySelectorAll("tbody tr")).map(
        (row) => row.querySelectorAll("td")[0].textContent
      );
      expect(names).toEqual([
        "Noah",
        "Ben",
        "Rick",
        "Ricky",
        "Jake",
        "Alex",
        "Nick",
        "Connor",
        "Tammy",
        "Adam",
        "Kylee",
      ]);

      // Both cells in an eliminated row are struck through.
      const tammyRow = Array.from(container.querySelectorAll("tbody tr")).find(
        (row) => row.querySelectorAll("td")[0].textContent === "Tammy"
      ) as HTMLElement;
      expect(
        Array.from(tammyRow.querySelectorAll("td")).map((td) => td.className)
      ).toEqual(["Tiebreaker__eliminated", "Tiebreaker__eliminated"]);
    });

    it("does not strike through players who can still catch up", () => {
      const { container } = render(
        <Tiebreaker
          games={mockGames}
          scores={createScores(false)}
          playersProjectedMNFPoints={mockProjectedMNFPoints}
        />
      );

      // One game remains and the trailing three picked NE against the
      // leaders' MIA, so they can still draw level.
      expect(getStruckThroughPlayers(container)).toEqual([]);
    });

    it("strikes through nobody when games or scores are missing", () => {
      const { container } = render(
        <Tiebreaker playersProjectedMNFPoints={mockProjectedMNFPoints} />
      );
      expect(
        container.querySelector(".Tiebreaker__eliminated")
      ).not.toBeInTheDocument();
    });
  });

  it("handles empty projected points object", () => {
    render(<Tiebreaker playersProjectedMNFPoints={{}} />);
    // Should still render all players
    expect(screen.getByText("Adam")).toBeInTheDocument();
    expect(screen.getByText("Nick")).toBeInTheDocument();
  });
});
