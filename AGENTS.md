# AGENTS.md

## Project shape

- Static, dependency-free canvas game: `index.html` loads `game.js` as a classic script. There is no `package.json`, bundler, module import, test, lint, or CI setup. Verify changes manually in a browser (`npx serve .` then http://localhost:3000, or open `index.html` directly).
- `index.html` provides the only DOM the game needs: `<canvas id="canvas" width="800" height="600">`. `game.js` hardcodes `W = 800`, `H = 600` and looks up that id at top level; keep the id, canvas dimensions, and constants in sync.
- `game.js` is a single top-level script with globals (`canvas`, `ctx`, `keys`, `state`, entity arrays). Gameplay, HUD, input handling, and the `requestAnimationFrame` loop all live there.

## Gotchas

- Input is read via `KeyboardEvent.code` (`Space`, `ArrowLeft`/`ArrowRight`/`ArrowUp`), not `.key`; those keys are `preventDefault()`ed. `pressed(code)` consumes one-shot `justPressed`, so call it once per frame per action.
- `state` is exactly `'playing' | 'dead' | 'gameover'`, and `Space` restarts only from `gameover`. `ship.reset()` (start, respawn, next level) sets `invincible = 3`; the blinking during that time is draw-only.
- Ship, bullets, and asteroids wrap via `wrap()`; particles do not. `dt` is capped at 0.05s, but ship drag (`DRAG = 0.987`) is applied once per frame, not scaled by `dt`.
- Asteroid `size` runs 3 → 2 → 1; `POINTS` is indexed by that size (20/50/100), so the largest asteroid is index 3, not 0.
- UI strings and code comments are Spanish (`NIVEL`, `PUNTAJE`, `ESPACIO PARA REINICIAR`); keep that convention when adding user-visible text.
- Power-up "Velocidad": drops from destroyed asteroids (~12%, max 2 active), is cyan, and sets `ship.speedBoost = 5` on pickup. The multiplier doubles only the position delta in `Ship.update`; `ROT`, `THRUST`, and `DRAG` are unchanged. `explode()`/`Particle` accept an optional `rgb`, defaulting to white.
- HUD shows `VELOCIDAD x2 ...s`; the ship aura is drawn before the invincibility blink early return in `Ship.draw()`.
- README still mentions an unimplemented "estrella fugaz" asteroid. Treat the code as the source of truth.
