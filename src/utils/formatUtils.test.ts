import { formatInProgressGameClock, formatTwoScores } from "./formatUtils";
import { ESPNEvent } from "../types";

describe("formatInProgressGameClock", () => {
  it("formats Q1 with time remaining", () => {
    const event = {
      status: {
        period: 1,
        displayClock: "12:34",
      },
    } as ESPNEvent;
    expect(formatInProgressGameClock(event)).toBe("Q1 12:34");
  });

  it("formats Q4 with minimal time remaining", () => {
    const event = {
      status: {
        period: 4,
        displayClock: "0:05",
      },
    } as ESPNEvent;
    expect(formatInProgressGameClock(event)).toBe("Q4 0:05");
  });

  it("formats halftime (end of period 2)", () => {
    const event = {
      status: {
        period: 2,
        displayClock: "0:00",
      },
    } as ESPNEvent;
    expect(formatInProgressGameClock(event)).toBe("Q2 0:00");
  });

  it("formats Q3 with time remaining", () => {
    const event = {
      status: {
        period: 3,
        displayClock: "8:45",
      },
    } as ESPNEvent;
    expect(formatInProgressGameClock(event)).toBe("Q3 8:45");
  });

  it("formats overtime period", () => {
    const event = {
      status: {
        period: 5,
        displayClock: "10:00",
      },
    } as ESPNEvent;
    expect(formatInProgressGameClock(event)).toBe("Q5 10:00");
  });
});

describe("formatTwoScores", () => {
  it("formats normal scores", () => {
    expect(formatTwoScores(17, 24)).toBe("17 - 24");
  });

  it("formats zero scores", () => {
    expect(formatTwoScores(0, 0)).toBe("0 - 0");
  });

  it("formats high scores", () => {
    expect(formatTwoScores(45, 42)).toBe("45 - 42");
  });

  it("formats tied scores", () => {
    expect(formatTwoScores(21, 21)).toBe("21 - 21");
  });

  it("formats when away team is winning", () => {
    expect(formatTwoScores(31, 14)).toBe("31 - 14");
  });

  it("formats when home team is winning", () => {
    expect(formatTwoScores(7, 35)).toBe("7 - 35");
  });
});
