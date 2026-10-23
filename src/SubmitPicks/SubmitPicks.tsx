import { useEffect, useMemo, useState } from "react";

import { CURRENT_WEEK, PLAYERS } from "../utils/constants";
import {
  XLSX_MIME_TYPE,
  blankSpreadsheetPath,
  fillPicks,
  parseBlank,
  picksFileName,
} from "./utils";
import type { BlankLayout, Picks } from "./utils";
import type { Player, RickTeamCode } from "../utils/constants";

// Picks open for the week after the one being played.
const PICKS_WEEK = CURRENT_WEEK + 1;
const DRAFT_KEY = `submitPicks:week${PICKS_WEEK}`;

interface Draft {
  player: Player | "";
  picks: Picks;
  mnfPoints: string;
}

type Blank = { data: ArrayBuffer; layout: BlankLayout };

// A refresh on a phone shouldn't wipe half-entered picks, but the page has to
// work without storage too (private browsing, blocked site data).
const loadDraft = (): Draft => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) return JSON.parse(saved) as Draft;
  } catch {
    // Fall through to an empty draft.
  }
  return { player: "", picks: {}, mnfPoints: "" };
};

const saveDraft = (draft: Draft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Drafts are a convenience; losing one is fine.
  }
};

// "Send Email" hands the file to the phone's share sheet, so it only shows on
// touch devices that can share files.
const canShareFiles = (): boolean => {
  if (typeof navigator.canShare !== "function") return false;
  if (!window.matchMedia?.("(pointer: coarse)").matches) return false;
  try {
    const probe = new File([""], "probe.xlsx", { type: XLSX_MIME_TYPE });
    return navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
};

const isValidPoints = (value: string): boolean => /^\d+$/.test(value.trim());

function SubmitPicks() {
  const [blank, setBlank] = useState<Blank | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [saveError, setSaveError] = useState<string | null>(null);
  const showSendEmail = useMemo(canShareFiles, []);

  useEffect(() => {
    async function fetchBlank() {
      try {
        const response = await fetch(blankSpreadsheetPath(PICKS_WEEK));
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        setBlank({ data, layout: parseBlank(data) });
      } catch (err) {
        console.error(err);
        setLoadError(`Picks for Week ${PICKS_WEEK} aren't open yet.`);
      }
    }
    fetchBlank();
  }, []);

  const updateDraft = (changes: Partial<Draft>) =>
    setDraft((current) => {
      const next = { ...current, ...changes };
      saveDraft(next);
      return next;
    });

  const choosePick = (row: number, team: RickTeamCode) =>
    updateDraft({ picks: { ...draft.picks, [row]: team } });

  if (loadError) {
    return (
      <div className="SubmitPicks">
        <h2>Submit Picks</h2>
        <p>{loadError}</p>
      </div>
    );
  }
  if (!blank) return null;

  const { games } = blank.layout;
  // A saved draft can hold a team from an older blank, so only count picks
  // that match a team in this week's matchup.
  const pickedCount = games.filter((game) => {
    const pick = draft.picks[game.row];
    return pick === game.away || pick === game.home;
  }).length;
  const isComplete =
    draft.player !== "" && pickedCount === games.length && isValidPoints(draft.mnfPoints);

  const buildFile = async (): Promise<File> => {
    const player = draft.player as Player;
    const data = await fillPicks(
      blank.data,
      blank.layout,
      player,
      draft.picks,
      Number(draft.mnfPoints.trim())
    );
    return new File([data], picksFileName(PICKS_WEEK, player), { type: XLSX_MIME_TYPE });
  };

  const handleDownload = async () => {
    setSaveError(null);
    try {
      const file = await buildFile();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      // Safari can still be reading the URL right after the click.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
      setSaveError("Something went wrong building your spreadsheet.");
    }
  };

  const handleSendEmail = async () => {
    setSaveError(null);
    try {
      const file = await buildFile();
      await navigator.share({
        files: [file],
        title: file.name,
        text: `${draft.player}'s Week ${PICKS_WEEK} picks`,
      });
    } catch (err) {
      // Closing the share sheet isn't an error worth showing.
      if ((err as Error).name === "AbortError") return;
      console.error(err);
      setSaveError("Something went wrong sharing your spreadsheet.");
    }
  };

  return (
    <div className="SubmitPicks">
      <h2>Week {PICKS_WEEK} Picks</h2>

      <label className="SubmitPicks__field">
        Name{" "}
        <select
          value={draft.player}
          onChange={(e) => updateDraft({ player: e.target.value as Player | "" })}
        >
          <option value="">Select your name</option>
          {PLAYERS.map((player) => (
            <option key={player} value={player}>
              {player}
            </option>
          ))}
        </select>
      </label>

      {games.map((game) => (
        <fieldset key={game.row} className="SubmitPicks__game">
          <legend>
            {game.away} @ {game.home}
          </legend>
          {[game.away, game.home].map((team) => (
            <label key={team} className="SubmitPicks__team">
              <input
                type="radio"
                name={`game-${game.row}`}
                value={team}
                checked={draft.picks[game.row] === team}
                onChange={() => choosePick(game.row, team)}
              />
              {team}
            </label>
          ))}
        </fieldset>
      ))}

      <label className="SubmitPicks__field">
        MNF total points{" "}
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={draft.mnfPoints}
          onChange={(e) => updateDraft({ mnfPoints: e.target.value })}
        />
      </label>

      <p className="SubmitPicks__progress">
        {pickedCount} of {games.length} picked
      </p>

      <div className="SubmitPicks__actions">
        <button type="button" disabled={!isComplete} onClick={handleDownload}>
          Download
        </button>
        {showSendEmail ? (
          <button type="button" disabled={!isComplete} onClick={handleSendEmail}>
            Send Email
          </button>
        ) : null}
      </div>
      {saveError !== null ? <p className="SubmitPicks__error">{saveError}</p> : null}
      <p>
        📧 Email the spreadsheet to Rick before Thursday at 12:00 Central time (unless there are
        games before then)
      </p>
      <p>⚠️ Double check your spreadsheet entries before emailing! This site is not responsible for errors</p>
    </div>
  );
}

export default SubmitPicks;
