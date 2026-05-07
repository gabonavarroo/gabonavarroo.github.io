# Handoffs

> One markdown file per cross-agent handoff. Filename: `YYYY-MM-DD-<short-tag>.md`. Examples: `2026-05-08-fbm-shader.md`, `2026-05-09-runner-poses.md`.
>
> Source agent writes the handoff; target agent appends their result + screenshot links + status. Never delete a handoff — supersede with a new one if needed.

## Template

Copy this template into a new file when creating a handoff.

```markdown
# Handoff — <short title>

- **Source:** <Agent>          (e.g., Claude Code)
- **Target:** <Agent>          (e.g., Codex)
- **Sprint:** <Sprint id>      (e.g., 2D)
- **Date:** YYYY-MM-DD
- **Status:** Open | In progress | Delivered | Verified | Superseded

## Task
One-paragraph statement of what the target agent must produce.

## Spec reference
- DESIGN.md §<X> ([link to section]) — paste relevant excerpt below if it would change the meaning to leave it implicit.
- CLAUDE.md §<X>
- Related decisions: D<N>

## Inputs (files, data)
- `path/to/input1.ts` — <description>
- inline data: <if any>

## Expected output
- File path(s): `src/components/.../Component.tsx`, `src/shaders/<name>.frag.glsl`, etc.
- Screenshot: 1280×900 attached as `<filename>.png` in this directory.
- Poster (if applicable): 1200×900 PNG at `public/posters/<slug>.png`.

## Quality bar
- Visual fidelity: matches DESIGN.md §<X> within reasonable interpretation.
- Performance: 60 fps on M-series Mac, no Three.js dispose warnings after 5 mount/unmount cycles.
- TypeScript: strict, no `any`.
- Browser-verified: target agent confirms with screenshot before declaring delivered.

## Deadline / sprint
Sprint <id> in `plans/phase-<N>-*.md`.

---

## Result (filled in by target agent on delivery)

- **Delivered at:** YYYY-MM-DD HH:MM
- **Files committed:**
  - `path/to/file1.tsx`
  - `path/to/file2.glsl`
- **Screenshots:**
  - ![mid-state](mid.png)
  - ![final-state](final.png)
- **Notes / deviations from spec:**
- **Verification (filled in by source agent):** Verified ✅ | Reverted ❌
```

## Index of handoffs

*(Update this list when a new handoff is created.)*

| Date | Tag | Source → Target | Status |
|---|---|---|---|
| — | (none yet) | — | — |
