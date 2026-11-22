# Football Pool

## Testing and coverage

- After any code change, run `npm test` and confirm it passes with 100% statement, branch, function and line coverage.
- Never lower coverage. Every new or changed line, including every branch, must be covered by tests before the work is considered done.
- Do not lower the `coverageThreshold` in `package.json`, and do not add to `coveragePathIgnorePatterns` or use `istanbul ignore` comments to get around a coverage gap. Write the missing tests instead.
- `npm test` enforces a global 100% threshold, so a coverage drop fails the run.
