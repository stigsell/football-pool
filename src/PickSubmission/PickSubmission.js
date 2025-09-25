import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";

import { PLAYERS } from "../utils/constants";
import "./PickSubmission.css";

function PickSubmission({ games, scores, playersProjectedMNFPoints }) {
  const [weekNum, setWeekNum] = useState(0);
  const [player, setPlayer] = useState("");
  const [gamesFromSheet, setGamesFromSheet] = useState([]);
  const [tiebreakerLabel, setTiebreakerLabel] = useState("");
  const [picks, setPicks] = useState({});
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    if (!weekNum) return;

    // Fetch the xlsx file from public/blank_spreadsheets
    const path = `/blank_spreadsheets/Week ${weekNum}.xlsx`;

    setFetchError("");
    fetch(path)
      .then((res) => {
        if (!res.ok) throw new Error(`Could not load ${path}`);
        return res.arrayBuffer();
      })
      .then((ab) => {
        const data = new Uint8Array(ab);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];

        // Read column A values starting at row 2
        let teams = [];
        let row = 2;
        while (true) {
          const cellAddr = `A${row}`;
          const cell = sheet[cellAddr];
          if (!cell || !cell.v) break;
          const val = String(cell.v).trim();
          teams.push(val);
          row += 1;
        }

        // If there's an odd final row, treat it as the tiebreaker label (user-entered integer)
        let pairs = [];
        let tbLabel = "";

        if (teams.length % 2 === 1) {
          // last entry is the tiebreaker label
          tbLabel = teams[teams.length - 1];
          teams = teams.slice(0, teams.length - 1);
        }

        for (let i = 0; i < teams.length; i += 2) {
          const t1 = teams[i] || "";
          const t2 = teams[i + 1] || "";
          if (!t1 && !t2) continue;
          pairs.push([t1, t2]);
        }

        setGamesFromSheet(pairs);
        setTiebreakerLabel(tbLabel);
        // reset picks when week changes
        setPicks({});
      })
      .catch((err) => {
        console.error(err);
        setFetchError(String(err.message || err));
        setGamesFromSheet([]);
      });
  }, [weekNum]);

  function selectPick(gameIndex, team) {
    setPicks((prev) => ({ ...prev, [gameIndex]: team }));
  }

  async function downloadSpreadsheet() {
    if (!player || !weekNum) return;

    const path = `/blank_spreadsheets/Week ${weekNum}.xlsx`;
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Could not load ${path}`);
      const ab = await res.arrayBuffer();
      const data = new Uint8Array(ab);
      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];

      // helper to write a cell value while preserving existing formatting (if present)
      const writeCellPreserve = (addr, value, type, styleSourceAddr) => {
        const existing = sheet[addr];
        if (existing) {
          // mutate existing cell so styles remain
          existing.v = value;
          existing.t = type;
        } else {
          const newCell = { t: type, v: value };
          const src = sheet[styleSourceAddr];
          if (src && src.s) newCell.s = src.s;
          sheet[addr] = newCell;
        }
      };

      // helpers to convert column letters to numbers and back (A -> 1)
      const colToNumber = (col) => {
        let n = 0;
        for (let i = 0; i < col.length; i++) {
          n = n * 26 + (col.charCodeAt(i) - 64);
        }
        return n;
      };

      const numberToCol = (num) => {
        let s = "";
        while (num > 0) {
          const rem = (num - 1) % 26;
          s = String.fromCharCode(65 + rem) + s;
          num = Math.floor((num - 1) / 26);
        }
        return s;
      };

      // Find header row (assume header is row 1). Find the column for the player name.
      const headerRow = 1;
      // Scan columns A..Z then AA..AZ as needed for a header match. We'll scan up to column Z (enough for this app).
      const playerCol = (() => {
        const cols = [];
        for (let c = 0; c < 26; c++) cols.push(String.fromCharCode(65 + c));
        for (const col of cols) {
          const addr = `${col}${headerRow}`;
          const cell = sheet[addr];
          if (cell && String(cell.v).trim() === player) return col;
        }
        return null;
      })();

      // If player column not found, append into the next empty column after last header
      let targetCol = playerCol;
      if (!targetCol) {
        // find last used column in header row
        let lastCol = "A";
        for (let c = 0; c < 26; c++) {
          const col = String.fromCharCode(65 + c);
          const addr = `${col}${headerRow}`;
          if (
            sheet[addr] &&
            sheet[addr].v !== undefined &&
            sheet[addr].v !== ""
          ) {
            lastCol = col;
          } else {
            // first empty
            lastCol = col;
            break;
          }
        }
        targetCol = lastCol;
        // determine previous column to copy styles from (if any)
        const prevColNum = colToNumber(targetCol) - 1;
        const prevCol = prevColNum >= 1 ? numberToCol(prevColNum) : null;
        // set header cell to player, preserving formatting from previous column header if present
        const headerStyleSrc = prevCol
          ? `${prevCol}${headerRow}`
          : `A${headerRow}`;
        writeCellPreserve(
          `${targetCol}${headerRow}`,
          player,
          "s",
          headerStyleSrc
        );
      }
      // For each game, write the chosen team name into the second line of the game pair
      for (let i = 0; i < gamesFromSheet.length; i++) {
        const [teamA, teamB] = gamesFromSheet[i];
        const picked = picks[i];
        if (!picked) continue;

        let targetRow = null;
        // Try to find contiguous pair where row is teamA and next row is teamB
        for (let row = 2; row < 500; row++) {
          const cell = sheet[`A${row}`];
          if (!cell || cell.v === undefined || cell.v === "") break;
          const val = String(cell.v).trim();
          const nextCell = sheet[`A${row + 1}`];
          const nextVal =
            nextCell && nextCell.v !== undefined
              ? String(nextCell.v).trim()
              : "";
          if (val === teamA && nextVal === teamB) {
            targetRow = row + 1; // second line of the pair
            break;
          }
        }

        // If not found as a pair, prefer the row that contains teamB (already second), otherwise teamA + 1
        if (!targetRow) {
          for (let row = 2; row < 500; row++) {
            const cell = sheet[`A${row}`];
            if (!cell || cell.v === undefined || cell.v === "") break;
            const val = String(cell.v).trim();
            if (val === teamB) {
              targetRow = row;
              break;
            }
          }
        }
        if (!targetRow) {
          for (let row = 2; row < 500; row++) {
            const cell = sheet[`A${row}`];
            if (!cell || cell.v === undefined || cell.v === "") break;
            const val = String(cell.v).trim();
            if (val === teamA) {
              targetRow = row + 1;
              break;
            }
          }
        }

        if (targetRow) {
          const addr = `${targetCol}${targetRow}`;
          // prefer to preserve formatting from the same row in the previous column if available,
          // otherwise fall back to column A on that row
          const prevColNum = colToNumber(targetCol) - 1;
          const prevCol = prevColNum >= 1 ? numberToCol(prevColNum) : null;
          const styleSrc = prevCol ? `${prevCol}${targetRow}` : `A${targetRow}`;
          writeCellPreserve(addr, picked, "s", styleSrc);
        }
      }

      // Write tiebreaker if present. Find the tiebreaker label row (last odd row) — we stored tiebreakerLabel earlier.
      if (tiebreakerLabel) {
        // find the row that contains the tiebreakerLabel value
        for (let row = 2; row < 500; row++) {
          const addr = `A${row}`;
          const cell = sheet[addr];
          if (!cell || cell.v === undefined || cell.v === "") break;
          const val = String(cell.v).trim();
          if (val === tiebreakerLabel) {
            // write numeric tiebreaker in player's column at this row
            const tbVal =
              picks.tiebreaker === "" || picks.tiebreaker === undefined
                ? null
                : picks.tiebreaker;
            if (tbVal !== null) {
              const prevColNum = colToNumber(targetCol) - 1;
              const prevCol = prevColNum >= 1 ? numberToCol(prevColNum) : null;
              const styleSrc = prevCol ? `${prevCol}${row}` : `A${row}`;
              writeCellPreserve(
                `${targetCol}${row}`,
                Number(tbVal),
                "n",
                styleSrc
              );
            }
            break;
          }
        }
      }

      // Generate new workbook binary and trigger download
      const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([wbout], { type: "application/octet-stream" });
      const urlObj = window.URL || window.webkitURL;
      const url = urlObj.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Week ${weekNum} - ${player}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      urlObj.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setFetchError(String(err.message || err));
    }
  }

  function emailRick() {
    const base =
      "This spreadsheet was generated on sieglfootballpool.com\n\n⚠️NOTE: Ensure to attach the spreadsheet to this email.";
    const weekPart = weekNum ? `Week ${weekNum} picks` : "Week ? picks";
    const signature = player ? `\n\nThanks,\n${player}` : "";
    const body = `${base}${signature}`;
    const subject = weekPart;

    // use mailto to open user's default email client with recipient, subject and body
    const mailto = `mailto:Rick.Siegl@outlook.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <>
      <h2>Pick Submission</h2>

      <div className="PickSubmission">
        <select
          value={weekNum}
          onChange={(e) => setWeekNum(Number(e.target.value))}
        >
          <option value={0}>Select Week</option>
          {Array.from({ length: 15 }, (_, i) => (
            <option key={i + 4} value={i + 4}>
              Week {i + 4}
            </option>
          ))}
        </select>
        <select value={player} onChange={(e) => setPlayer(e.target.value)}>
          <option value="">Select Player</option>
          {Array.from(PLAYERS).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {player !== "" && weekNum > 0 && (
          <div className="week-games">
            <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
              {fetchError && `| error: ${fetchError}`}
            </div>
            {gamesFromSheet.length === 0 && (
              <div>No games found for Week {weekNum}</div>
            )}

            {gamesFromSheet.map(([teamA, teamB], idx) => (
              <div className="game" key={idx} style={{ margin: "8px 0" }}>
                <label className="left-label">
                  <input
                    type="radio"
                    name={`game-${idx}`}
                    checked={picks[idx] === teamA}
                    onChange={() => selectPick(idx, teamA)}
                  />
                  {teamA}
                </label>
                <label className="right-label">
                  <input
                    type="radio"
                    name={`game-${idx}`}
                    checked={picks[idx] === teamB}
                    onChange={() => selectPick(idx, teamB)}
                  />
                  {teamB}
                </label>
              </div>
            ))}

            {tiebreakerLabel && (
              <div className="tiebreaker" style={{ marginTop: 12 }}>
                <div>{tiebreakerLabel}</div>
                <input
                  type="number"
                  step={1}
                  min={0}
                  value={picks.tiebreaker ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    // allow empty to clear, otherwise parse integer
                    const intVal = v === "" ? "" : Math.floor(Number(v));
                    setPicks((prev) => ({ ...prev, tiebreaker: intVal }));
                  }}
                />
              </div>
            )}
            <button
              style={{ marginTop: 16 }}
              onClick={downloadSpreadsheet}
              disabled={
                !player ||
                !weekNum ||
                gamesFromSheet.some((_, i) => !picks[i] || picks[i] === "") ||
                (tiebreakerLabel &&
                  (picks.tiebreaker === "" || picks.tiebreaker === undefined))
              }
            >
              Download Spreadsheet
            </button>
            <button type="button" onClick={emailRick} style={{ marginLeft: 8 }}>
              Email Rick
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default PickSubmission;
