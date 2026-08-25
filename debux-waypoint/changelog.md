# Changelog

## 1.0.0

First DebuX release.

- Rebuilt turn detection — a straight road no longer produces false turn calls. Corners are measured
  over a long baseline, have to hold their new bearing well past the corner, and have to survive
  several updates and a route rebuild before they reach the HUD or the voice. Tunable under
  `Config.Turns`.
- Road markers are re-projected onto the road surface before they are drawn, so they sit flat at
  junctions, on turns and over crests instead of floating or sinking. Bridge and tunnel probes are
  rejected rather than followed. Tunable under `Config.Chevrons`.
- DebuX purple interface.
