import React from "react";
import { render, waitFor } from "@testing-library/react";
import FileGetter from "./FileGetter";
import * as XLSX from "xlsx";
import { CURRENT_WEEK } from "../utils/constants";

// Mock XLSX
jest.mock("xlsx", () => ({
  read: jest.fn(),
  utils: {
    sheet_to_json: jest.fn(),
  },
}));

const mockedXLSX = XLSX as jest.Mocked<typeof XLSX>;

// Mock fetch
global.fetch = jest.fn();

describe("FileGetter", () => {
  const mockSetFile = jest.fn();
  const mockSetGames = jest.fn();
  const mockSetWeekNum = jest.fn();
  const mockSetProjectedMNFPoints = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockWorkbook = {
    SheetNames: ["Sheet1"],
    Sheets: {
      Sheet1: {},
    },
  };

  const mockJsonData = [
    { [`WK ${CURRENT_WEEK}`]: "BUF", Nick: "buf", Adam: "kc" },
    { [`WK ${CURRENT_WEEK}`]: "KC", Nick: "kc", Adam: "kc" },
    { Nick: 45, Adam: 50 }, // Projected MNF points
  ];

  it("renders null (no visible output)", () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    const { container } = render(
      <FileGetter
        file={null}
        setFile={mockSetFile}
        setGames={mockSetGames}
        setWeekNum={mockSetWeekNum}
        setProjectedMNFPoints={mockSetProjectedMNFPoints}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("fetches the Excel file on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    render(
      <FileGetter
        file={null}
        setFile={mockSetFile}
        setGames={mockSetGames}
        setWeekNum={mockSetWeekNum}
        setProjectedMNFPoints={mockSetProjectedMNFPoints}
      />
    );

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(`/spreadsheets/Week ${CURRENT_WEEK};.xlsx`);
    });
  });

  it("sets week number on successful fetch", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    render(
      <FileGetter
        file={null}
        setFile={mockSetFile}
        setGames={mockSetGames}
        setWeekNum={mockSetWeekNum}
        setProjectedMNFPoints={mockSetProjectedMNFPoints}
      />
    );

    await waitFor(() => {
      expect(mockSetWeekNum).toHaveBeenCalledWith(CURRENT_WEEK);
    });
  });

  it("sets file name on successful fetch", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    render(
      <FileGetter
        file={null}
        setFile={mockSetFile}
        setGames={mockSetGames}
        setWeekNum={mockSetWeekNum}
        setProjectedMNFPoints={mockSetProjectedMNFPoints}
      />
    );

    await waitFor(() => {
      expect(mockSetFile).toHaveBeenCalledWith(`Week ${CURRENT_WEEK};.xlsx`);
    });
  });

  it("parses games and calls setGames", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    render(
      <FileGetter
        file={null}
        setFile={mockSetFile}
        setGames={mockSetGames}
        setWeekNum={mockSetWeekNum}
        setProjectedMNFPoints={mockSetProjectedMNFPoints}
      />
    );

    await waitFor(() => {
      expect(mockSetGames).toHaveBeenCalled();
      const gamesArg = mockSetGames.mock.calls[0][0];
      expect(Array.isArray(gamesArg)).toBe(true);
    });
  });

  it("sets projected MNF points from last row", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    render(
      <FileGetter
        file={null}
        setFile={mockSetFile}
        setGames={mockSetGames}
        setWeekNum={mockSetWeekNum}
        setProjectedMNFPoints={mockSetProjectedMNFPoints}
      />
    );

    await waitFor(() => {
      expect(mockSetProjectedMNFPoints).toHaveBeenCalledWith({
        Nick: 45,
        Adam: 50,
      });
    });
  });

  it("reads workbook with XLSX", async () => {
    const mockArrayBuffer = new ArrayBuffer(8);
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(mockArrayBuffer),
    });
    mockedXLSX.read.mockReturnValue(mockWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    render(
      <FileGetter
        file={null}
        setFile={mockSetFile}
        setGames={mockSetGames}
        setWeekNum={mockSetWeekNum}
        setProjectedMNFPoints={mockSetProjectedMNFPoints}
      />
    );

    await waitFor(() => {
      expect(mockedXLSX.read).toHaveBeenCalledWith(mockArrayBuffer, { type: "array" });
    });
  });

  it("uses first sheet from workbook", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
    });
    const multiSheetWorkbook = {
      SheetNames: ["FirstSheet", "SecondSheet"],
      Sheets: {
        FirstSheet: { A1: "data" },
        SecondSheet: { A1: "other" },
      },
    };
    mockedXLSX.read.mockReturnValue(multiSheetWorkbook as any);
    (mockedXLSX.utils.sheet_to_json as jest.Mock).mockReturnValue(mockJsonData);

    render(
      <FileGetter
        file={null}
        setFile={mockSetFile}
        setGames={mockSetGames}
        setWeekNum={mockSetWeekNum}
        setProjectedMNFPoints={mockSetProjectedMNFPoints}
      />
    );

    await waitFor(() => {
      expect(mockedXLSX.utils.sheet_to_json).toHaveBeenCalledWith(
        multiSheetWorkbook.Sheets.FirstSheet
      );
    });
  });
});
