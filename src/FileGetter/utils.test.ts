import { parseFile, readFile } from "./utils";
import * as XLSX from "xlsx";

// Mock XLSX
jest.mock("xlsx", () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

const mockedXLSX = XLSX as jest.Mocked<typeof XLSX>;

describe("parseFile", () => {
  it("parses a single game correctly", () => {
    const data = [
      { "WK 1": "BUF", Nick: "buf", Adam: "buf" },
      { "WK 1": "KC", Nick: "kc", Adam: "buf" },
      { Nick: 45, Adam: 50 }, // Projected MNF points row
    ];

    const games = parseFile(data, 1);

    expect(games).toHaveLength(1);
    expect(games[0].away).toBe("BUF");
    expect(games[0].home).toBe("KC");
    expect(games[0].picks).toHaveLength(2);
  });

  it("parses multiple games correctly", () => {
    const data = [
      { "WK 5": "MIA", Nick: "mia", Adam: "ne" },
      { "WK 5": "NE", Nick: "ne", Adam: "ne" },
      { "WK 5": "DEN", Nick: "den", Adam: "lv" },
      { "WK 5": "LV", Nick: "lv", Adam: "lv" },
      { Nick: 42, Adam: 48 },
    ];

    const games = parseFile(data, 5);

    expect(games).toHaveLength(2);
    expect(games[0].away).toBe("MIA");
    expect(games[0].home).toBe("NE");
    expect(games[1].away).toBe("DEN");
    expect(games[1].home).toBe("LV");
  });

  it("converts picks to uppercase and trims whitespace", () => {
    const data = [
      { "WK 3": "BUF", Nick: "  buf  ", Adam: "KC" },
      { "WK 3": "KC", Nick: "kc", Adam: "kc " },
      { Nick: 40 },
    ];

    const games = parseFile(data, 3);

    // Picks are extracted from home row and uppercased/trimmed
    // Nick: "kc" -> "KC", Adam: "kc " -> "KC"
    expect(games[0].picks[0].pick).toBe("KC");
    expect(games[0].picks[1].pick).toBe("KC");
  });

  it("extracts player names from picks", () => {
    const data = [
      { "WK 2": "ATL", Nick: "atl", Adam: "tb", Alex: "atl" },
      { "WK 2": "TB", Nick: "tb", Adam: "tb", Alex: "atl" },
      { Nick: 35 },
    ];

    const games = parseFile(data, 2);

    const playerNames = games[0].picks.map((p) => p.player);
    expect(playerNames).toContain("Nick");
    expect(playerNames).toContain("Adam");
    expect(playerNames).toContain("Alex");
  });

  it("handles empty data array (no games)", () => {
    const data = [{ Nick: 45 }]; // Only MNF points row

    const games = parseFile(data, 1);

    expect(games).toHaveLength(0);
  });

  it("uses correct week key format", () => {
    const data = [
      { "WK 18": "SF", Nick: "sf" },
      { "WK 18": "SEA", Nick: "sea" },
      { Nick: 50 },
    ];

    const games = parseFile(data, 18);

    expect(games[0].away).toBe("SF");
    expect(games[0].home).toBe("SEA");
  });
});

describe("readFile", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("reads an Excel file and returns JSON data", async () => {
    const mockArrayBuffer = new ArrayBuffer(8);
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
    } as unknown as File;
    const mockWorkbook = {
      SheetNames: ["Sheet1"],
      Sheets: {
        Sheet1: {},
      },
    };
    const mockJsonData = [
      { "WK 1": "BUF", Nick: "buf" },
      { "WK 1": "KC", Nick: "kc" },
    ];

    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    const result = await readFile(mockFile);

    expect(mockFile.arrayBuffer).toHaveBeenCalled();
    expect(mockedXLSX.read).toHaveBeenCalledWith(mockArrayBuffer);
    expect(mockedXLSX.utils.sheet_to_json).toHaveBeenCalledWith(
      mockWorkbook.Sheets.Sheet1,
      { blankrows: false }
    );
    expect(result).toEqual(mockJsonData);
  });

  it("uses the first sheet in the workbook", async () => {
    const mockArrayBuffer = new ArrayBuffer(8);
    const mockFile = {
      arrayBuffer: jest.fn().mockResolvedValue(mockArrayBuffer),
    } as unknown as File;
    const mockWorkbook = {
      SheetNames: ["FirstSheet", "SecondSheet"],
      Sheets: {
        FirstSheet: { A1: "data" },
        SecondSheet: { A1: "other" },
      },
    };

    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue([]);

    await readFile(mockFile);

    expect(mockedXLSX.utils.sheet_to_json).toHaveBeenCalledWith(
      mockWorkbook.Sheets.FirstSheet,
      { blankrows: false }
    );
  });
});
