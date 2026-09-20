"use strict";

const PEOPLE = {
  C: {
    age: "Teenager",
    accent: "#aa78ef",
    art: { flight: "assets/forms/c-flight.webp", chaos: "assets/forms/c-chaos.webp" },
    flight: { animal: "Flamingo", ability: "Stilt vault", description: "Balance, wade, and vault with unnecessary elegance." },
    chaos: { animal: "Red fox", ability: "Burrow dash", description: "Dig shortcuts and outfox objects with no brain." }
  },
  A: {
    age: "Adult",
    accent: "#d84c59",
    art: { flight: "assets/forms/a-flight.webp", chaos: "assets/forms/a-chaos.webp" },
    flight: { animal: "Cassowary", ability: "Airborne violence", description: "Technically flight. Legally an incident." },
    chaos: { animal: "Giant black snake", ability: "Constrict", description: "Crush barriers and move with terrifying purpose." }
  },
  S: {
    age: "Adult",
    accent: "#28c1b5",
    art: { flight: "assets/forms/s-flight.webp", chaos: "assets/forms/s-chaos.webp" },
    flight: { animal: "Crow", ability: "Bright idea", description: "Glide, scout, and attract useful shiny things." },
    chaos: { animal: "Cheetah", ability: "Fast brain", description: "Move so quickly the rest of reality needs a minute." }
  },
  E: {
    age: "Preteen",
    accent: "#f0bd45",
    art: { flight: "assets/forms/e-flight.webp", chaos: "assets/forms/e-chaos.webp" },
    flight: { animal: "Great horned owl", ability: "Night sight", description: "Reveal secrets and move without announcing it." },
    chaos: { animal: "Raccoon", ability: "Rummage", description: "Open containers and convert garbage into progress." }
  }
};

const order = ["C", "A", "S", "E"];
const images = {};
let selectedMode = "flight";

const roster = document.querySelector("#roster");
const dock = document.querySelector("#character-dock");

function personCard(id) {
  const p = PEOPLE[id];
  return `<article class="character-card" data-id="${id}" style="--flight-image:url('${p.art.flight}');--chaos-image:url('${p.art.chaos}')">
    <div class="card-top"><span class="card-initial">${id}</span><span class="card-age">${p.age}</span></div>
    <div class="form-art" role="img" aria-label="${p.flight.animal} and ${p.chaos.animal} forms"></div>
    <div class="card-copy"><p>${p.flight.ability}</p><h2>${p.flight.animal}</h2><small>${p.flight.description}</small></div>
  </article>`;
}

roster.innerHTML = order.map(personCard).join("");

function updateRoster(mode) {
  selectedMode = mode;
  document.querySelectorAll(".form-choice").forEach(button => button.classList.toggle("selected", button.dataset.mode === mode));
  document.querySelectorAll(".character-card").forEach(card => {
    const p = PEOPLE[card.dataset.id];
    const form = p[mode];
    card.classList.toggle("chaos", mode === "chaos");
    card.querySelector(".card-copy p").textContent = form.ability;
    card.querySelector(".card-copy h2").textContent = form.animal;
    card.querySelector(".card-copy small").textContent = form.description;
  });
}

document.querySelectorAll(".form-choice").forEach(button => button.addEventListener("click", () => updateRoster(button.dataset.mode)));

for (const [id, p] of Object.entries(PEOPLE)) {
  images[id] = {};
  for (const mode of ["flight", "chaos"]) {
    const img = new Image();
    img.src = p.art[mode];
    images[id][mode] = img;
  }
}

const canvas = document.querySelector("#game-canvas");
const ctx = canvas.getContext("2d");
const toast = document.querySelector("#toast");
const finishCard = document.querySelector("#finish-card");

const state = {
  running: false,
  current: "C",
  mode: "flight",
  x: 120,
  y: 540,
  vx: 0,
  vy: 0,
  grounded: false,
  facing: 1,
  camera: 0,
  sparks: new Set(),
  smashed: new Set(),
  reveal: 0,
  ability: 0,
  elapsed: 0,
  finished: false,
  level: "space",
  spaceSparks: new Set(),
  motionPhase: 0,
  transformFlash: 0,
  landing: 0,
  trail: [],
  trailClock: 0
};

const keys = { left: false, right: false, jump: false };
const BACKYARD_WIDTH = 4100;
const SPACE_WIDTH = 3000;
const GROUND = 650;
const platforms = [
  { x: 0, y: GROUND, w: BACKYARD_WIDTH, h: 180 },
  { x: 420, y: 550, w: 250, h: 28 },
  { x: 930, y: 500, w: 230, h: 28 },
  { x: 1290, y: 565, w: 270, h: 28 },
  { x: 1740, y: 465, w: 250, h: 28 },
  { x: 2170, y: 540, w: 300, h: 28 },
  { x: 2700, y: 460, w: 260, h: 28 },
  { x: 3140, y: 535, w: 280, h: 28 },
  { x: 3570, y: 440, w: 300, h: 28 }
];
const sparkData = [
  { id: "C", x: 550, y: 485, color: PEOPLE.C.accent },
  { id: "A", x: 1400, y: 500, color: PEOPLE.A.accent },
  { id: "S", x: 2290, y: 475, color: PEOPLE.S.accent },
  { id: "E", x: 2820, y: 385, color: PEOPLE.E.accent }
];
const cosmicSparkData = [
  { id: "C", x: 520, y: 275, color: PEOPLE.C.accent },
  { id: "A", x: 1120, y: 530, color: PEOPLE.A.accent },
  { id: "S", x: 1780, y: 235, color: PEOPLE.S.accent },
  { id: "E", x: 2350, y: 500, color: PEOPLE.E.accent }
];
const crates = [
  { id: 1, x: 770, y: 560, w: 80, h: 90 },
  { id: 2, x: 2030, y: 570, w: 80, h: 80 },
  { id: 3, x: 3035, y: 565, w: 75, h: 85 }
];

function resetGame() {
  Object.assign(state, { running: true, current: "C", mode: selectedMode, x: 120, y: 400, vx: 0, vy: 0, grounded: false, facing: 1, camera: 0, reveal: 0, ability: 0, elapsed: 0, finished: false, level: "space", motionPhase: 0, transformFlash: 0, landing: 0, trail: [], trailClock: 0 });
  state.sparks.clear();
  state.spaceSparks.clear();
  state.smashed.clear();
  finishCard.hidden = true;
  updateHud();
}

function startGame() {
  document.querySelector("#home").classList.remove("active");
  document.querySelector("#game").classList.add("active");
  resetGame();
  requestAnimationFrame(loop);
}

document.querySelector("#start-button").addEventListener("click", startGame);
document.querySelector("#replay-button").addEventListener("click", resetGame);
document.querySelector("#home-button").addEventListener("click", () => {
  state.running = false;
  document.querySelector("#game").classList.remove("active");
  document.querySelector("#home").classList.add("active");
});

function buildDock() {
  dock.innerHTML = order.map(id => `<button class="dock-character" data-id="${id}" type="button"><b>${id}</b><span><strong>${PEOPLE[id][state.mode].animal}</strong><small>${PEOPLE[id][state.mode].ability}</small></span></button>`).join("");
  dock.querySelectorAll("button").forEach(button => button.addEventListener("click", () => switchCharacter(button.dataset.id)));
}

function switchCharacter(id) {
  if (!PEOPLE[id]) return;
  state.current = id;
  state.ability = 0;
  state.transformFlash = .28;
  state.trail = [];
  updateHud();
  say(`${id}: ${PEOPLE[id][state.mode].animal}`);
}

function transform() {
  state.mode = state.mode === "flight" ? "chaos" : "flight";
  state.ability = 0;
  state.transformFlash = .38;
  state.trail = [];
  updateHud();
  say(`${PEOPLE[state.current][state.mode].animal} form!`);
}

function updateHud() {
  const p = PEOPLE[state.current];
  const f = p[state.mode];
  const initial = document.querySelector("#active-initial");
  initial.textContent = state.current;
  initial.style.background = p.accent;
  document.querySelector("#active-animal").textContent = f.animal;
  document.querySelector("#active-form").textContent = `${state.mode === "flight" ? "Flight" : "Chaos"} form · ${f.ability}`;
  const count = state.level === "space" ? state.spaceSparks.size : state.sparks.size;
  document.querySelector("#case-count").textContent = `${count} / 4`;
  document.querySelector("#objective-label").textContent = state.level === "space" ? "cosmic sparks" : "CASE sparks";
  buildDock();
  dock.querySelectorAll("button").forEach(button => button.classList.toggle("selected", button.dataset.id === state.current));
}

let toastTimer;
function say(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1250);
}

function useAbility() {
  const id = state.current;
  state.ability = .65;
  if (state.mode === "flight") {
    if (id === "C") state.vy = -17;
    if (id === "A") { state.vx = state.facing * 19; smashNearby(150); }
    if (id === "S") { state.vy = Math.min(state.vy, -4); state.vx += state.facing * 7; }
    if (id === "E") state.reveal = 4;
  } else {
    if (id === "C") { state.vx = state.facing * 16; revealNearby(); }
    if (id === "A") smashNearby(180);
    if (id === "S") state.vx = state.facing * 22;
    if (id === "E") revealNearby(true);
  }
  say(PEOPLE[id][state.mode].ability);
}

function smashNearby(range) {
  crates.forEach(crate => {
    if (!state.smashed.has(crate.id) && Math.abs((crate.x + crate.w / 2) - state.x) < range) state.smashed.add(crate.id);
  });
}

function revealNearby(rummage = false) {
  const hidden = sparkData.find(s => !state.sparks.has(s.id) && Math.abs(s.x - state.x) < (rummage ? 500 : 320));
  if (hidden) {
    hidden.revealed = true;
    say(rummage ? "Garbage has yielded treasure." : "Something is buried nearby.");
  }
}

function jump() {
  if (state.level === "space") {
    state.vy = Math.max(-9, state.vy - 4.5);
    return;
  }
  if (state.grounded) {
    const bonus = state.current === "C" && state.mode === "flight" ? 4 : 0;
    state.vy = -13.5 - bonus;
    state.grounded = false;
  } else if (state.mode === "flight" && state.current !== "A" && state.vy > -3) {
    state.vy = -7;
  }
}

window.addEventListener("keydown", event => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(event.key)) event.preventDefault();
  if (event.repeat && ["e", "E", "f", "F", "Shift"].includes(event.key)) return;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = true;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = true;
  if (event.key === "ArrowUp" || event.key === " " || event.key.toLowerCase() === "w") jump();
  if (event.key.toLowerCase() === "e") useAbility();
  if (event.key.toLowerCase() === "f" || event.key === "Shift") transform();
  if (order.includes(event.key.toUpperCase())) switchCharacter(event.key.toUpperCase());
  if (["1", "2", "3", "4"].includes(event.key)) switchCharacter(order[Number(event.key) - 1]);
});
window.addEventListener("keyup", event => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = false;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = false;
});

document.querySelectorAll("[data-control]").forEach(button => {
  const control = button.dataset.control;
  const down = event => {
    event.preventDefault();
    if (control === "left" || control === "right") keys[control] = true;
    if (control === "jump") jump();
    if (control === "ability") useAbility();
    if (control === "transform") transform();
  };
  const up = event => { event.preventDefault(); if (control === "left" || control === "right") keys[control] = false; };
  button.addEventListener("pointerdown", down);
  button.addEventListener("pointerup", up);
  button.addEventListener("pointercancel", up);
  button.addEventListener("pointerleave", up);
});

function collides(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(dt) {
  if (!state.running || state.finished) return;
  state.elapsed += dt;
  state.motionPhase += dt * (2.4 + Math.abs(state.vx) * 1.15);
  state.ability = Math.max(0, state.ability - dt);
  state.reveal = Math.max(0, state.reveal - dt);
  state.transformFlash = Math.max(0, state.transformFlash - dt);
  state.landing = Math.max(0, state.landing - dt);
  state.trailClock -= dt;

  let speed = state.level === "space" ? 6.2 : 7.1;
  if (state.mode === "chaos" && state.current === "S") speed = 9.5;
  if (state.mode === "chaos" && state.current === "A") speed = 5.6;
  if (keys.left) { state.vx -= 1.25; state.facing = -1; }
  if (keys.right) { state.vx += 1.25; state.facing = 1; }
  if (!keys.left && !keys.right) state.vx *= .8;
  state.vx = Math.max(-speed, Math.min(speed, state.vx));
  if (state.level === "space") {
    state.vy += (410 - state.y) * .0018;
    state.vy *= .992;
  } else {
    state.vy += state.mode === "flight" && state.current !== "A" && keys.jump ? .35 : .72;
    state.vy = Math.min(state.vy, 18);
  }

  const previousY = state.y;
  state.x += state.vx;
  const worldWidth = state.level === "space" ? SPACE_WIDTH : BACKYARD_WIDTH;
  state.x = Math.max(30, Math.min(worldWidth - 80, state.x));
  state.y += state.vy;
  const wasGrounded = state.grounded;
  state.grounded = false;

  if (state.level === "space") {
    if (state.y < 120) { state.y = 120; state.vy = Math.abs(state.vy) * .6; }
    if (state.y > 690) { state.y = 690; state.vy = -Math.abs(state.vy) * .6; }
    cosmicSparkData.forEach(spark => {
      if (!state.spaceSparks.has(spark.id) && Math.hypot(state.x - spark.x, (state.y - 35) - spark.y) < 85) {
        state.spaceSparks.add(spark.id);
        say(`${spark.id} cosmic spark recovered!`);
        updateHud();
      }
    });
    if (state.x > 2720) {
      if (state.spaceSparks.size === 4) enterBackyard();
      else if (!state.endWarned) {
        state.endWarned = true;
        say("The wormhole demands all four sparks. Naturally.");
        setTimeout(() => state.endWarned = false, 1800);
      }
    }
    const targetCamera = Math.max(0, Math.min(SPACE_WIDTH - canvas.width, state.x - canvas.width * .38));
    state.camera += (targetCamera - state.camera) * .09;
    updateMotionTrail(dt);
    return;
  }

  const body = { x: state.x - 34, y: state.y - 60, w: 68, h: 60 };
  platforms.forEach(platform => {
    if (state.vy >= 0 && previousY <= platform.y + 4 && collides(body, platform)) {
      state.y = platform.y;
      state.vy = 0;
      state.grounded = true;
    }
  });

  if (!wasGrounded && state.grounded) state.landing = .18;

  crates.forEach(crate => {
    if (state.smashed.has(crate.id)) return;
    if (collides(body, crate)) {
      if (Math.abs(state.vx) > 12 || (state.ability > 0 && state.current === "A")) {
        state.smashed.add(crate.id);
      } else {
        state.x -= state.vx;
        state.vx = 0;
      }
    }
  });

  sparkData.forEach(spark => {
    if (!state.sparks.has(spark.id) && Math.hypot(state.x - spark.x, (state.y - 35) - spark.y) < 72) {
      state.sparks.add(spark.id);
      say(`${spark.id} spark recovered!`);
      updateHud();
    }
  });

  if (state.x > 3860) {
    if (state.sparks.size === 4) {
      state.finished = true;
      finishCard.hidden = false;
    } else if (!state.endWarned) {
      state.endWarned = true;
      say("The picnic demands all four CASE sparks.");
      setTimeout(() => state.endWarned = false, 1800);
    }
  }

  const targetCamera = Math.max(0, Math.min(BACKYARD_WIDTH - canvas.width, state.x - canvas.width * .38));
  state.camera += (targetCamera - state.camera) * .09;
  updateMotionTrail(dt);
}

function updateMotionTrail() {
  const fast = Math.abs(state.vx) > 8 || state.ability > .05;
  if (fast && state.trailClock <= 0) {
    state.trail.unshift({ x: state.x, y: state.y, facing: state.facing, life: .24, phase: state.motionPhase });
    state.trail = state.trail.slice(0, 4);
    state.trailClock = .045;
  }
  state.trail.forEach(item => item.life -= .016);
  state.trail = state.trail.filter(item => item.life > 0);
}

function enterBackyard() {
  state.level = "backyard";
  state.x = 120;
  state.y = 380;
  state.vx = 0;
  state.vy = 2;
  state.camera = 0;
  state.elapsed = 0;
  updateHud();
  say("Gravity found. Regrettably.");
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawBackground() {
  if (state.level === "space") {
    drawSpaceBackground();
    return;
  }
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#77b7bd");
  gradient.addColorStop(.55, "#d7d2a8");
  gradient.addColorStop(1, "#556d45");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,239,174,.85)";
  ctx.beginPath(); ctx.arc(1190, 135, 64, 0, Math.PI * 2); ctx.fill();

  const farShift = state.camera * .14;
  ctx.fillStyle = "#6e8f77";
  for (let i = -1; i < 9; i++) {
    const x = i * 250 - (farShift % 250);
    ctx.beginPath();
    ctx.moveTo(x - 120, 600); ctx.quadraticCurveTo(x, 300 + (i % 2) * 50, x + 120, 600); ctx.fill();
  }

  const fenceShift = state.camera * .35;
  ctx.fillStyle = "#d8bf8f";
  for (let i = -1; i < 18; i++) {
    const x = i * 105 - (fenceShift % 105);
    ctx.fillRect(x, 510, 78, 190);
    ctx.beginPath(); ctx.moveTo(x, 510); ctx.lineTo(x + 39, 470); ctx.lineTo(x + 78, 510); ctx.fill();
  }
  ctx.fillStyle = "#af956b";
  ctx.fillRect(0, 555, canvas.width, 18);
}

function drawSpaceBackground() {
  const gradient = ctx.createRadialGradient(canvas.width * .6, canvas.height * .45, 10, canvas.width * .5, canvas.height * .5, canvas.width);
  gradient.addColorStop(0, "#25376d");
  gradient.addColorStop(.45, "#11183e");
  gradient.addColorStop(1, "#040611");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 145; i++) {
    const depth = 1 + (i % 3);
    const x = ((i * 173 - state.camera * (.03 * depth)) % (canvas.width + 80) + canvas.width + 80) % (canvas.width + 80) - 40;
    const y = (i * 97 + (i % 7) * 31) % canvas.height;
    const pulse = .55 + Math.sin(state.elapsed * (1 + i % 4) + i) * .35;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = i % 13 === 0 ? "#a9d9ff" : "#fff";
    ctx.beginPath(); ctx.arc(x, y, i % 11 === 0 ? 2.3 : 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(111,73,176,.18)";
  ctx.beginPath(); ctx.ellipse(1050, 250, 430, 105, -.18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(43,186,193,.12)";
  ctx.beginPath(); ctx.ellipse(300, 620, 520, 90, .12, 0, Math.PI * 2); ctx.fill();
}

function drawWorld() {
  if (state.level === "space") {
    drawSpaceWorld();
    return;
  }
  ctx.save();
  ctx.translate(-state.camera, 0);

  ctx.fillStyle = "#66814b";
  ctx.fillRect(0, GROUND, BACKYARD_WIDTH, 180);
  ctx.fillStyle = "#78985c";
  ctx.fillRect(0, GROUND, BACKYARD_WIDTH, 16);
  for (let x = 0; x < BACKYARD_WIDTH; x += 44) {
    ctx.strokeStyle = x % 88 ? "#8cab68" : "#53733d";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, GROUND + 3); ctx.quadraticCurveTo(x + 7, GROUND - 14, x + 13, GROUND - 2); ctx.stroke();
  }

  platforms.slice(1).forEach((p, index) => {
    ctx.fillStyle = index % 2 ? "#805e47" : "#6f5340";
    roundedRect(p.x, p.y, p.w, p.h, 8); ctx.fill();
    ctx.fillStyle = "#9fbd72";
    roundedRect(p.x - 3, p.y - 7, p.w + 6, 12, 7); ctx.fill();
  });

  crates.forEach(crate => {
    if (state.smashed.has(crate.id)) {
      ctx.fillStyle = "#895f3b";
      for (let i = 0; i < 5; i++) ctx.fillRect(crate.x + i * 14, crate.y + 66 + (i % 2) * 7, 26, 10);
      return;
    }
    ctx.fillStyle = "#a87342"; roundedRect(crate.x, crate.y, crate.w, crate.h, 8); ctx.fill();
    ctx.strokeStyle = "#654226"; ctx.lineWidth = 7; ctx.strokeRect(crate.x + 6, crate.y + 6, crate.w - 12, crate.h - 12);
    ctx.beginPath(); ctx.moveTo(crate.x + 10, crate.y + 10); ctx.lineTo(crate.x + crate.w - 10, crate.y + crate.h - 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(crate.x + crate.w - 10, crate.y + 10); ctx.lineTo(crate.x + 10, crate.y + crate.h - 10); ctx.stroke();
  });

  sparkData.forEach((spark, index) => {
    if (state.sparks.has(spark.id)) return;
    const bob = Math.sin(state.elapsed * 3 + index) * 8;
    const glow = ctx.createRadialGradient(spark.x, spark.y + bob, 5, spark.x, spark.y + bob, 52);
    glow.addColorStop(0, spark.color + "dd"); glow.addColorStop(1, spark.color + "00");
    ctx.fillStyle = glow; ctx.fillRect(spark.x - 55, spark.y + bob - 55, 110, 110);
    ctx.save(); ctx.translate(spark.x, spark.y + bob); ctx.rotate(Math.sin(state.elapsed * 1.6 + index) * .12);
    ctx.fillStyle = spark.color; ctx.font = "950 48px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = "rgba(255,255,255,.7)"; ctx.shadowBlur = 15; ctx.fillText(spark.id, 0, 0); ctx.restore();
  });

  // The sacred picnic, source of all reasonable motivation.
  ctx.fillStyle = "#e7d9b9"; roundedRect(3890, 585, 150, 70, 16); ctx.fill();
  ctx.fillStyle = "#c85659";
  for (let x = 3900; x < 4035; x += 30) ctx.fillRect(x, 590, 15, 60);
  ctx.strokeStyle = "#78513a"; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(3965, 590, 48, Math.PI, 0); ctx.stroke();

  drawPlayer();
  ctx.restore();
}

function drawSpaceWorld() {
  ctx.save();
  ctx.translate(-state.camera, 0);

  // Slow tumbling rocks: dangerous-looking, spiritually harmless.
  const asteroids = [
    { x: 820, y: 160, r: 48 }, { x: 1450, y: 610, r: 62 },
    { x: 2050, y: 390, r: 42 }, { x: 2520, y: 130, r: 54 }
  ];
  asteroids.forEach((rock, i) => {
    ctx.save(); ctx.translate(rock.x, rock.y); ctx.rotate(state.elapsed * (.08 + i * .025));
    ctx.fillStyle = i % 2 ? "#5d5870" : "#6b6278";
    ctx.beginPath();
    for (let p = 0; p < 9; p++) {
      const angle = p / 9 * Math.PI * 2;
      const radius = rock.r * (.78 + ((p * 7) % 5) * .055);
      const x = Math.cos(angle) * radius, y = Math.sin(angle) * radius;
      p ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(20,18,35,.32)";
    ctx.beginPath(); ctx.arc(-rock.r * .24, -rock.r * .12, rock.r * .19, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  cosmicSparkData.forEach((spark, index) => {
    if (state.spaceSparks.has(spark.id)) return;
    const bob = Math.sin(state.elapsed * 2.5 + index) * 13;
    const glow = ctx.createRadialGradient(spark.x, spark.y + bob, 4, spark.x, spark.y + bob, 70);
    glow.addColorStop(0, spark.color + "ee"); glow.addColorStop(1, spark.color + "00");
    ctx.fillStyle = glow; ctx.fillRect(spark.x - 75, spark.y + bob - 75, 150, 150);
    ctx.fillStyle = spark.color; ctx.font = "950 50px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.shadowColor = spark.color; ctx.shadowBlur = 22; ctx.fillText(spark.id, spark.x, spark.y + bob); ctx.shadowBlur = 0;
  });

  const portalX = 2820, portalY = 400;
  ctx.save(); ctx.translate(portalX, portalY); ctx.rotate(state.elapsed * .35);
  for (let i = 0; i < 8; i++) {
    ctx.strokeStyle = `hsla(${265 + i * 9}, 90%, ${64 + i * 2}%, ${.8 - i * .07})`;
    ctx.lineWidth = 9 - i * .7;
    ctx.beginPath(); ctx.ellipse(0, 0, 72 + i * 13, 145 - i * 7, i * .13, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();

  drawPlayer();
  ctx.restore();
}

function drawPlayer() {
  const img = images[state.current][state.mode];
  if (!img.complete || !img.naturalWidth) return;
  let w = state.mode === "flight" ? 230 : 245;
  let h = w * (img.naturalHeight / img.naturalWidth);
  if (state.current === "A" && state.mode === "flight") { w = 205; h = w * (img.naturalHeight / img.naturalWidth); }
  if (state.current === "A" && state.mode === "chaos") { w = 260; h = w * (img.naturalHeight / img.naturalWidth); }
  const motion = creatureMotion();

  if (state.level !== "space") {
    ctx.save();
    ctx.globalAlpha = .2 * (1 - Math.min(1, Math.abs(state.y - GROUND) / 260));
    ctx.fillStyle = "#172019";
    ctx.beginPath();
    ctx.ellipse(state.x, state.y + 3, 69 * motion.shadowScale, 13 * motion.shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  state.trail.slice().reverse().forEach((trail, index) => {
    const alpha = Math.max(0, trail.life) * (.22 + index * .025);
    drawCreature(img, w, h, { ...motion, x: trail.x, y: trail.y, facing: trail.facing, alpha, blur: 5, ghost: true });
  });
  drawCreature(img, w, h, motion);

  if (state.transformFlash > 0) {
    const progress = state.transformFlash / .38;
    ctx.save();
    ctx.strokeStyle = PEOPLE[state.current].accent + "bb";
    ctx.lineWidth = 5 * progress;
    ctx.globalAlpha = progress;
    ctx.beginPath();
    ctx.arc(state.x, state.y - h * .36, 70 + (1 - progress) * 110, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function creatureMotion() {
  const moving = Math.min(1, Math.abs(state.vx) / 7);
  const phase = state.motionPhase;
  const motion = {
    x: state.x,
    y: state.y,
    facing: state.facing,
    alpha: 1,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    shadowScale: 1,
    wave: 0,
    blur: 0
  };

  if (state.level === "space") {
    motion.y += Math.sin(state.elapsed * .9 + state.current.charCodeAt(0)) * 7;
    motion.rotation = Math.sin(state.elapsed * .55) * .055 + state.vy * .018 + state.vx * .004;
    motion.scaleY = 1 + Math.sin(state.elapsed * 1.3) * .012;
    motion.scaleX = 2 - motion.scaleY;
    return motion;
  }

  if (state.mode === "flight" && state.current !== "A") {
    const wingbeat = Math.sin(phase * 1.35);
    motion.y += state.grounded ? -Math.abs(wingbeat) * 3 : wingbeat * 5;
    motion.rotation = Math.max(-.16, Math.min(.16, state.vy * .018)) + Math.sin(phase * .45) * .018;
    motion.scaleY = 1 + wingbeat * .032;
    motion.scaleX = 1 - wingbeat * .018;
    motion.shadowScale = state.grounded ? 1 : .68;
  } else if (state.current === "A" && state.mode === "chaos") {
    motion.y += Math.sin(phase) * 3 * moving;
    motion.rotation = Math.sin(phase * .55) * .042 * moving;
    motion.wave = 5.5 * moving;
    motion.scaleX = 1 + Math.sin(phase) * .012;
  } else {
    const stride = Math.sin(phase);
    const bound = Math.abs(Math.sin(phase * .5));
    motion.y -= bound * (5 + moving * 7);
    motion.rotation = stride * .026 * moving - state.vx * .003;
    motion.scaleX = 1 + bound * .035 * moving;
    motion.scaleY = 1 - bound * .026 * moving;
    motion.shadowScale = 1 - bound * .17 * moving;
  }

  if (state.landing > 0) {
    const squash = Math.sin((state.landing / .18) * Math.PI) * .09;
    motion.scaleX += squash;
    motion.scaleY -= squash;
    motion.y += squash * 28;
  }
  return motion;
}

function drawCreature(img, w, h, motion) {
  ctx.save();
  ctx.globalAlpha = motion.alpha ?? 1;
  ctx.translate(motion.x, motion.y);
  ctx.rotate(motion.rotation || 0);
  ctx.scale((motion.facing || 1) * (motion.scaleX || 1), motion.scaleY || 1);
  if (motion.blur) ctx.filter = `blur(${motion.blur}px)`;
  if (state.ability > 0 && !motion.ghost) {
    ctx.shadowColor = PEOPLE[state.current].accent;
    ctx.shadowBlur = 28;
  }

  if (motion.wave && !motion.ghost) {
    const strips = 14;
    const sourceW = img.naturalWidth / strips;
    const drawW = w / strips;
    for (let i = 0; i < strips; i++) {
      const offset = Math.sin(state.motionPhase + i * .62) * motion.wave;
      ctx.drawImage(img, i * sourceW, 0, sourceW + 1, img.naturalHeight, -w * .5 + i * drawW, -h * .78 + offset, drawW + 1, h);
    }
  } else {
    ctx.drawImage(img, -w * .5, -h * .78, w, h);
  }
  ctx.restore();
}

function drawHelp() {
  if (state.elapsed > 8) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (8 - state.elapsed) / 1.5);
  ctx.fillStyle = "rgba(10,14,27,.82)";
  roundedRect(22, 22, 465, 72, 18); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "800 18px system-ui"; ctx.fillText("Move: A/D or arrows   Jump: Space", 42, 51);
  ctx.fillStyle = "#d3d7e2"; ctx.font = "700 15px system-ui"; ctx.fillText("Ability: E   Transform: F/Shift   Switch: 1–4", 42, 78);
  ctx.restore();
}

let lastTime = 0;
function loop(time) {
  if (!state.running) return;
  const dt = Math.min(.034, (time - lastTime) / 1000 || .016);
  lastTime = time;
  update(dt);
  drawBackground();
  drawWorld();
  drawHelp();
  requestAnimationFrame(loop);
}

updateRoster("flight");
buildDock();
