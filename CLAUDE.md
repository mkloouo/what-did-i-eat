@AGENTS.md

`~/.claude/RTK.md` (global, loaded every session regardless of project) — see there
instead of duplicating it here. `rtk init` may attempt to re-add a per-project block on
this project's next run; if so, re-remove it and keep this file down to the
project-specific gotchas below.

## RTK gotchas (learned from this project's failure log)

A `~/.claude/settings.json` `PreToolUse` hook (matcher `Bash`, `rtk hook claude`) already
intercepts and rewrites *every* Bash command transparently before it runs — you don't
need to manually type `rtk` for that filtering to apply. Manually prefixing is only safe
for commands `rtk` actually has a subcommand for (everything listed above). For anything
else, `rtk <cmd>` does **not** pass through unchanged — it hard-errors ("unrecognized
subcommand") — contradicting the Golden Rule text above, which is auto-generated and
currently wrong on this point. Checked against this project's `rtk gain --failures` log:
24 of the last 33 parse failures (73%) were exactly this — manually typing `rtk cat`,
`rtk head`, `rtk tail`, `rtk du`, `rtk sed`, or `rtk ssh`, none of which are real `rtk`
subcommands. Just run those plain, unprefixed, and let the hook decide.

Specific pitfalls seen repeatedly in this project's history:

- No `rtk cat` — use `rtk read <file>` (or the Read tool) instead.
- No `rtk ssh`, `rtk head`, `rtk tail`, `rtk du`, `rtk sed` — run these unprefixed.
- `rtk grep -l <n>` means "max line length" (it's `--max-len`), **not** native grep's
  "-l = files with matches only". For the native meaning, run plain `grep -l` unprefixed.
- `rtk docker ps`/`rtk docker logs` don't accept passthrough flags like `--filter`,
  `--format`, `--tail` — drop the `rtk` prefix for those invocations.
- Watch subcommand spelling: `rtk discover` (not `discovery`), `rtk gain` (not `gian`),
  `rtk git status` (not bare `rtk status`) — a typo'd subcommand errors, it doesn't fall
  back to anything.
