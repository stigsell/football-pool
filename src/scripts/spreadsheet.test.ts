/**
 * @jest-environment node
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { PassThrough } from "stream";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import {
  applyFix,
  didYouMean,
  findIssues,
  findSpreadsheet,
  fixSpreadsheet,
  interactiveConfirm,
  requireCleanSpreadsheet,
  runCheck,
  suggestFix,
  terminalConfirm,
} from "../../scripts/spreadsheet";
import { CURRENT_WEEK } from "../utils/constants";

let mockHideBlanks = false;
jest.mock("fs", () => {
  const actual = jest.requireActual("fs");
  return {
    ...actual,
    __esModule: true,
    existsSync: (file: string) =>
      !(mockHideBlanks && file.includes("blank-spreadsheets")) && actual.existsSync(file),
  };
});

type Cell = string | number | null;

let dir: string;
let stdout: jest.SpyInstance;
let error: jest.SpyInstance;
let warn: jest.SpyInstance;

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "spreadsheet-"));
  stdout = jest.spyOn(process.stdout, "write").mockImplementation(() => true);
  error = jest.spyOn(console, "error").mockImplementation(() => {});
  warn = jest.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  mockHideBlanks = false;
  fs.rmSync(dir, { recursive: true, force: true });
});

const writeSheet = (rows: Cell[][]): string => {
  const filePath = path.join(dir, "Week 12;.xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), "Picks");
  XLSX.writeFile(workbook, filePath);
  return filePath;
};

const typoSheet = (): string =>
  writeSheet([
    ["WK 12", "Adam", "Alex"],
    ["WASH"],
    ["AZ", "WAS", "AZ"],
  ]);

const readCell = (filePath: string, cell: string): unknown => {
  const workbook = XLSX.readFile(filePath);
  return workbook.Sheets[workbook.SheetNames[0]][cell]?.v;
};

const yes = () => Promise.resolve(true);
const no = () => Promise.resolve(false);

// Rewrites one file inside the xlsx archive.
const editEntry = async (
  filePath: string,
  name: string,
  edit: (xml: string) => string | null
): Promise<void> => {
  const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
  const updated = edit(await zip.file(name)!.async("string"));
  if (updated === null) zip.remove(name);
  else zip.file(name, updated);
  fs.writeFileSync(filePath, await zip.generateAsync({ type: "nodebuffer" }));
};

describe("suggestFix", () => {
  it("offers the single closest candidate", () => {
    expect(suggestFix("WAS", ["WASH", "AZ"])).toBe("WASH");
  });

  it("offers nothing on a tie, a distant match or no candidates", () => {
    expect(suggestFix("AB", ["AC", "AD"])).toBeUndefined();
    expect(suggestFix("ZZZZZ", ["WASH"])).toBeUndefined();
    expect(suggestFix("WAS", [])).toBeUndefined();
  });
});

describe("didYouMean", () => {
  it("is empty without candidates", () => {
    expect(didYouMean("WAS", [])).toBe("");
  });
});

describe("findSpreadsheet", () => {
  it("throws for a week with no spreadsheet", () => {
    expect(() => findSpreadsheet(99)).toThrow("Spreadsheet not found for week 99");
  });
});

describe("findIssues", () => {
  it("suggests a fix for a misspelled pick", () => {
    const [issue] = findIssues(typoSheet());
    expect(issue.fix).toEqual({ cell: "B3", value: "WASH" });
    expect(issue.message).toBe(
      `Row 3: Adam's pick "WAS" is not a recognized team code. Did you mean "WASH"?`
    );
  });

  it("locates cells past blank rows and in sheets not starting at A1", () => {
    const filePath = writeSheet([
      [null, "WK 12", "Adam"],
      [null, "WASH"],
      [],
      [null, "AZ", "WAS"],
    ]);
    expect(findIssues(filePath)[0].fix).toEqual({ cell: "C4", value: "WASH" });
  });

  it("reports a sheet with no week column", () => {
    const issues = findIssues(writeSheet([["Adam"], ["AZ"]]));
    expect(issues.map((issue) => issue.message)).toEqual([
      "Could not find a 'WK <n>' column in the spreadsheet.",
    ]);
  });

  it("fixes a misspelled player column only if that player is missing", () => {
    const filePath = writeSheet([
      ["WK 12", "Adm", "Alex", "Alx"],
      ["WASH", "x", "x", "x"],
      ["AZ", "AZ", "AZ", "AZ"],
    ]);
    expect(findIssues(filePath).map((issue) => issue.fix)).toEqual([
      { cell: "B1", value: "Adam" },
      undefined,
    ]);
  });

  it("offers no fix for a header it cannot locate", () => {
    const filePath = writeSheet([
      ["WK 12", null],
      ["WASH", "a"],
      ["AZ", "b"],
    ]);
    expect(findIssues(filePath)[0].fix).toBeUndefined();
  });

  it("holds back pick fixes until the matchup is right", () => {
    const filePath = writeSheet([
      ["WK 12", "Adam"],
      ["WAS"],
      ["AZ", "AZZ"],
      ["QQQQQ"],
      ["ZZZZZ", "QQQQ"],
    ]);
    const fixes = findIssues(filePath).map((issue) => issue.fix);
    expect(fixes).toEqual([
      { cell: "A2", value: "WASH" },
      undefined,
      undefined,
      undefined,
      undefined,
    ]);
  });

  it("does not guess at a real team that isn't playing", () => {
    const filePath = writeSheet([
      ["WK 12", "Adam", "Alex", "Ben", "Nobody"],
      ["WASH"],
      ["AZ", "KC", "x", 7, "??"],
      [1],
      [2],
    ]);
    const issues = findIssues(filePath);
    expect(issues).toHaveLength(2);
    expect(issues[1].message).toContain("is not one of the teams in this matchup");
    expect(issues[1].fix).toBeUndefined();
  });
});

describe("applyFix", () => {
  const fix = { cell: "B3", value: "WASH" };

  it("changes only the one cell and keeps its style", async () => {
    const filePath = typoSheet();
    const sheet = "xl/worksheets/sheet1.xml";
    await editEntry(filePath, sheet, (xml) => xml.replace('<c r="B3"', '<c r="B3" s="0"'));

    await applyFix(filePath, fix);

    expect(readCell(filePath, "B3")).toBe("WASH");
    expect(readCell(filePath, "C3")).toBe("AZ");
    const zip = await JSZip.loadAsync(fs.readFileSync(filePath));
    expect(await zip.file(sheet)!.async("string")).toContain(
      '<c r="B3" s="0" t="inlineStr">'
    );
  });

  it("follows an absolute sheet path", async () => {
    const filePath = typoSheet();
    await editEntry(filePath, "xl/_rels/workbook.xml.rels", (xml) =>
      xml.replace('Target="worksheets/', 'Target="/xl/worksheets/')
    );
    await applyFix(filePath, fix);
    expect(readCell(filePath, "B3")).toBe("WASH");
  });

  it.each([
    ["xl/workbook.xml", () => null, "has no xl/workbook.xml"],
    ["xl/workbook.xml", () => "<workbook/>", "Could not find the first sheet"],
    ["xl/_rels/workbook.xml.rels", () => "<Relationships/>", "Could not find the first sheet"],
    [
      "xl/_rels/workbook.xml.rels",
      (xml: string) => xml.replace(/Target=/g, "Other="),
      "Could not find the first sheet",
    ],
    ["xl/worksheets/sheet1.xml", () => "<worksheet/>", "Could not find cell B3"],
    [
      "xl/worksheets/sheet1.xml",
      (xml: string) => xml.replace(/(<c r="B3"[^>]*>)/, "$1<f>A1</f>"),
      "holds a formula",
    ],
  ])("refuses a file it cannot safely edit (%s)", async (name, edit, message) => {
    const filePath = typoSheet();
    await editEntry(filePath, name, edit);
    await expect(applyFix(filePath, fix)).rejects.toThrow(message);
  });
});

describe("terminalConfirm", () => {
  it.each([
    ["y", true],
    [" YES ", true],
    ["n", false],
    ["", false],
  ])("treats %p as %p", async (answer, expected) => {
    const input = new PassThrough();
    const output = new PassThrough();
    const result = terminalConfirm(input, output)("Update? ");
    input.write(`${answer}\n`);
    await expect(result).resolves.toBe(expected);
  });
});

describe("fixSpreadsheet", () => {
  it("asks, then updates the file", async () => {
    const filePath = typoSheet();
    const confirm = jest.fn(yes);

    await expect(fixSpreadsheet(filePath, confirm)).resolves.toEqual([]);

    expect(confirm).toHaveBeenCalledWith(
      expect.stringContaining('Would you like to update to "WASH"?')
    );
    expect(readCell(filePath, "B3")).toBe("WASH");
    expect(stdout).toHaveBeenCalledWith('Updated cell B3 to "WASH".\n');
  });

  it("leaves the file alone when declined, asking only once", async () => {
    const filePath = typoSheet();
    const before = fs.readFileSync(filePath);
    const confirm = jest.fn(no);

    await expect(fixSpreadsheet(filePath, confirm)).resolves.toHaveLength(1);

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(fs.readFileSync(filePath).equals(before)).toBe(true);
  });

  it("offers pick fixes after the team code is fixed", async () => {
    const filePath = writeSheet([
      ["WK 12", "Adam"],
      ["WAS"],
      ["AZ", "WAS"],
    ]);
    await expect(fixSpreadsheet(filePath, yes)).resolves.toEqual([]);
    expect(readCell(filePath, "A2")).toBe("WASH");
    expect(readCell(filePath, "B3")).toBe("WASH");
  });
});

describe("interactiveConfirm", () => {
  const streams = [process.stdin, process.stdout];
  const original = streams.map((stream) => Object.getOwnPropertyDescriptor(stream, "isTTY"));
  const setTTY = (...values: boolean[]) =>
    streams.forEach((stream, i) =>
      Object.defineProperty(stream, "isTTY", { value: values[i], configurable: true })
    );

  afterEach(() => {
    streams.forEach((stream, i) => {
      const descriptor = original[i];
      if (descriptor) Object.defineProperty(stream, "isTTY", descriptor);
      else delete (stream as { isTTY?: boolean }).isTTY;
    });
  });

  it("is available when both ends are a terminal", () => {
    setTTY(true, true);
    expect(interactiveConfirm()).toEqual(expect.any(Function));
  });

  it.each([
    [false, true],
    [true, false],
  ])("is unavailable otherwise (stdin %p, stdout %p)", (stdinTTY, stdoutTTY) => {
    setTTY(stdinTTY, stdoutTTY);
    expect(interactiveConfirm()).toBeUndefined();
  });
});

describe("requireCleanSpreadsheet", () => {
  it("carries on once the typos are fixed", async () => {
    const filePath = typoSheet();
    await expect(requireCleanSpreadsheet(filePath, yes)).resolves.toBeUndefined();
    expect(readCell(filePath, "B3")).toBe("WASH");
  });

  it.each([
    ["declined", no],
    ["nobody can confirm", undefined],
  ])("throws when typos remain (%s)", async (_, confirm) => {
    const filePath = typoSheet();
    await expect(requireCleanSpreadsheet(filePath, confirm)).rejects.toThrow(
      /Found 1 issue\(s\)[\s\S]*Did you mean "WASH"[\s\S]*repo has not been changed/
    );
    expect(readCell(filePath, "B3")).toBe("WAS");
  });
});

describe("runCheck", () => {
  it("reports typos without changing anything when nobody can confirm", async () => {
    const filePath = typoSheet();
    await expect(runCheck(filePath)).resolves.toBe(false);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('Did you mean "WASH"?'));
    expect(readCell(filePath, "B3")).toBe("WAS");
  });

  it("passes once the typos are fixed", async () => {
    await expect(runCheck(typoSheet(), yes)).resolves.toBe(true);
    expect(stdout).toHaveBeenCalledWith(expect.stringContaining("check passed"));
    expect(warn).not.toHaveBeenCalled();
  });

  // Stands in for the repo's spreadsheets so these don't depend on their contents.
  const stubWeekFiles = () => {
    const workbook = XLSX.readFile(writeSheet([["WK 12"], ["WASH"], ["AZ"]]));
    return jest.spyOn(XLSX, "readFile").mockReturnValue(workbook);
  };

  it("checks the current week and next week's blank by default", async () => {
    const readFile = stubWeekFiles();
    await expect(runCheck()).resolves.toBe(true);
    expect(readFile).toHaveBeenCalledWith(
      expect.stringContaining(`Week ${CURRENT_WEEK + 1}.xlsx`)
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("warns when next week's blank is missing", async () => {
    stubWeekFiles();
    mockHideBlanks = true;
    await expect(runCheck()).resolves.toBe(true);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("No blank for week"));
  });
});
