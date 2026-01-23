import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";

// Mock all child components to isolate App testing
jest.mock("./FileGetter/FileGetter", () => {
  const React = require("react");
  return function MockFileGetter({
    setFile,
    setGames,
    setWeekNum,
    setProjectedMNFPoints,
  }) {
    React.useEffect(() => {
      setFile("Week 1;.xlsx");
      setWeekNum(1);
      setGames([
        {
          home: "KC",
          away: "BUF",
          picks: [{ player: "Nick", pick: "KC" }],
        },
      ]);
      setProjectedMNFPoints({ Nick: 45 });
    }, [setFile, setGames, setWeekNum, setProjectedMNFPoints]);
    return React.createElement("div", { "data-testid": "file-getter" });
  };
});

jest.mock("./ScoreFetcher/ScoreFetcher", () => {
  const React = require("react");
  return function MockScoreFetcher({ children, weekNumber }) {
    return React.createElement(
      "div",
      { "data-testid": "score-fetcher", "data-week": weekNumber },
      children
    );
  };
});

jest.mock("./Leaderboard/Leaderboard", () => {
  const React = require("react");
  return function MockLeaderboard() {
    return React.createElement(
      "div",
      { "data-testid": "leaderboard" },
      "Leaderboard"
    );
  };
});

jest.mock("./Games/Games", () => {
  const React = require("react");
  return function MockGames() {
    return React.createElement("div", { "data-testid": "games" }, "Games");
  };
});

jest.mock("./Tiebreaker/Tiebreaker", () => {
  const React = require("react");
  return function MockTiebreaker() {
    return React.createElement(
      "div",
      { "data-testid": "tiebreaker" },
      "Tiebreaker"
    );
  };
});

jest.mock("./SeasonResults/SeasonResults", () => {
  const React = require("react");
  return function MockSeasonResults() {
    return React.createElement(
      "div",
      { "data-testid": "season-results" },
      "Season Results"
    );
  };
});

describe("App", () => {
  it("renders the header with app title", () => {
    render(<App />);
    expect(screen.getByText("Siegl Football Pool")).toBeInTheDocument();
  });

  it("renders the FileGetter component", () => {
    render(<App />);
    expect(screen.getByTestId("file-getter")).toBeInTheDocument();
  });

  it("renders week number after file is loaded", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Week 1")).toBeInTheDocument();
    });
  });

  it("renders ScoreFetcher components after file is loaded", async () => {
    render(<App />);
    await waitFor(() => {
      const scoreFetchers = screen.getAllByTestId("score-fetcher");
      expect(scoreFetchers.length).toBe(3);
    });
  });

  it("renders Leaderboard component after file is loaded", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("leaderboard")).toBeInTheDocument();
    });
  });

  it("renders Games component after file is loaded", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("games")).toBeInTheDocument();
    });
  });

  it("renders Tiebreaker component after file is loaded", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("tiebreaker")).toBeInTheDocument();
    });
  });

  it("renders SeasonResults component after file is loaded", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByTestId("season-results")).toBeInTheDocument();
    });
  });

  it("passes weekNumber to ScoreFetcher", async () => {
    render(<App />);
    await waitFor(() => {
      const scoreFetchers = screen.getAllByTestId("score-fetcher");
      scoreFetchers.forEach((fetcher) => {
        expect(fetcher).toHaveAttribute("data-week", "1");
      });
    });
  });

  it("has App class on root div", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".App")).toBeInTheDocument();
  });

  it("has App-header class on header", () => {
    const { container } = render(<App />);
    expect(container.querySelector(".App-header")).toBeInTheDocument();
  });
});
