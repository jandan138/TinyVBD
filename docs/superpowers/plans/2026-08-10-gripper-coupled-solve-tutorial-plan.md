# 2026-08-10 Gripper Coupled-Solve Tutorial Plan (executed)

## Goal
Land Part 15–16 in TinyVBD per design `2026-08-10-gripper-coupled-solve-tutorial-design.md`.

## Done
- `_GRIPPER_BRIEF.md` FACTS + style lock
- Widgets: `gripper-core`, `sequential-overwrite`, `contract-ladder`, `impulse-balance-board`, `bounded-drive-curve`, `gripper-lab`
- Headless test: `_tests/gripper-core.test.js`
- `content.js` parts `p15`/`p16`; `_SCRIPT_BLOCK.html` / `_template.html` script list
- 14 chapter HTML files under `chapters/15-gripper-why-fail/` and `chapters/16-coupled-impulse-lab/`

## Verify
```bash
node learn/_tests/gripper-core.test.js
```

## Out of scope (by design)
Eval OS / pi0.5 / cohort CLI / true Isaac-Newton numerical parity.
