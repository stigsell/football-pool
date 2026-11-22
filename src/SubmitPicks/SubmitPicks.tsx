import { useEffect, useState } from "react";

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
// Not tied to a week, so the name is prefilled again next week.
const PLAYER_KEY = "submitPicks:player";

interface Draft {
  player: Player | "";
  picks: Picks;
  mnfPoints: string;
}

type Blank = { data: ArrayBuffer; layout: BlankLayout };

// A refresh on a phone shouldn't wipe half-entered picks, but the page has to
// work without storage too (private browsing, blocked site data).
const loadPlayer = (): Player | "" => {
  try {
    const saved = localStorage.getItem(PLAYER_KEY);
    if (saved && (PLAYERS as readonly string[]).includes(saved)) return saved as Player;
  } catch {
    // No remembered name.
  }
  return "";
};

const loadDraft = (): Draft => {
  try {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      const draft = JSON.parse(saved) as Draft;
      return { ...draft, player: draft.player || loadPlayer() };
    }
  } catch {
    // Fall through to an empty draft.
  }
  return { player: loadPlayer(), picks: {}, mnfPoints: "" };
};

const saveDraft = (draft: Draft) => {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    if (draft.player) localStorage.setItem(PLAYER_KEY, draft.player);
  } catch {
    // Drafts are a convenience; losing one is fine.
  }
};

const isValidPoints = (value: string): boolean => /^\d+$/.test(value.trim());

function SubmitPicks() {
  const [blank, setBlank] = useState<Blank | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(loadDraft);
  const [saveError, setSaveError] = useState<string | null>(null);

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
      // Only reached once the download has been triggered without error.
      updateDraft({ picks: {} });
    } catch (err) {
      console.error(err);
      setSaveError("Something went wrong building your spreadsheet.");
    }
  };



  return (
    <div className="SubmitPicks">
      <h2>Week {PICKS_WEEK} Picks</h2>

      <div className="SubmitPicks__field">
        <select
          className="SubmitPicks__name"
          aria-label="Name"
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
      </div>

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
          className="SubmitPicks__points"
          type="number"
          inputMode="numeric"
          min={0}
          value={draft.mnfPoints}
          onChange={(e) => updateDraft({ mnfPoints: e.target.value })}
        />
      </label>

      <div className="SubmitPicks__actions">
        <p className="SubmitPicks__progress">
          {pickedCount} of {games.length} picked
        </p>
        <button type="button" disabled={!isComplete} onClick={handleDownload}>
          Download
        </button>
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
