'use strict';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const W = 800;
const H = 600;

// ── Input ─────────────────────────────────────────────────────────────────────
const keys = {};
const justPressed = {};

window.addEventListener('keydown', e => {
  justPressed[e.code] = !keys[e.code];
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code))
    e.preventDefault();
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

function pressed(code) {
  const val = justPressed[code];
  justPressed[code] = false;
  return val;
}

// ── Utils ─────────────────────────────────────────────────────────────────────
const wrap  = (v, max) => ((v % max) + max) % max;
const dist  = (a, b)   => Math.hypot(a.x - b.x, a.y - b.y);
const rand  = (min, max) => min + Math.random() * (max - min);
const randInt = (min, max) => Math.floor(rand(min, max + 1));

const POWERUP_RGB        = '95,255,255';
const SHIELD_RGB         = '130,200,255';
const SPEED_DROP_CHANCE  = 0.12;
const SHIELD_DROP_CHANCE = 0.12;
const MAX_POWERUPS       = 2;
const SHIELD_DURATION    = 6;

const TRIPLE_RGB         = '255,120,255';
const TRIPLE_DROP_CHANCE = 0.12;
const TRIPLE_DURATION    = 5;
const TRIPLE_SPREAD      = 0.18;  // rad a cada lado del disparo central

const SHOOTING_STAR_CHANCE = 0.35;
const SHOOTING_STAR_SPEED  = 3;
const SHOOTING_STAR_TTL    = 5;
const SHOOTING_STAR_RGB    = '255,190,80';

// ── Bullet ────────────────────────────────────────────────────────────────────
class Bullet {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    const SPEED = 520;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl  = 1.1;
    this.radius = 2;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ── Asteroid ──────────────────────────────────────────────────────────────────
const RADII  = [0, 16, 30, 50];   // por tamaño 1, 2, 3
const SPEEDS = [0, 85, 55, 32];   // velocidad base por tamaño
const POINTS = [0, 100, 50, 20];  // puntos por tamaño

class Asteroid {
  constructor(x, y, size = 3) {
    this.x    = x;
    this.y    = y;
    this.size = size;
    this.radius = RADII[size];
    this.points = POINTS[size];
    this.rgb = '255,255,255';
    this.dead = false;

    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);

    // Polígono irregular
    const n = randInt(8, 13);
    this.verts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt) {
    this.x   = wrap(this.x + this.vx * dt, W);
    this.y   = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estrella fugaz ───────────────────────────────────────────────────────────
class ShootingStar extends Asteroid {
  constructor(x, y) {
    super(x, y, 2);
    this.vx *= SHOOTING_STAR_SPEED;
    this.vy *= SHOOTING_STAR_SPEED;
    this.ttl = SHOOTING_STAR_TTL;
    this.points = POINTS[this.size] * 2;
    this.rgb = SHOOTING_STAR_RGB;
  }

  update(dt) {
    super.update(dt);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  split() {
    return [];
  }

  draw() {
    const alpha = Math.min(this.ttl, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);

    // Estela en dirección opuesta al movimiento
    const tail = 0.25;
    const tx = -this.vx * tail;
    const ty = -this.vy * tail;
    const grad = ctx.createLinearGradient(0, 0, tx, ty);
    grad.addColorStop(0, `rgba(${SHOOTING_STAR_RGB},0.8)`);
    grad.addColorStop(1, `rgba(${SHOOTING_STAR_RGB},0)`);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tx, ty);
    ctx.stroke();

    ctx.rotate(this.rot);
    ctx.strokeStyle = `rgb(${SHOOTING_STAR_RGB})`;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

// ── Ship ──────────────────────────────────────────────────────────────────────
class Ship {
  constructor() { this.reset(); }

  reset() {
    this.x      = W / 2;
    this.y      = H / 2;
    this.angle  = -Math.PI / 2;
    this.vx     = 0;
    this.vy     = 0;
    this.radius = 12;
    this.thrusting     = false;
    this.invincible    = 3;
    this.shootCooldown = 0;
    this.speedBoost    = 0;
    this.tripleShot    = 0;
    this.shield        = 0;
    this.dead          = false;
  }

  update(dt) {
    if (this.dead) return;
    if (this.invincible    > 0) this.invincible    -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot    > 0) this.tripleShot = Math.max(0, this.tripleShot - dt);

    const boost = this.speedBoost > 0 ? 2 : 1;
    if (this.speedBoost > 0) this.speedBoost = Math.max(0, this.speedBoost - dt);
    if (this.shield     > 0) this.shield     = Math.max(0, this.shield - dt);

    const ROT   = 3.5;   // rad/s
    const THRUST = 260;  // px/s²
    const DRAG   = 0.987;

    if (keys['ArrowLeft'])  this.angle -= ROT * dt;
    if (keys['ArrowRight']) this.angle += ROT * dt;

    this.thrusting = !!keys['ArrowUp'];
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt * boost, W);
    this.y = wrap(this.y + this.vy * dt * boost, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [-TRIPLE_SPREAD, 0, TRIPLE_SPREAD].map(offset =>
        new Bullet(ox, oy, this.angle + offset));
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw() {
    if (this.dead) return;

    if (this.speedBoost > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(${POWERUP_RGB},0.65)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.tripleShot > 0) {
      ctx.save();
      ctx.strokeStyle = `rgba(${TRIPLE_RGB},0.65)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + (this.speedBoost > 0 ? 12 : 7), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    if (this.shield > 0) {
      const alpha = Math.min(1, this.shield / 1.5);
      ctx.save();
      ctx.strokeStyle = `rgba(${SHIELD_RGB},${alpha.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + (this.tripleShot > 0 ? 18 : 10), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Parpadeo durante invencibilidad de reaparición
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth   = 1.5;
    ctx.lineJoin    = 'round';

    // Silueta clásica: triángulo con muesca trasera
    ctx.beginPath();
    ctx.moveTo( 20,  0);   // nariz
    ctx.lineTo(-12, -9);   // ala izquierda
    ctx.lineTo( -7,  0);   // muesca trasera
    ctx.lineTo(-12,  9);   // ala derecha
    ctx.closePath();
    ctx.stroke();

    // Llama del propulsor
    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8,  4);
      ctx.strokeStyle = 'rgba(255, 130, 0, 0.85)';
      ctx.stroke();
    }

    ctx.restore();
  }
}

// ── Partículas (explosión) ────────────────────────────────────────────────────
class Particle {
  constructor(x, y, rgb = '255,255,255') {
    this.x  = x;
    this.y  = y;
    this.rgb = rgb;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx   = Math.cos(angle) * speed;
    this.vy   = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl  = this.life;
    this.dead = false;
  }

  update(dt) {
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = this.ttl / this.life;
    ctx.strokeStyle = `rgba(${this.rgb},${alpha.toFixed(2)})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
  }
}

// ── Power-ups: Velocidad, Triple disparo y Escudo ─────────────────────────────
class PowerUp {
  constructor(x, y, kind = 'speed') {
    this.x = x;
    this.y = y;
    this.kind = kind;
    this.rgb = kind === 'triple' ? TRIPLE_RGB : kind === 'shield' ? SHIELD_RGB : POWERUP_RGB;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(35, 65);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.radius = 13;
    this.ttl = 10;
    this.dead = false;
  }

  update(dt) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw() {
    const alpha = Math.min(this.ttl, 1);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.strokeStyle = `rgba(${this.rgb},${alpha.toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    if (this.kind === 'triple') {
      // Tres trayectorias divergentes desde un mismo origen
      ctx.moveTo(0, 6); ctx.lineTo(-6, -6);
      ctx.moveTo(0, 6); ctx.lineTo( 0, -8);
      ctx.moveTo(0, 6); ctx.lineTo( 6, -6);
    } else if (this.kind === 'shield') {
      // Silueta de escudo
      ctx.moveTo(-6, -4); ctx.lineTo(0, -8); ctx.lineTo(6, -4);
      ctx.lineTo(6, 2);   ctx.lineTo(0, 9);  ctx.lineTo(-6, 2);
      ctx.closePath();
    } else {
      ctx.moveTo(-6, -5); ctx.lineTo(0, 0); ctx.lineTo(-6, 5);
      ctx.moveTo( 1, -5); ctx.lineTo(7, 0); ctx.lineTo( 1, 5);
    }
    ctx.stroke();
    ctx.restore();
  }
}

// ── Estado del juego ──────────────────────────────────────────────────────────
let ship, bullets, asteroids, particles, powerups;
let score, lives, level;
let state;      // 'playing' | 'dead' | 'gameover'
let deadTimer;

function maybeSpawnPowerUp(x, y) {
  if (powerups.length >= MAX_POWERUPS) return;
  const roll = Math.random();
  if (roll < SPEED_DROP_CHANCE) {
    powerups.push(new PowerUp(x, y, 'speed'));
  } else if (roll < SPEED_DROP_CHANCE + SHIELD_DROP_CHANCE) {
    powerups.push(new PowerUp(x, y, 'shield'));
  } else if (roll < SPEED_DROP_CHANCE + SHIELD_DROP_CHANCE + TRIPLE_DROP_CHANCE) {
    powerups.push(new PowerUp(x, y, 'triple'));
  }
}

function spawnAsteroids(count) {
  const SAFE_DIST = 130;
  // Como máximo una estrella fugaz por oleada
  const starIndex = Math.random() < SHOOTING_STAR_CHANCE ? randInt(0, count - 1) : -1;
  for (let i = 0; i < count; i++) {
    let x, y;
    do {
      x = rand(0, W);
      y = rand(0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
    asteroids.push(i === starIndex ? new ShootingStar(x, y) : new Asteroid(x, y, 3));
  }
}

function initGame() {
  ship          = new Ship();
  bullets   = [];
  asteroids = [];
  particles = [];
  powerups  = [];
  score  = 0;
  lives  = 3;
  level  = 1;
  state  = 'playing';
  spawnAsteroids(4);
}

function nextLevel() {
  level++;
  bullets   = [];
  particles = [];
  powerups  = [];
  ship.reset();
  spawnAsteroids(3 + level);
}

function explode(x, y, count = 8, rgb = '255,255,255') {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, rgb));
}

function killShip() {
  explode(ship.x, ship.y, 14);
  ship.dead = true;
  lives--;
  if (lives <= 0) {
    state = 'gameover';
  } else {
    state     = 'dead';
    deadTimer = 2;
  }
}

// ── Update ────────────────────────────────────────────────────────────────────
function update(dt) {
  if (state === 'gameover') {
    if (pressed('Space')) initGame();
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    return;
  }

  if (state === 'dead') {
    deadTimer -= dt;
    particles.forEach(p => p.update(dt));
    particles = particles.filter(p => !p.dead);
    asteroids.forEach(a => a.update(dt));
    asteroids = asteroids.filter(a => !a.dead);
    powerups.forEach(p => p.update(dt));
    powerups = powerups.filter(p => !p.dead);
    if (deadTimer <= 0) { state = 'playing'; ship.reset(); }
    return;
  }

  // Disparar
  if (pressed('Space')) {
    bullets.push(...ship.tryShoot());
  }

  ship.update(dt);
  bullets.forEach(b => b.update(dt));
  asteroids.forEach(a => a.update(dt));
  particles.forEach(p => p.update(dt));
  powerups.forEach(p => p.update(dt));

  asteroids = asteroids.filter(a => !a.dead);
  bullets   = bullets.filter(b => !b.dead);
  particles = particles.filter(p => !p.dead);

  // Bala vs asteroide
  const newAsteroids = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!a.dead && !b.dead && dist(b, a) < a.radius) {
        b.dead = true;
        a.dead = true;
        score += a.points;
        explode(a.x, a.y, a.size * 5, a.rgb);
        maybeSpawnPowerUp(a.x, a.y);
        newAsteroids.push(...a.split());
      }
    }
  }
  asteroids = asteroids.filter(a => !a.dead).concat(newAsteroids);
  bullets   = bullets.filter(b => !b.dead);

  // Power-up vs nave
  for (const p of powerups) {
    if (!p.dead && dist(ship, p) < ship.radius + p.radius) {
      p.dead = true;
      if (p.kind === 'triple') {
        ship.tripleShot = TRIPLE_DURATION;
      } else if (p.kind === 'shield') {
        ship.shield = SHIELD_DURATION;
      } else {
        ship.speedBoost = 5;
      }
      explode(p.x, p.y, 8, p.rgb);
    }
  }
  powerups = powerups.filter(p => !p.dead);

  // Nave vs asteroide
  if (ship.invincible <= 0) {
    for (const a of asteroids) {
      if (a.dead || dist(ship, a) >= ship.radius + a.radius * 0.82) continue;

      if (ship.shield > 0) {
        // El escudo absorbe el golpe: el asteroide rebota y sigue en juego
        const dx = a.x - ship.x;
        const dy = a.y - ship.y;
        const len = Math.hypot(dx, dy) || 1;
        const separation = ship.radius + a.radius * 0.82 + 2;
        a.vx *= -1;
        a.vy *= -1;
        a.x = wrap(ship.x + (dx / len) * separation, W);
        a.y = wrap(ship.y + (dy / len) * separation, H);
        ship.shield = 0;
        explode(a.x, a.y, 10, SHIELD_RGB);
      } else {
        killShip();
      }
      break;
    }
  }

  // Nivel completado
  if (asteroids.length === 0) nextLevel();
}

// ── Draw ──────────────────────────────────────────────────────────────────────
function drawLifeIcon(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 1.2;
  ctx.lineJoin    = 'round';
  ctx.beginPath();
  ctx.moveTo( 9,  0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3,  0);
  ctx.lineTo(-6,  5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawHUD() {
  ctx.fillStyle = '#fff';
  ctx.font = '15px monospace';

  ctx.textAlign = 'left';
  ctx.fillText(`SCORE  ${score}`, 14, 26);
  if (ship.speedBoost > 0) {
    ctx.fillStyle = `rgb(${POWERUP_RGB})`;
    ctx.fillText(`VELOCIDAD x2  ${ship.speedBoost.toFixed(1)}s`, 14, 44);
    ctx.fillStyle = '#fff';
  }
  if (ship.shield > 0) {
    ctx.fillStyle = `rgb(${SHIELD_RGB})`;
    ctx.fillText(`ESCUDO  ${ship.shield.toFixed(1)}s`, 14, 62);
    ctx.fillStyle = '#fff';
  }
  if (ship.tripleShot > 0) {
    ctx.fillStyle = `rgb(${TRIPLE_RGB})`;
    ctx.fillText(`TRIPLE x3  ${ship.tripleShot.toFixed(1)}s`, 14, 80);
    ctx.fillStyle = '#fff';
  }

  ctx.textAlign = 'center';
  ctx.fillText(`NIVEL ${level}`, W / 2, 26);

  for (let i = 0; i < lives; i++)
    drawLifeIcon(W - 16 - i * 22, 18);

}

function drawOverlay(title, sub) {
  ctx.textAlign   = 'center';
  ctx.fillStyle   = '#fff';
  ctx.font        = 'bold 46px monospace';
  ctx.fillText(title, W / 2, H / 2 - 18);
  ctx.font        = '18px monospace';
  ctx.fillStyle   = 'rgba(255,255,255,0.65)';
  ctx.fillText(sub, W / 2, H / 2 + 22);
}

function draw() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, W, H);

  particles.forEach(p => p.draw());
  asteroids.forEach(a => a.draw());
  powerups.forEach(p => p.draw());
  bullets.forEach(b => b.draw());
  ship.draw();

  drawHUD();

  if (state === 'gameover')
    drawOverlay('GAME OVER', `PUNTAJE: ${score}   —   ESPACIO PARA REINICIAR`);
}

// ── Loop principal ────────────────────────────────────────────────────────────
let lastTime = null;

function loop(ts) {
  const dt = lastTime === null ? 0 : Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

initGame();
requestAnimationFrame(loop);
