"use strict";

const PEOPLE = {
  C: {
    age: "Teenager",
    accent: "#aa78ef",
    art: { human: "assets/forms/c-human-refined-20261009.webp", selectionHuman: "assets/forms/c-human-refined-20261009.webp", run: "assets/forms/c-human-run.webp", flight: "assets/forms/c-flight.webp", flightRun: "assets/forms/c-flight-run.webp", chaos: "assets/forms/c-chaos.webp", chaosRun: "assets/forms/c-chaos-run.webp" },
    human: { animal: "Human", ability: "Improvised vault", description: "Find the shortcut by confidently making one up." },
    flight: { animal: "Flamingo", ability: "Stilt vault", description: "Take real, high-stepping strides across the ground, then lift off." },
    chaos: { animal: "Red fox", ability: "Burrow dash", description: "Dig shortcuts and outfox objects with no brain." }
  },
  A: {
    age: "Adult",
    accent: "#d84c59",
    art: { human: "assets/forms/a-human-police-20261009.webp", selectionHuman: "assets/forms/a-human-police-20261009.webp", run: "assets/forms/a-human-run.webp", flight: "assets/forms/a-raven.webp", flightRun: "assets/forms/a-raven-run.webp", peacock: "assets/forms/a-flight.webp", peacockRun: "assets/forms/a-flight-run.webp", chaos: "assets/forms/a-chaos.webp", chaosRun: "assets/forms/a-chaos-run.webp", bite: "assets/forms/a-wolf-bite.webp" },
    human: { animal: "Human", ability: "Protective force", description: "Remove an obstacle from everyone else's problem list." },
    flight: { animal: "Raven", ability: "Hooked-beak rush", description: "A huge raven with a beak built for dramatic entrances." },
    chaos: { animal: "Giant black wolf", ability: "Bite · E / Pack-force smash · R", description: "Bite, then clear a path with enormous protective wolf energy." }
  },
  S: {
    age: "Adult",
    accent: "#91a99b",
    art: { human: "assets/forms/s-human-brows-20261009.webp", selectionHuman: "assets/forms/s-human-brows-20261009.webp", run: "assets/forms/s-human-run.webp", flight: "assets/forms/s-flight.webp", flightRun: "assets/forms/s-flight-run.webp", chaos: "assets/forms/s-chaos.webp", chaosRun: "assets/forms/s-chaos-run.webp" },
    human: { animal: "Human", ability: "Intellect", description: "Read the pattern, connect the clues, and find the best move." },
    flight: { animal: "Crow", ability: "Bright idea", description: "Glide, scout, and attract useful shiny things." },
    chaos: { animal: "Slim black panther", ability: "Silent pounce", description: "Slip out of sight, then reappear exactly where useful." }
  },
  E: {
    age: "Preteen",
    accent: "#20c9c3",
    art: { human: "assets/forms/e-human-bangs-20261008.webp", selectionHuman: "assets/forms/e-human-bangs-20261008.webp", run: "assets/forms/e-human-run.webp", flight: "assets/forms/e-snowy-owl.svg", flightRun: "assets/forms/e-snowy-owl-run.svg", horned: "assets/forms/e-flight.webp", hornedRun: "assets/forms/e-flight-run.webp", chaos: "assets/forms/e-chaos.webp", chaosRun: "assets/forms/e-chaos-run.webp" },
    human: { animal: "Human", ability: "Quick thinking", description: "A small person with an alarmingly large speed boost." },
    flight: { animal: "Snowy owl", ability: "Night sight", description: "Glide silently, spot hidden things, and vanish into the snow." },
    chaos: { animal: "Cheetah", ability: "Fast as heck", description: "Turn a tiny opening into a full-speed blur." }
  }
};

const order = ["C", "A", "S", "E"];
const ART_REVISION = "case-20261009-25";
for (const person of Object.values(PEOPLE)) {
  for (const key of Object.keys(person.art)) person.art[key] += `?v=${ART_REVISION}`;
}
const images = {};
const modes = ["human", "flight", "chaos"];
let selectedMode = "human";

const ANIMATION_FRAMES = {
  // Keep the existing run art; these gentle frame holds give C and E distinct, natural strides.
  "C:human": [0, 1, 2, 3, 2, 1],
  "E:human": [0, 1, 2, 3, 1, 2],
  // Skip the owl sheet's front-facing outlier; the repeated downstroke gives it a calm glide.
  "E:flight": [0, 1, 2, 3]
};
const WALK_CYCLE = [0, 1, 2, 3];
const frameBoxes = new WeakMap();

function getAlphaBoxes(img, count = 1) {
  if (!img?.complete || !img.naturalWidth || !img.naturalHeight) return [];
  const cached = frameBoxes.get(img);
  if (cached?.count === count) return cached.boxes;
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const scan = canvas.getContext("2d", { willReadFrequently: true });
  scan.drawImage(img, 0, 0);
  let pixels;
  try { pixels = scan.getImageData(0, 0, canvas.width, canvas.height).data; }
  catch { return []; }
  const cellW = canvas.width / count;
  const boxes = Array.from({ length: count }, () => ({ x: Infinity, y: Infinity, right: -Infinity, bottom: -Infinity }));
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (pixels[(y * canvas.width + x) * 4 + 3] < 20) continue;
      const box = boxes[Math.min(count - 1, Math.floor(x / cellW))];
      const localX = x % cellW;
      box.x = Math.min(box.x, localX);
      box.y = Math.min(box.y, y);
      box.right = Math.max(box.right, localX + 1);
      box.bottom = Math.max(box.bottom, y + 1);
    }
  }
  const result = boxes.map(box => {
    if (!Number.isFinite(box.x)) return null;
    const pad = 3;
    const x = Math.max(0, Math.floor(box.x) - pad);
    const y = Math.max(0, Math.floor(box.y) - pad);
    return { x, y, width: Math.min(cellW - x, Math.ceil(box.right) + pad - x), height: Math.min(canvas.height - y, Math.ceil(box.bottom) + pad - y) };
  });
  frameBoxes.set(img, { count, boxes: result });
  return result;
}

const roster = document.querySelector("#roster");
const dock = document.querySelector("#character-dock");

function personCard(id) {
  const p = PEOPLE[id];
  return `<article class="character-card" data-id="${id}" style="--human-image:url('${p.art.selectionHuman}');--flight-image:url('${p.art.flight}');--chaos-image:url('${p.art.chaos}')">
    <div class="card-top"><span class="card-initial">${id}</span><span class="card-age">${p.age}</span></div>
    <img class="form-art" src="${p.art.selectionHuman}" alt="${id} human form">
    <div class="card-copy"><p>${p.human.ability}</p><h2>${p.human.animal}</h2><small>${p.human.description}</small></div>
  </article>`;
}

roster.innerHTML = order.map(personCard).join("");

const FUTURE_FORMS = {
  aquatic: order.map(id => ({ id, name: id === "C" ? "Kraken" : id === "E" ? "Mantis shrimp" : "Undecided" })),
  mythical: [
    { id: "C", name: "Kraken" },
    { id: "A", name: "Black dragon" },
    { id: "S", name: "Undecided" },
    { id: "E", name: "Undecided" }
  ]
};
function renderLockedForms(group, selector) {
  const label = group === "aquatic" ? "Aquatic" : "Mythical";
  document.querySelector(selector).innerHTML = FUTURE_FORMS[group].map(({ id, name, detail }) =>
    `<button class="locked-form" type="button" disabled aria-disabled="true" title="${detail || `${label} form for ${id} is not selected yet`}"><span class="locked-initial">${id}</span><span><strong>${name}</strong><small>${detail || `${id} · Locked`}</small></span><span class="lock-icon" aria-hidden="true">🔒</span></button>`
  ).join("");
}
renderLockedForms("aquatic", "#aquatic-forms");
renderLockedForms("mythical", "#mythical-forms");

function updateRoster(mode) {
  selectedMode = mode;
  document.querySelectorAll(".form-choice").forEach(button => button.classList.toggle("selected", button.dataset.mode === mode));
  document.querySelectorAll(".character-card").forEach(card => {
    const p = PEOPLE[card.dataset.id];
    const form = p[mode];
    card.classList.toggle("flight", mode === "flight");
    card.classList.toggle("chaos", mode === "chaos");
    card.querySelector(".card-copy p").textContent = form.ability;
    card.querySelector(".card-copy h2").textContent = form.animal;
    card.querySelector(".card-copy small").textContent = form.description;
    const art = card.querySelector(".form-art");
    art.src = mode === "human" ? p.art.selectionHuman : p.art[mode];
    art.alt = `${card.dataset.id} ${form.animal} form`;
  });
}

document.querySelectorAll(".form-choice").forEach(button => button.addEventListener("click", () => updateRoster(button.dataset.mode)));

for (const [id, p] of Object.entries(PEOPLE)) {
  images[id] = {};
  for (const mode of [...modes, "run", "flightRun", "chaosRun", "peacock", "peacockRun", "horned", "bite"]) {
    if (!p.art[mode]) continue;
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
  mode: "human",
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
  bite: 0,
  peacockTimer: 0,
  peacockHudTick: 0,
  snowyOwlTimer: 0,
  batTimer: 0,
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

const keys = { left: false, right: false, jump: false, down: false };
const BACKYARD_WIDTH = 4100;
const FOREST_WIDTH = 1900;
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
  Object.assign(state, { running: true, current: "C", mode: selectedMode, x: 120, y: GROUND, vx: 0, vy: 0, grounded: true, facing: 1, camera: 0, reveal: 0, ability: 0, bite: 0, peacockTimer: 0, peacockHudTick: 0, snowyOwlTimer: 0, batTimer: 0, elapsed: 0, finished: false, level: "forest", motionPhase: 0, transformFlash: 0, landing: 0, trail: [], trailClock: 0 });
  state.sparks.clear();
  state.spaceSparks.clear();
  state.smashed.clear();
  finishCard.hidden = true;
  updateHud();
  say("Run through the forest and find the glowing portal.");
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
  dock.innerHTML = order.map(id => {
    const form = PEOPLE[id][state.mode];
    const specialPeacock = id === "A" && state.mode === "flight" && state.peacockTimer > 0;
    const snowyOwl = id === "E" && state.mode === "flight" && state.snowyOwlTimer > 0;
    const specialName = specialPeacock ? "Peacock" : snowyOwl ? "Snowy owl" : form.animal;
    const specialDetail = specialPeacock ? `${state.peacockTimer.toFixed(1)}s show-off` : snowyOwl ? `${state.snowyOwlTimer.toFixed(1)}s snow-glide` : form.ability;
    return `<button class="dock-character" data-id="${id}" type="button"><b>${id}</b><span><strong>${specialName}</strong><small>${specialDetail}</small></span></button>`;
  }).join("");
  dock.querySelectorAll("button").forEach(button => button.addEventListener("click", () => switchCharacter(button.dataset.id)));
}

function switchCharacter(id) {
  if (!PEOPLE[id]) return;
  state.current = id;
  state.ability = 0;
  state.transformFlash = .28;
  state.trail = [];
  updateHud();
  say(`${id}: ${animalNameFor(id)}`);
}

function transform() {
  state.mode = modes[(modes.indexOf(state.mode) + 1) % modes.length];
  state.ability = 0;
  state.transformFlash = .38;
  state.trail = [];
  updateHud();
  say(`${animalNameFor(state.current)} form!`);
}

function animalNameFor(id) {
  if (id === "A" && state.mode === "flight" && state.peacockTimer > 0) return "Peacock";
  if (id === "S" && state.mode === "flight" && state.batTimer > 0) return "Bat";
  if (id === "E" && state.mode === "flight" && state.snowyOwlTimer > 0) return "Great horned owl";
  return PEOPLE[id][state.mode].animal;
}

function updateHud() {
  const p = PEOPLE[state.current];
  const f = p[state.mode];
  const initial = document.querySelector("#active-initial");
  initial.textContent = state.current;
  initial.style.background = p.accent;
  document.querySelector("#active-animal").textContent = animalNameFor(state.current);
  const formName = state.mode[0].toUpperCase() + state.mode.slice(1);
  const abilityLabel = state.current === "A" && state.mode === "flight" && state.peacockTimer > 0
    ? `Peacock form · ${state.peacockTimer.toFixed(1)}s remaining`
    : state.current === "S" && state.mode === "flight" && state.batTimer > 0
      ? `Bat form · ${state.batTimer.toFixed(1)}s remaining`
      : state.current === "E" && state.mode === "flight" && state.snowyOwlTimer > 0
        ? `Great horned owl · ${state.snowyOwlTimer.toFixed(1)}s remaining`
        : f.ability;
  document.querySelector("#active-form").textContent = `${formName} form · ${abilityLabel}`;
  const count = state.level === "space" ? state.spaceSparks.size : state.sparks.size;
  document.querySelector("#case-count").textContent = state.level === "forest" ? "→" : `${count} / 4`;
  document.querySelector("#objective-label").textContent = state.level === "forest" ? "find the clearing" : state.level === "space" ? "cosmic sparks" : "CASE sparks";
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
  if (state.mode === "human") {
    if (id === "C") { state.vy = -16; state.vx += state.facing * 4; }
    if (id === "A") smashNearby(165);
    if (id === "S") { state.vx = state.facing * 13; state.reveal = 2.5; }
    if (id === "E") state.vx = state.facing * 17;
  } else if (state.mode === "flight") {
    if (id === "C") state.vy = -17;
    if (id === "A") state.vx = state.facing * 17;
    if (id === "S") { state.vy = Math.min(state.vy, -4); state.vx += state.facing * 7; }
    if (id === "E") state.reveal = 4;
  } else {
    if (id === "C") { state.vx = state.facing * 16; revealNearby(); }
    if (id === "A") { state.bite = .42; state.ability = .22; }
    if (id === "S") state.vx = state.facing * 22;
    if (id === "E") revealNearby(true);
  }
  say(id === "A" && state.mode === "chaos" ? "Wolf bite!" : PEOPLE[id][state.mode].ability);
}

function useSpecial() {
  if (state.current === "A" && state.mode === "flight") {
    state.peacockTimer = 5;
    state.transformFlash = .38;
    updateHud();
    say("Peacock! Five seconds of maximum show-off.");
  } else if (state.current === "A" && state.mode === "chaos") {
    state.ability = .75;
    smashNearby(210);
    say("Pack-force smash!");
  } else if (state.current === "S" && state.mode === "flight") {
    state.batTimer = 5;
    state.transformFlash = .38;
    updateHud();
    say("Bat shift! Five seconds of night flight.");
  } else if (state.current === "E" && state.mode === "flight") {
    state.snowyOwlTimer = 5;
    state.transformFlash = .38;
    updateHud();
    say("Great horned owl! Five seconds of silent night-gliding.");
  }
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
  } else if (state.mode === "flight" && state.vy > -3) {
    state.vy = -7;
  }
}

window.addEventListener("keydown", event => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", " "].includes(event.key) || /^[wasdr]$/i.test(event.key)) event.preventDefault();
  if (event.repeat && ["e", "E", "f", "F", "r", "R", "Shift"].includes(event.key)) return;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = true;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = true;
  if (event.key === "ArrowUp" || event.key === " " || event.key.toLowerCase() === "w") { keys.jump = true; if (!event.repeat) jump(); }
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") keys.down = true;
  if (event.key.toLowerCase() === "e") useAbility();
  if (event.key.toLowerCase() === "r") useSpecial();
  if (event.key.toLowerCase() === "f" || event.key === "Shift") transform();
  if (["1", "2", "3", "4"].includes(event.key)) switchCharacter(order[Number(event.key) - 1]);
});
window.addEventListener("keyup", event => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") keys.left = false;
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") keys.right = false;
  if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") keys.down = false;
  if (event.key === "ArrowUp" || event.key === " " || event.key.toLowerCase() === "w") keys.jump = false;
});
window.addEventListener("blur", () => Object.assign(keys, { left: false, right: false, jump: false, down: false }));

document.querySelectorAll("[data-control]").forEach(button => {
  const control = button.dataset.control;
  const down = event => {
    event.preventDefault();
    if (control === "left" || control === "right" || control === "down") keys[control] = true;
    if (control === "jump") { keys.jump = true; jump(); }
    if (control === "ability") useAbility();
    if (control === "special") useSpecial();
    if (control === "transform") transform();
  };
  const up = event => { event.preventDefault(); if (control === "left" || control === "right" || control === "down") keys[control] = false; if (control === "jump") keys.jump = false; };
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
  state.bite = Math.max(0, state.bite - dt);
  if (state.peacockTimer > 0) {
    const priorTick = Math.ceil(state.peacockTimer * 10);
    state.peacockTimer = Math.max(0, state.peacockTimer - dt);
    const nextTick = Math.ceil(state.peacockTimer * 10);
    if (priorTick !== nextTick) updateHud();
  }
  if (state.snowyOwlTimer > 0) {
    const priorTick = Math.ceil(state.snowyOwlTimer * 10);
    state.snowyOwlTimer = Math.max(0, state.snowyOwlTimer - dt);
    if (priorTick !== Math.ceil(state.snowyOwlTimer * 10)) updateHud();
  }
  if (state.batTimer > 0) {
    const priorTick = Math.ceil(state.batTimer * 10);
    state.batTimer = Math.max(0, state.batTimer - dt);
    if (priorTick !== Math.ceil(state.batTimer * 10)) updateHud();
  }
  state.reveal = Math.max(0, state.reveal - dt);
  state.transformFlash = Math.max(0, state.transformFlash - dt);
  state.landing = Math.max(0, state.landing - dt);
  state.trailClock -= dt;

  let speed = state.level === "space" ? 6.2 : 7.1;
  if (state.mode === "human" && state.current === "S") speed = 8.1;
  if (state.mode === "human" && state.current === "E") speed = 8.6;
  if (state.mode === "chaos" && state.current === "S") speed = 9.5;
  if (state.mode === "chaos" && state.current === "A") speed = 5.6;
  if (keys.left) { state.vx -= 1.25; state.facing = -1; }
  if (keys.right) { state.vx += 1.25; state.facing = 1; }
  if (!keys.left && !keys.right) state.vx *= .8;
  state.vx = Math.max(-speed, Math.min(speed, state.vx));
  if (state.level === "space") {
    state.vy += (410 - state.y) * .0018;
    if (state.mode === "flight" && keys.jump) state.vy -= 1.0;
    state.vy *= .992;
    state.vy = Math.max(-12, Math.min(12, state.vy));
  } else {
    state.vy += state.mode === "flight" ? (keys.jump ? -.52 : state.current === "S" ? .88 : .34) : .72;
    if (keys.down && !state.grounded) state.vy += 1.1;
    state.vy = Math.max(-12, Math.min(state.vy, 18));
  }

  const previousY = state.y;
  state.x += state.vx;
  const worldWidth = state.level === "space" ? SPACE_WIDTH : state.level === "forest" ? FOREST_WIDTH : BACKYARD_WIDTH;
  state.x = Math.max(30, Math.min(worldWidth - 80, state.x));
  state.y += state.vy;
  if (state.mode === "flight" && state.y < 360) { state.y = 360; state.vy = Math.max(0, state.vy); }
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
    if (state.vy >= 0 && previousY <= platform.y + 4 && collides(body, platform) && (!keys.down || platform.y === GROUND)) {
      state.y = platform.y;
      state.vy = 0;
      state.grounded = true;
    }
  });

  if (!wasGrounded && state.grounded) state.landing = .18;

  if (state.level === "forest" && state.x >= FOREST_WIDTH - 180) {
    enterSpaceLevel();
    return;
  }

  if (state.level === "backyard") crates.forEach(crate => {
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

  if (state.level === "backyard") sparkData.forEach(spark => {
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

  const targetCamera = Math.max(0, Math.min((state.level === "forest" ? FOREST_WIDTH : BACKYARD_WIDTH) - canvas.width, state.x - canvas.width * .38));
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

function enterSpaceLevel() {
  state.level = "space";
  state.x = 120;
  state.y = 400;
  state.vx = 0;
  state.vy = 0;
  state.grounded = false;
  state.camera = 0;
  state.elapsed = 0;
  updateHud();
  say("The clearing opens into space. Gravity has left the chat.");
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawBackground() {
  if (state.level === "forest") {
    drawForestBackground();
    return;
  }
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

function drawForestBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#182d31");
  gradient.addColorStop(.48, "#47715b");
  gradient.addColorStop(1, "#a0ad71");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let layer = 0; layer < 3; layer++) {
    const parallax = .12 + layer * .16;
    const spacing = 210 + layer * 48;
    for (let i = -2; i < 11; i++) {
      const x = i * spacing - (state.camera * parallax % spacing);
      const height = 300 + ((i * 37 + layer * 83 + 9000) % 180);
      ctx.fillStyle = ["#244c47", "#1d403e", "#183532"][layer];
      ctx.fillRect(x + spacing * .38, 510 - height, 36 + layer * 8, height + 150);
      ctx.beginPath();
      ctx.arc(x + spacing * .42, 510 - height, 76 + layer * 18, 0, Math.PI * 2);
      ctx.arc(x + spacing * .61, 470 - height, 88 + layer * 18, 0, Math.PI * 2);
      ctx.arc(x + spacing * .76, 510 - height, 68 + layer * 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = "rgba(226,235,174,.14)";
  for (let i = 0; i < 5; i++) {
    const x = (i * 350 - state.camera * .08 + 2100) % (canvas.width + 200) - 100;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x + 90, 0); ctx.lineTo(x + 310, 590); ctx.lineTo(x + 180, 590); ctx.closePath(); ctx.fill();
  }
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
  if (state.level === "forest") {
    drawForestWorld();
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

function drawForestWorld() {
  ctx.save();
  ctx.translate(-state.camera, 0);
  ctx.fillStyle = "#263f31";
  ctx.fillRect(0, GROUND, FOREST_WIDTH, 180);
  ctx.fillStyle = "#597645";
  ctx.fillRect(0, GROUND, FOREST_WIDTH, 15);
  for (let x = 0; x < FOREST_WIDTH; x += 42) {
    ctx.strokeStyle = x % 84 ? "#91a85f" : "#405f3b";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, GROUND + 4); ctx.quadraticCurveTo(x + 8, GROUND - 13, x + 15, GROUND - 2); ctx.stroke();
  }
  platforms.slice(1, 5).forEach((p, index) => {
    ctx.fillStyle = index % 2 ? "#624d3e" : "#765a42";
    roundedRect(p.x, p.y, p.w, p.h, 12); ctx.fill();
    ctx.fillStyle = "#84985a";
    roundedRect(p.x - 4, p.y - 7, p.w + 8, 12, 8); ctx.fill();
  });
  for (let i = 0; i < 14; i++) {
    const x = 160 + i * 112;
    const y = 615 - (i % 3) * 40;
    ctx.fillStyle = i % 2 ? "#f5b4d1" : "#dff4a1";
    ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
    ctx.beginPath(); ctx.ellipse(x, y, 7, 12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }
  const portalX = FOREST_WIDTH - 170;
  ctx.save(); ctx.translate(portalX, GROUND - 92);
  ctx.shadowColor = "#a2f6d7"; ctx.shadowBlur = 38;
  ctx.strokeStyle = "rgba(162,246,215,.92)"; ctx.lineWidth = 13;
  ctx.beginPath(); ctx.ellipse(0, 0, 56, 88, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = "rgba(226,255,220,.74)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.ellipse(0, 0, 40, 70, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
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
  const runningHuman = state.mode === "human" && state.level !== "space" && (Math.abs(state.vx) > .45 || !state.grounded);
  const runKey = `${state.mode}Run`;
  const peacock = state.current === "A" && state.mode === "flight" && state.peacockTimer > 0;
  const greatHornedOwl = state.current === "E" && state.mode === "flight" && state.snowyOwlTimer > 0;
  const animalMoving = Math.abs(state.vx) > .45 || !state.grounded;
  const flying = state.mode === "flight" && !state.grounded;
  const groundedFlightWalk = state.mode === "flight" && state.grounded && Math.abs(state.vx) > .45 && ["A", "C", "S"].includes(state.current);
  const keepFlightArtwork = state.mode === "flight" && state.current === "A" && !flying;
  const movingAnimal = state.mode !== "human" && Boolean(images[state.current][runKey]) && (state.mode === "flight" ? (flying || groundedFlightWalk) && !keepFlightArtwork : animalMoving);
  const biteImage = state.current === "A" && state.mode === "chaos" && state.bite > 0;
  const runSheet = runningHuman || movingAnimal || (peacock && flying);
  const img = biteImage
    ? images.A.bite
    : greatHornedOwl
      ? (movingAnimal && images.E.hornedRun ? images.E.hornedRun : images.E.horned)
      : peacock
      ? (flying && images.A.peacockRun ? images.A.peacockRun : images.A.peacock)
      : runningHuman
        ? images[state.current].run
        : movingAnimal
          ? images[state.current][runKey]
          : images[state.current][state.mode];
  if (!img.complete || !img.naturalWidth) return;
  let w = state.mode === "human" ? 150 : state.mode === "flight" ? 230 : 245;
  const frameCount = !biteImage && runSheet ? 4 : 1;
  let h = w * (img.naturalHeight / (img.naturalWidth / frameCount));
  if (state.mode === "human") {
    const humanWidths = { C: 155, A: 145, S: 142, E: 148 };
    w = humanWidths[state.current];
    h = runningHuman ? w * (img.naturalHeight / (img.naturalWidth / 4)) : w * (img.naturalHeight / img.naturalWidth);
  }
  if (state.current === "A" && state.mode === "flight") { w = peacock ? 230 : 260; h = w * (img.naturalHeight / (img.naturalWidth / frameCount)); }
  if (state.current === "A" && state.mode === "chaos") { w = 300; h = w * (img.naturalHeight / (img.naturalWidth / frameCount)); }
  const motion = creatureMotion();
  if (state.mode === "human") {
    const stature = { A: 1.15, C: 1, S: 1, E: .85 };
    const width = { A: 1.15, C: 1, S: .96, E: 1 };
    motion.scaleY *= stature[state.current] || 1;
    motion.scaleX *= width[state.current] || 1;
  }
  if (state.current === "A" && state.mode === "chaos") motion.scaleX *= 1.1;
  if (!biteImage && runSheet) {
    const cycle = ANIMATION_FRAMES[`${state.current}:${state.mode}`] || WALK_CYCLE;
    const rate = state.current === "E" && state.mode === "flight" ? .43 : state.mode === "flight" ? .72 : state.current === "A" && state.mode === "chaos" ? 1.16 : state.current === "C" && state.mode === "human" ? .84 : state.current === "E" && state.mode === "human" ? 1.12 : 1.02;
    motion.frameIndex = (state.motionPhase * rate) % cycle.length;
    motion.frameSequence = cycle;
    motion.frameCount = 4;
  }
  motion.snowyOwl = false;
  motion.bat = state.current === "S" && state.mode === "flight" && state.batTimer > 0;
  motion.frameBase = greatHornedOwl ? images.E.horned : images[state.current][state.mode];

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
  if (state.current === "A" && state.mode === "flight" && flying && !peacock && runSheet) drawRavenFlightScarf(img, w, h, motion);

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


function drawRavenFlightScarf(img, w, h, motion) {
  const sequence = motion.frameSequence || WALK_CYCLE;
  const framePosition = ((motion.frameIndex % sequence.length) + sequence.length) % sequence.length;
  const frameIndex = sequence[Math.floor(framePosition)];
  const box = getAlphaBoxes(img, motion.frameCount || 4)[frameIndex];
  const reference = getAlphaBoxes(images.A.flight, 1)[0];
  if (!box || !reference) return;
  const targetSize = Math.max(reference.width * (w / images.A.flight.naturalWidth), reference.height * (h / images.A.flight.naturalHeight));
  const scale = targetSize / Math.max(box.width, box.height);
  const drawW = box.width * scale;
  const drawH = box.height * scale;
  const x = drawW * .27;
  const y = -drawH * .56;
  ctx.save();
  ctx.translate(motion.x, motion.y);
  ctx.rotate(motion.rotation || 0);
  ctx.scale((motion.facing || 1) * (motion.scaleX || 1), motion.scaleY || 1);
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1.5, drawW * .009);
  ctx.strokeStyle = "#59121e";
  ctx.fillStyle = "#b91f36";
  ctx.beginPath();
  ctx.moveTo(x - drawW * .055, y - drawH * .028);
  ctx.quadraticCurveTo(x, y - drawH * .065, x + drawW * .056, y - drawH * .02);
  ctx.lineTo(x + drawW * .043, y + drawH * .025);
  ctx.quadraticCurveTo(x, y + drawH * .047, x - drawW * .045, y + drawH * .02);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - drawW * .018, y + drawH * .018);
  ctx.quadraticCurveTo(x + drawW * .01, y + drawH * .045, x + drawW * .032, y + drawH * .07);
  ctx.lineTo(x + drawW * .008, y + drawH * .3);
  ctx.quadraticCurveTo(x - drawW * .028, y + drawH * .21, x - drawW * .04, y + drawH * .105);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#ed6670";
  ctx.lineWidth = Math.max(1, drawW * .004);
  ctx.beginPath(); ctx.moveTo(x - drawW * .024, y + drawH * .042); ctx.lineTo(x - drawW * .01, y + drawH * .12); ctx.stroke();
  ctx.restore();
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

  if (state.mode === "flight") {
    if (!state.grounded) {
      const wingbeat = Math.sin(phase * (state.current === "E" ? .88 : 1.12));
      motion.y += wingbeat * (state.current === "E" ? 2.2 : 3.3);
      motion.rotation = Math.max(-.09, Math.min(.09, state.vy * .008)) + Math.sin(phase * .28) * .008;
      motion.scaleY = 1 + wingbeat * .012;
      motion.scaleX = 1 - wingbeat * .006;
      motion.shadowScale = .62;
    } else if (Math.abs(state.vx) > .45 && ["C", "A", "S", "E"].includes(state.current)) {
      const step = Math.sin(phase * (state.current === "S" ? 1.55 : 2.25));
      if (state.current === "S") {
        motion.y -= Math.max(0, step) * 5.5;
        motion.rotation = step * .014;
        motion.scaleY = 1 - Math.max(0, -step) * .018;
        motion.shadowScale = 1 - Math.max(0, step) * .13;
      } else if (state.current === "A") {
        // Raven ground travel is a steady alternating footstep with only a tiny body bob.
        motion.y -= Math.max(0, step) * 5.2;
        motion.x += state.facing * Math.max(0, step) * 2;
        motion.rotation = step * .018;
        motion.shadowScale = 1;
      } else {
        // Flamingos take deliberate stilted steps; their wings stay folded on land.
        motion.y -= Math.abs(step) * 1.1;
        motion.rotation = step * .012;
        motion.shadowScale = 1;
      }
    } else {
      motion.rotation = 0;
      motion.shadowScale = 1;
    }
  } else if (state.mode === "human") {
    motion.rotation = Math.max(-.08, Math.min(.08, state.vy * .008)) - state.vx * .0015;
    motion.shadowScale = state.grounded ? 1 : .72;
    if (state.grounded && moving > 0 && state.current === "C") {
      const stride = state.motionPhase * .84;
      const compression = Math.max(0, Math.sin(stride));
      motion.y -= compression * 2.6 * moving;
      motion.rotation += Math.sin(stride * .5) * .012 * moving;
      motion.scaleY = 1 - compression * .012 * moving;
      motion.shadowScale *= 1 - compression * .045 * moving;
    } else if (state.grounded && moving > 0 && state.current === "E") {
      const stride = state.motionPhase * 1.12;
      const compression = Math.max(0, Math.sin(stride));
      motion.y -= compression * 1.8 * moving;
      motion.rotation += Math.sin(stride * .5) * .008 * moving;
      motion.scaleY = 1 - compression * .009 * moving;
      motion.shadowScale *= 1 - compression * .03 * moving;
    }
  } else if (state.current === "A" && state.mode === "chaos") {
    const stride = Math.sin(phase * 1.05);
    motion.y += Math.sin(phase * 1.05) * 4.6 * moving;
    motion.x += state.facing * Math.max(0, stride) * 5.5 * moving;
    motion.rotation = Math.sin(phase * .52) * .06 * moving;
    motion.scaleX = 1 + Math.max(0, stride) * .075 * moving;
    motion.scaleY = 1 - Math.max(0, stride) * .03 * moving;
  } else {
    const stride = Math.sin(phase);
    const bound = Math.abs(Math.sin(phase * .5)) * moving;
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
  if (keys.down && state.grounded) {
    motion.scaleY = .84;
    motion.y += 12;
  }
  return motion;
}

function drawBatSilhouette(w, h) {
  const flap = Math.sin(state.elapsed * 13) * .16;
  const half = w * .5;
  const bodyY = -h * .06;
  ctx.fillStyle = "#171522";
  ctx.beginPath();
  ctx.moveTo(0, bodyY - h * .18);
  ctx.lineTo(-w * .07, bodyY - h * .39);
  ctx.lineTo(-w * .16, bodyY - h * .2);
  ctx.lineTo(-half, bodyY - h * (.03 + flap));
  ctx.lineTo(-w * .38, bodyY + h * (.1 + flap));
  ctx.lineTo(-w * .26, bodyY + h * .04);
  ctx.lineTo(-w * .16, bodyY + h * .19);
  ctx.lineTo(-w * .08, bodyY + h * .1);
  ctx.lineTo(0, bodyY + h * .21);
  ctx.lineTo(w * .08, bodyY + h * .1);
  ctx.lineTo(w * .16, bodyY + h * .19);
  ctx.lineTo(w * .26, bodyY + h * .04);
  ctx.lineTo(w * .38, bodyY + h * (.1 + flap));
  ctx.lineTo(half, bodyY - h * (.03 + flap));
  ctx.lineTo(w * .16, bodyY - h * .2);
  ctx.lineTo(w * .07, bodyY - h * .39);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, bodyY, w * .075, h * .25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, bodyY - h * .2, w * .075, 0, Math.PI * 2);
  ctx.fill();
}

function drawCreature(img, w, h, motion) {
  ctx.save();
  ctx.globalAlpha = motion.alpha ?? 1;
  ctx.translate(motion.x, motion.y);
  ctx.rotate(motion.rotation || 0);
  ctx.scale((motion.facing || 1) * (motion.scaleX || 1), motion.scaleY || 1);
  if (motion.blur) ctx.filter = `blur(${motion.blur}px)`;
  if (motion.snowyOwl) ctx.filter = "grayscale(.92) brightness(1.28) contrast(1.12) saturate(.4)";
  if (state.ability > 0 && !motion.ghost) {
    ctx.shadowColor = PEOPLE[state.current].accent;
    ctx.shadowBlur = 28;
  }

  if (motion.bat && !motion.ghost) {
    drawBatSilhouette(w, h);
  } else if (Number.isFinite(motion.frameIndex)) {
    const frameCount = motion.frameCount || 1;
    const sequence = motion.frameSequence || [0, 1, 2, 3];
    const framePosition = ((motion.frameIndex % sequence.length) + sequence.length) % sequence.length;
    // Use discrete poses. Crossfading transparent cutouts creates doubled edges and apparent blinking.
    const frameIndex = sequence[Math.floor(framePosition)];
    drawNormalizedFrame(img, frameCount, frameIndex, motion.frameBase, w, h);
  } else if (motion.wave && !motion.ghost) {
    const strips = 14;
    const sourceW = img.naturalWidth / strips;
    const drawW = w / strips;
    for (let i = 0; i < strips; i++) {
      const offset = Math.sin(state.motionPhase + i * .62) * motion.wave;
      ctx.drawImage(img, i * sourceW, 0, sourceW + 1, img.naturalHeight, -w * .5 + i * drawW, -h * .95 + offset, drawW + 1, h);
    }
  } else {
    ctx.drawImage(img, -w * .5, -h * .95, w, h);
  }
  ctx.restore();
}

function drawNormalizedFrame(img, frameCount, frameIndex, reference, w, h) {
  const boxes = getAlphaBoxes(img, frameCount);
  const box = boxes[frameIndex];
  const refBox = getAlphaBoxes(reference, 1)[0];
  if (!box || !refBox) {
    const cellW = img.naturalWidth / frameCount;
    ctx.drawImage(img, frameIndex * cellW, 0, cellW, img.naturalHeight, -w * .5, -h * .95, w, h);
    return;
  }
  const targetSize = Math.max(refBox.width * (w / reference.naturalWidth), refBox.height * (h / reference.naturalHeight));
  const scale = targetSize / Math.max(box.width, box.height);
  const cellW = img.naturalWidth / frameCount;
  const dw = box.width * scale;
  const dh = box.height * scale;
  ctx.drawImage(img, frameIndex * cellW + box.x, box.y, box.width, box.height, -dw * .5, -dh, dw, dh);
}

function drawHelp() {
  if (state.elapsed > 8) return;
  ctx.save();
  ctx.globalAlpha = Math.min(1, (8 - state.elapsed) / 1.5);
  ctx.fillStyle = "rgba(10,14,27,.82)";
  roundedRect(22, 22, 680, 72, 18); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "800 18px system-ui"; ctx.fillText("Move: A/D or ←/→   Jump: W/Space · Hold W to fly", 42, 51);
  ctx.fillStyle = "#d3d7e2"; ctx.font = "700 15px system-ui"; ctx.fillText("Down: S   Ability: E   Special: R   Transform: F   Switch: 1–4", 42, 78);
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

updateRoster("human");
buildDock();
