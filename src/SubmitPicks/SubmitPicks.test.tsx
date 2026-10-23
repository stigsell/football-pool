import * as fs from "fs";
import * as path from "path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import SubmitPicks from "./SubmitPicks";
import { CURRENT_WEEK } from "../utils/constants";

const PICKS_WEEK = CURRENT_WEEK + 1;
const BLANK_PATH = path.join(
  __dirname,
  `../../public/blank-spreadsheets/Week ${PICKS_WEEK}.xlsx`
);

const blankResponse = () => {
  const buffer = fs.readFileSync(BLANK_PATH);
  const data = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
  return Promise.resolve({ ok: true, arrayBuffer: () => Promise.resolve(data) });
};

// Picks every game's home team, the second radio in each matchup.
const pickAllHomeTeams = () => {
  screen.getAllByRole("group").forEach((group) => {
    const radios = group.querySelectorAll("input[type=radio]");
    fireEvent.click(radios[1]);
  });
};

const fillForm = (player = "Nick", points = "42") => {
  fireEvent.change(screen.getByRole("combobox"), { target: { value: player } });
  pickAllHomeTeams();
  fireEvent.change(screen.getByRole("spinbutton"), { target: { value: points } });
};

const setPhone = (isPhone: boolean) => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: isPhone }) as jest.Mock;
  Object.defineProperty(navigator, "canShare", {
    configurable: true,
    value: isPhone ? jest.fn().mockReturnValue(true) : undefined,
  });
  Object.defineProperty(navigator, "share", {
    configurable: true,
    value: isPhone ? jest.fn().mockResolvedValue(undefined) : undefined,
  });
};

describe("SubmitPicks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setPhone(false);
    global.fetch = jest.fn(blankResponse) as jest.Mock;
    URL.createObjectURL = jest.fn(() => "blob:picks");
    URL.revokeObjectURL = jest.fn();
  });

  it("fetches the blank for the upcoming week", async () => {
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    expect(global.fetch).toHaveBeenCalledWith(
      `/blank-spreadsheets/Week ${PICKS_WEEK}.xlsx`
    );
  });

  it("says picks aren't open when there is no blank", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 })) as jest.Mock;

    render(<SubmitPicks />);
    expect(
      await screen.findByText(`Picks for Week ${PICKS_WEEK} aren't open yet.`)
    ).toBeInTheDocument();
  });

  it("shows a pair of radio buttons for every matchup", async () => {
    render(<SubmitPicks />);
    const groups = await screen.findAllByRole("group");
    groups.forEach((group) => {
      expect(group.querySelectorAll("input[type=radio]")).toHaveLength(2);
    });
    expect(screen.getByText(`0 of ${groups.length} picked`)).toBeInTheDocument();
  });

  it("keeps Download disabled until the name, every pick and the points are in", async () => {
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    const download = screen.getByRole("button", { name: "Download" });

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "Nick" } });
    expect(download).toBeDisabled();
    pickAllHomeTeams();
    expect(download).toBeDisabled();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "4.5" } });
    expect(download).toBeDisabled();
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "45" } });
    expect(download).toBeEnabled();
  });

  it("downloads the filled spreadsheet named after the week and player", async () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    fillForm("Kylee");

    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    const file = (URL.createObjectURL as jest.Mock).mock.calls[0][0] as File;
    expect(file.name).toBe(`Week ${PICKS_WEEK} - Kylee.xlsx`);
    expect((click.mock.instances[0] as unknown as HTMLAnchorElement).download).toBe(file.name);
  });

  it("remembers a half-entered draft across a reload", async () => {
    const { unmount } = render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    fillForm("Ben", "38");
    unmount();

    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    expect(screen.getByRole("combobox")).toHaveValue("Ben");
    expect(screen.getByRole("spinbutton")).toHaveValue(38);
    expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
  });

  it("hides Send Email off a phone", async () => {
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    expect(screen.queryByRole("button", { name: "Send Email" })).not.toBeInTheDocument();
  });

  it("shares the filled spreadsheet from a phone", async () => {
    setPhone(true);
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    fillForm("Tammy");

    fireEvent.click(screen.getByRole("button", { name: "Send Email" }));

    await waitFor(() => expect(navigator.share).toHaveBeenCalled());
    const { files } = (navigator.share as jest.Mock).mock.calls[0][0] as { files: File[] };
    expect(files[0].name).toBe(`Week ${PICKS_WEEK} - Tammy.xlsx`);
  });

  it("stays quiet when the share sheet is closed", async () => {
    setPhone(true);
    (navigator.share as jest.Mock).mockRejectedValue(
      Object.assign(new Error("closed"), { name: "AbortError" })
    );
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    fillForm();

    fireEvent.click(screen.getByRole("button", { name: "Send Email" }));

    await waitFor(() => expect(navigator.share).toHaveBeenCalled());
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });
});
