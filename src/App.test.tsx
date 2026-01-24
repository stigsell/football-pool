import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import App from "./App";
import * as XLSX from "xlsx";

// Mock external dependencies only
jest.mock("xlsx", () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

jest.mock("react-confetti", () => {
  return function MockConfetti() {
    return null;
  };
});

jest.mock("react-use/lib/useWindowSize", () => {
  return () => ({ width: 1024, height: 768 });
});

const mockedXLSX = XLSX as jest.Mocked<typeof XLSX>;


describe("App", () => {
  // Must include all 11 players from constants.js
  const allPlayerPicks = {
    Adam: "kc",
    Alex: "kc",
    Ben: "kc",
    Kylee: "buf",
    Nick: "kc",
    Rick: "kc",
    Ricky: "kc",
    Tammy: "buf",
    Connor: "kc",
    Noah: "kc",
    Jake: "kc",
  };

  const allPlayerPicksMIA = {
    Adam: "mia",
    Alex: "mia",
    Ben: "mia",
    Kylee: "mia",
    Nick: "mia",
    Rick: "mia",
    Ricky: "mia",
    Tammy: "mia",
    Connor: "mia",
    Noah: "mia",
    Jake: "mia",
  };

  const projectedPoints = {
    Adam: 50,
    Alex: 48,
    Ben: 45,
    Kylee: 52,
    Nick: 45,
    Rick: 47,
    Ricky: 49,
    Tammy: 44,
    Connor: 51,
    Noah: 46,
    Jake: 43,
  };

  const mockExcelData = [
    { "WK 18": "BUF", ...allPlayerPicks },
    { "WK 18": "KC", ...allPlayerPicks },
    { "WK 18": "MIA", ...allPlayerPicksMIA },
    { "WK 18": "NE", ...allPlayerPicksMIA },
    projectedPoints,
  ];

  const mockWorkbook = {
    SheetNames: ["Sheet1"],
    Sheets: { Sheet1: {} },
  };

  const mockScoresResponse = {
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
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock fetch for both Excel file and ESPN API
    global.fetch = jest.fn((url: string) => {
      if (url.includes("spreadsheets")) {
        return Promise.resolve({
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        });
      }
      // ESPN API
      return Promise.resolve({
        json: () => Promise.resolve(mockScoresResponse),
      });
    }) as jest.Mock;

    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockExcelData);
  });

  it("renders the header", () => {
    render(<App />);
    expect(screen.getByText("Siegl Football Pool")).toBeInTheDocument();
  });

  it("displays week number after loading", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Week 18")).toBeInTheDocument();
    });
  });

  it("renders Leaderboard section", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    });
  });

  it("renders Games section", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Games")).toBeInTheDocument();
    });
  });

  it("renders Tiebreaker section", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Tiebreaker")).toBeInTheDocument();
    });
  });

  it("renders Season Results section", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Season Results")).toBeInTheDocument();
    });
  });

  it("displays player names in leaderboard", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Leaderboard")).toBeInTheDocument();
    });
    expect(screen.getAllByText("Nick").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Adam").length).toBeGreaterThan(0);
  });

  it("displays leaderboard headers", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("# Correct")).toBeInTheDocument();
    });
  });

  it("fetches Excel file on mount", async () => {
    render(<App />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("spreadsheets")
      );
    });
  });

  it("fetches ESPN scores", async () => {
    render(<App />);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("espn.com")
      );
    });
  });

  it("displays tiebreaker section with projected points header", async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText("Estimated MNF Points")).toBeInTheDocument();
    });
  });

  it("has correct CSS classes", async () => {
    const { container } = render(<App />);
    expect(container.querySelector(".App")).toBeInTheDocument();
    expect(container.querySelector(".App-header")).toBeInTheDocument();
  });
});
