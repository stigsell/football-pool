import * as fs from "fs";
import * as path from "path";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

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

describe("SubmitPicks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
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

  it("shows an error when the spreadsheet can't be built for download", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    fillForm();
    (URL.createObjectURL as jest.Mock).mockImplementation(() => {
      throw new Error("no blobs");
    });

    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    expect(
      await screen.findByText("Something went wrong building your spreadsheet.")
    ).toBeInTheDocument();
  });

  it("releases the download URL after a moment", async () => {
    jest.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    fillForm();
    jest.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole("button", { name: "Download" }));
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:picks");
    } finally {
      jest.useRealTimers();
    }
  });

  it("starts empty when the saved draft is unreadable", async () => {
    localStorage.setItem(`submitPicks:week${PICKS_WEEK}`, "{not json");
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("works when storage can't be written", async () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<SubmitPicks />);
    await screen.findByText(`Week ${PICKS_WEEK} Picks`);
    fillForm();
    expect(screen.getByRole("button", { name: "Download" })).toBeEnabled();
    jest.restoreAllMocks();
  });
});
