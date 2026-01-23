import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ScoreFetcher from "./ScoreFetcher";

// Mock the fetch API
global.fetch = jest.fn();

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;
beforeAll(() => {
  console.log = jest.fn();
});
afterAll(() => {
  console.log = originalConsoleLog;
});

describe("ScoreFetcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockScoresData = {
    events: [
      {
        shortName: "BUF @ KC",
        status: { type: { completed: true } },
      },
    ],
  };

  it("renders nothing initially while loading", () => {
    fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { container } = render(
      <ScoreFetcher weekNumber={1}>
        <div data-testid="child">Child Content</div>
      </ScoreFetcher>
    );

    expect(container.firstChild).toBeNull();
  });

  it("fetches scores from ESPN API with correct week number", async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockScoresData),
    });

    render(
      <ScoreFetcher weekNumber={5}>
        <div>Child</div>
      </ScoreFetcher>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("week=5")
      );
    });
  });

  it("renders children after scores are fetched", async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockScoresData),
    });

    render(
      <ScoreFetcher weekNumber={1}>
        <div data-testid="child">Child Content</div>
      </ScoreFetcher>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
    });
  });

  it("passes scores prop to child components", async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockScoresData),
    });

    const ChildComponent = ({ scores }) => (
      <div data-testid="child">
        {scores && scores.events && scores.events.length > 0
          ? "Has Scores"
          : "No Scores"}
      </div>
    );

    render(
      <ScoreFetcher weekNumber={1}>
        <ChildComponent />
      </ScoreFetcher>
    );

    await waitFor(() => {
      expect(screen.getByText("Has Scores")).toBeInTheDocument();
    });
  });

  it("handles multiple children", async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockScoresData),
    });

    render(
      <ScoreFetcher weekNumber={1}>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
      </ScoreFetcher>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child1")).toBeInTheDocument();
      expect(screen.getByTestId("child2")).toBeInTheDocument();
    });
  });

  it("handles non-element children", async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockScoresData),
    });

    render(
      <ScoreFetcher weekNumber={1}>
        <div data-testid="child">Element Child</div>
        {"Text Child"}
      </ScoreFetcher>
    );

    await waitFor(() => {
      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Text Child")).toBeInTheDocument();
    });
  });

  it("refetches when weekNumber changes", async () => {
    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockScoresData),
    });

    const { rerender } = render(
      <ScoreFetcher weekNumber={1}>
        <div>Child</div>
      </ScoreFetcher>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("week=1"));
    });

    rerender(
      <ScoreFetcher weekNumber={2}>
        <div>Child</div>
      </ScoreFetcher>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining("week=2"));
    });
  });

  it("uses correct ESPN API URL format", async () => {
    fetch.mockResolvedValueOnce({
      json: () => Promise.resolve(mockScoresData),
    });

    render(
      <ScoreFetcher weekNumber={10}>
        <div>Child</div>
      </ScoreFetcher>
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/espn\.com.*scoreboard.*week=10/)
      );
    });
  });
});
