"use strict";

// Colle ici ton URL Google Apps Script si tu souhaites enregistrer les résultats.
const RESULT_ENDPOINT = "";
const TOTAL_DISCOVERIES = 14;

const $ = (selector) => document.querySelector(selector);

const dom = {
  startScreen: $("#startScreen"),
  gameScreen: $("#gameScreen"),
  resultScreen: $("#resultScreen"),
  startButton: $("#startButton"),
  silentButton: $("#silentButton"),
  soundButton: $("#soundButton"),
  hintButton: $("#hintButton"),
  scene: $("#scene"),
  sceneImage: $("#sceneImage"),
  sceneTag: $("#sceneTag"),
  blink: $("#blink"),
  transition: $("#transition"),
  hotspots: $("#hotspots"),
  inventoryTray: $("#inventoryTray"),
  dialogueText: $("#dialogueText"),
  chapterLabel: $("#chapterLabel"),
  clueLabel: $("#clueLabel"),
  choices: $("#choices"),
  signalFill: $("#signalFill"),
  resultTitle: $("#resultTitle"),
  resultStory: $("#resultStory"),
  resultScore: $("#resultScore"),
  resultDiscoveries: $("#resultDiscoveries"),
  resultObjects: $("#resultObjects"),
  resultRoute: $("#resultRoute"),
  resultTime: $("#resultTime"),
  shareButton: $("#shareButton"),
  replayButton: $("#replayButton"),
  shareStatus: $("#shareStatus"),
  storyCanvas: $("#storyCanvas")
};

const itemDefs = {
  walkman: {
    name: "WALKMAN",
    sprite: "assets/sprites/walkman.png",
    inspect: "L’enregistrement est intact, mais l’appareil n’a plus de pile."
  },
  journal: {
    name: "JOURNAL",
    sprite: "assets/sprites/journal.png",
    inspect: "Une carte incomplète mentionne un accès sous les rails."
  },
  knife: {
    name: "COUTEAU",
    sprite: "assets/sprites/knife.png",
    inspect: "La lame est courte, mais suffisamment solide pour couper des lianes."
  },
  glasses: {
    name: "LUNETTES",
    sprite: "assets/sprites/glasses.png",
    inspect: "Les verres polarisés font ressortir les pigments verts dans la lumière."
  },
  bow: {
    name: "ARCHET",
    sprite: "assets/sprites/bow.svg",
    inspect: "Un archet de viole, légèrement rayé mais encore utilisable."
  },
  battery: {
    name: "PILE",
    sprite: "assets/sprites/battery.svg",
    inspect: "Une pile presque neuve. Elle pourrait alimenter le walkman."
  }
};

const locationDefs = {
  courtyard: {
    name: "COUR CENTRALE",
    chapter: "POINT DE DÉPART",
    image: "assets/scene-01-handmade.svg",
    position: "center",
    handmade: true
  },
  alcove: {
    name: "ALCÔVE DU RÉVEIL",
    chapter: "DERRIÈRE TOI",
    image: "assets/scene-01-handmade.svg",
    position: "72% center",
    handmade: true
  },
  local: {
    name: "LOCAL TECHNIQUE",
    chapter: "À GAUCHE",
    image: "assets/px-03.png",
    position: "center"
  },
  tram: {
    name: "TRAM IMMOBILE",
    chapter: "EN FACE",
    image: "assets/px-02.png",
    position: "51% center"
  },
  greenhouse: {
    name: "SERRE ENVAHIE",
    chapter: "À DROITE",
    image: "assets/px-01.png",
    position: "center 58%"
  },
  karmen: {
    name: "KARMEN CAMINA",
    chapter: "LE SIGNAL EST PROCHE",
    image: "assets/px-05.png",
    position: "center 55%"
  },
  final: {
    name: "SIGNAL RETROUVÉ",
    chapter: "SPECTR × KEEP HUSH",
    image: "assets/px-06.png",
    position: "center",
    color: true
  }
};

const routeNames = {
  vines: "PASSAGE DES LIANES",
  signal: "SIGNAL DU WALKMAN",
  sewer: "PASSAGE SOUS LES RAILS"
};

const state = {
  location: null,
  originBeforeKarmen: "courtyard",
  inventory: new Set(),
  visited: new Set(),
  discoveries: new Set(),
  metMusician: false,
  helpedMusician: false,
  route: null,
  signal: 12,
  startTime: 0,
  elapsed: 0,
  muted: false,
  audio: null,
  audioTimer: null,
  hintTimer: null,
  sessionId: "",
  started: false,
  ended: false,
  firstItem: false,
  routesSeen: new Set(),
  blockedSeen: new Set(),
  hintCount: 0,
  lastLeave: 0,
  stage: 0,
  hintLevel: 0,
  hintMarker: "",
  nudgeTimer: null
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function makeSessionId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
}

function sendData(fields, useBeacon = false) {
  if (!RESULT_ENDPOINT) return;
  try {
    const payload = new URLSearchParams(fields);
    if (useBeacon && navigator.sendBeacon && navigator.sendBeacon(RESULT_ENDPOINT, payload)) return;
    fetch(RESULT_ENDPOINT, { method: "POST", mode: "no-cors", body: payload, keepalive: true }).catch(() => {});
  } catch (error) {
    // Le suivi ne doit jamais gêner le jeu.
  }
}

function track(event, data = {}, useBeacon = false) {
  if (!state.sessionId) return;
  const seconds = state.startTime ? Math.round((Date.now() - state.startTime) / 1000) : 0;
  const fields = { game: "follow_the_green_free_roam", sessionId: state.sessionId, event, t: seconds, place: state.location || "", route: state.route || "", ...data };
  Object.keys(fields).forEach((key) => { fields[key] = String(fields[key]); });
  sendData(fields, useBeacon);
}

function markRoute(route) {
  state.route = route;
  if (state.routesSeen.has(route)) return;
  state.routesSeen.add(route);
  track("route", { route });
}

function trackBlocked(where, missing) {
  const key = `${where}:${missing}`;
  if (state.blockedSeen.has(key)) return;
  state.blockedSeen.add(key);
  track("blocked", { where, missing });
}

function trackLeave() {
  if (!state.started || state.ended) return;
  const now = Date.now();
  if (now - state.lastLeave < 2000) return;
  state.lastLeave = now;
  track("leave", { discoveries: state.discoveries.size, items: state.inventory.size, hints: state.hintCount }, true);
}

function hasItem(id) {
  return state.inventory.has(id);
}

function signalStage() {
  const value = state.signal;
  return value >= 100 ? 4 : value >= 75 ? 3 : value >= 50 ? 2 : value >= 25 ? 1 : 0;
}

function pulse(element, className) {
  if (!element) return;
  element.classList.remove(className);
  void element.offsetWidth;
  element.classList.add(className);
}

function applySignalLook() {
  dom.scene.style.setProperty("--signal", String(state.signal / 100));
  const stage = signalStage();
  if (stage > state.stage) {
    state.stage = stage;
    track("signal_stage", { stage });
    pulse(dom.signalFill.closest(".hud-meter"), "stage-up");
    pulse(dom.scene, "signal-flash");
    playStageCue(stage);
  }
  updateAudioLayers();
}

function addSignal(amount) {
  state.signal = clamp(state.signal + amount);
  dom.signalFill.style.width = `${state.signal}%`;
  applySignalLook();
}

function raiseSignalTo(minimum) {
  if (state.signal < minimum) addSignal(minimum - state.signal);
}

function discover(id, signal = 4) {
  if (state.discoveries.has(id)) return false;
  state.discoveries.add(id);
  addSignal(signal);
  updateHUD();
  return true;
}

function addItem(id, text) {
  if (hasItem(id)) return;
  state.inventory.add(id);
  if (!state.firstItem) {
    state.firstItem = true;
    track("first_item", { item: id });
  }
  discover(`item-${id}`, 5);
  updateInventory();
  renderCurrentLocation(text || `${itemDefs[id].name} ajouté à l’inventaire.`);
}

function removeItem(id) {
  state.inventory.delete(id);
  updateInventory();
}

function setText(text) {
  dom.dialogueText.textContent = text;
}

function setChoices(choices = []) {
  dom.choices.replaceChildren();
  choices.forEach(({ label, action }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = label;
    button.addEventListener("click", action, { once: true });
    dom.choices.append(button);
  });
}

function updateHUD() {
  dom.signalFill.style.width = `${state.signal}%`;
  applySignalLook();
  const count = state.discoveries.size;
  dom.clueLabel.textContent = `${count} DÉCOUVERTE${count > 1 ? "S" : ""}`;
}

function updateInventory() {
  updateAudioLayers();
  dom.inventoryTray.replaceChildren();
  if (!state.inventory.size) {
    const empty = document.createElement("span");
    empty.className = "inventory-empty";
    empty.textContent = "INVENTAIRE VIDE";
    dom.inventoryTray.append(empty);
    return;
  }

  state.inventory.forEach((id) => {
    const item = itemDefs[id];
    const button = document.createElement("button");
    button.type = "button";
    button.className = "inventory-item";
    button.setAttribute("aria-label", `Examiner ${item.name}`);
    button.innerHTML = `<img src="${item.sprite}" alt=""><span>${item.name}</span>`;
    button.addEventListener("click", () => {
      setText(item.inspect);
      setChoices([]);
    });
    dom.inventoryTray.append(button);
  });
}

function renderHotspots(hotspots = []) {
  setChoices([]);
  armNudge();
  dom.hotspots.replaceChildren();
  hotspots.forEach((spot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `hotspot ${spot.kind || "object-hotspot"}`;
    button.style.setProperty("--x", spot.x);
    button.style.setProperty("--y", spot.y);
    button.style.setProperty("--w", spot.width || spot.size || "58px");
    button.style.setProperty("--h", spot.height || spot.size || "58px");
    button.setAttribute("aria-label", spot.label);
    button.dataset.id = spot.id;

    if (spot.direction) button.dataset.direction = spot.direction;
    if (spot.sprite) {
      const image = document.createElement("img");
      image.src = spot.sprite;
      image.alt = "";
      image.setAttribute("aria-hidden", "true");
      button.append(image);
    }

    const label = document.createElement("span");
    label.className = "object-label";
    label.textContent = spot.label;
    button.append(label);
    button.addEventListener("click", spot.action);
    dom.hotspots.append(button);
  });
}

function navSpot(id, label, direction, x, y, width, height, action) {
  return { id, label, direction, x, y, width, height, kind: "nav-hotspot", action };
}

function objectSpot(id, label, sprite, x, y, size, action, kind = "object-hotspot") {
  return { id, label, sprite, x, y, size, kind, action };
}

function applyScene(location) {
  const def = locationDefs[location];
  dom.sceneImage.style.backgroundImage = `url("${def.image}")`;
  dom.sceneImage.style.backgroundPosition = def.position;
  dom.sceneTag.textContent = def.name;
  dom.chapterLabel.textContent = def.chapter;
  dom.scene.classList.toggle("scene-handmade", Boolean(def.handmade));
  dom.scene.classList.toggle("scene-full-color", Boolean(def.color));
  dom.scene.classList.toggle("scene-muted", !def.color);
}

function animateTransition() {
  dom.transition.classList.remove("moving");
  void dom.transition.offsetWidth;
  dom.transition.classList.add("moving");
}

function goTo(location, text) {
  if (state.location && state.location !== location) animateTransition();
  const firstVisit = !state.visited.has(location);
  state.location = location;
  state.visited.add(location);
  if (firstVisit) track("location", { place: location });
  if (location === "karmen") raiseSignalTo(80);
  if (location === "final") raiseSignalTo(100);
  applyScene(location);
  setChoices([]);
  renderCurrentLocation(text);
  updateHUD();
}

function renderCurrentLocation(overrideText) {
  switch (state.location) {
    case "courtyard": renderCourtyard(overrideText); break;
    case "alcove": renderAlcove(overrideText); break;
    case "local": renderLocal(overrideText); break;
    case "tram": renderTram(overrideText); break;
    case "greenhouse": renderGreenhouse(overrideText); break;
    case "karmen": renderKarmen(overrideText); break;
    case "final": renderFinal(overrideText); break;
    default: goTo("courtyard", overrideText);
  }
}

function renderCourtyard(overrideText) {
  const firstVisit = state.visited.size <= 1;
  setText(overrideText || (firstVisit
    ? "Le son se sépare dans la cour : un grésillement à gauche, des rails en face et quelques notes à droite. Tu peux revenir ici à tout moment."
    : "La cour relie tous les chemins. Rien ne t’oblige à continuer dans la même direction."));

  renderHotspots([
    navSpot("to-local", "Aller à gauche", "left", "7%", "55%", "72px", "260px", () => goTo("local")),
    navSpot("to-tram", "Avancer vers le tram", "up", "50%", "12%", "210px", "92px", () => goTo("tram")),
    navSpot("to-greenhouse", "Aller à droite", "right", "93%", "55%", "72px", "260px", () => goTo("greenhouse")),
    navSpot("to-alcove", "Revenir sur tes pas", "down", "50%", "94%", "220px", "64px", () => goTo("alcove"))
  ]);
}

function renderAlcove(overrideText) {
  const spots = [];
  if (!hasItem("walkman")) {
    spots.push(objectSpot("walkman", "Prendre le walkman", itemDefs.walkman.sprite, "72%", "73%", "38px", () => {
      addItem("walkman", "Le walkman contient une voix presque effacée. Sans pile, impossible d’écouter la suite.");
    }));
  }
  if (!hasItem("journal")) {
    spots.push(objectSpot("journal", "Ramasser le journal", itemDefs.journal.sprite, "34%", "61%", "36px", () => {
      addItem("journal", "Plusieurs pages manquent. Une carte indique pourtant quelque chose sous les rails.");
    }));
  }
  spots.push(navSpot("back-courtyard", "Retourner dans la cour", "back", "50%", "94%", "220px", "64px", () => goTo("courtyard")));

  setText(overrideText || (!hasItem("walkman") || !hasItem("journal")
    ? "C’est ici que tu t’es réveillé. Des affaires ont été abandonnées près du mur."
    : "Tu as fouillé l’alcôve. Il ne reste que la trace de l’endroit où tu étais allongé."));
  renderHotspots(spots);
}

function renderLocal(overrideText) {
  const spots = [];
  if (!hasItem("knife")) {
    spots.push(objectSpot("knife", "Prendre le couteau", itemDefs.knife.sprite, "61%", "68%", "38px", () => {
      addItem("knife", "Un couteau de poche oublié sur l’établi. La lame pourrait couper la végétation.");
    }));
  }
  if (!state.discoveries.has("local-panel")) {
    spots.push(objectSpot("local-panel", "Examiner le panneau", "assets/sprites/panel.png", "34%", "40%", "42px", inspectLocalPanel));
  }
  spots.push(objectSpot("vines", "Essayer le passage envahi", "assets/sprites/vine.png", "84%", "33%", "54px", tryVines, "path-hotspot"));
  spots.push(navSpot("back-courtyard", "Retourner dans la cour", "back", "50%", "94%", "220px", "64px", () => goTo("courtyard")));

  setText(overrideText || "Le local sent la rouille. Derrière les machines, des lianes recouvrent entièrement une ouverture.");
  renderHotspots(spots);
}

function inspectLocalPanel() {
  discover("local-panel", 5);
  renderLocal("Le panneau est hors service, mais son aiguille bouge à chaque note grave. Le signal passe derrière les lianes.");
}

function tryVines() {
  if (!hasItem("knife")) {
    trackBlocked("vines", "knife");
    renderLocal("Les tiges sont trop épaisses pour être arrachées. Il te faut quelque chose de tranchant.");
    return;
  }
  markRoute("vines");
  state.originBeforeKarmen = "local";
  discover("route-vines", 12);
  goTo("karmen", "La lame ouvre lentement un ancien passage de service. De l’autre côté, les murs vibrent au rythme des basses.");
}

function renderTram(overrideText) {
  const spots = [];
  if (!hasItem("bow") && !state.helpedMusician) {
    spots.push(objectSpot("bow", "Ramasser l’objet entre les rails", itemDefs.bow.sprite, "25%", "39%", "34px", () => {
      addItem("bow", "Un archet est coincé entre les rails. Quelqu’un doit probablement le chercher.");
    }));
  }
  spots.push(objectSpot("tram-panel", "Examiner la cabine", "assets/sprites/panel.png", "61%", "67%", "44px", inspectTramPanel));
  spots.push({
    id: "drain",
    label: "Examiner la plaque au sol",
    x: "79%",
    y: "84%",
    width: "82px",
    height: "70px",
    kind: "embedded-hotspot",
    action: inspectDrain
  });
  spots.push(navSpot("back-courtyard", "Retourner dans la cour", "back", "50%", "94%", "220px", "64px", () => goTo("courtyard")));

  setText(overrideText || "Le tram est immobile. La cabine grésille encore et quelque chose brille entre les rails.");
  renderHotspots(spots);
}

function inspectTramPanel() {
  if (hasItem("walkman") && hasItem("battery")) {
    markRoute("signal");
    state.originBeforeKarmen = "tram";
    discover("route-signal", 14);
    goTo("karmen", "La pile réveille le walkman. La voix décrit exactement le trajet jusqu’à une porte du Karmen.");
    return;
  }
  if (hasItem("walkman")) {
    trackBlocked("tram-panel", "battery");
    renderTram("La prise correspond au walkman. L’appareil réagit au grésillement, mais il lui manque toujours une pile.");
    return;
  }
  trackBlocked("tram-panel", "walkman");
  renderTram("Un câble audio sort de la console. Tu n’as rien qui puisse lire l’enregistrement.");
}

function inspectDrain() {
  if (hasItem("glasses") && hasItem("journal")) {
    markRoute("sewer");
    state.originBeforeKarmen = "tram";
    discover("route-sewer", 13);
    goTo("karmen", "Les lunettes révèlent les mêmes marques que sur la carte. Sous la plaque, un tunnel rejoint le Karmen.");
    return;
  }
  if (hasItem("glasses")) {
    trackBlocked("drain", "journal");
    discover("green-marks", 5);
    renderTram("Les verres font apparaître des marques vertes sur le métal. Elles ressemblent à un fragment de plan.");
    return;
  }
  if (hasItem("journal")) {
    trackBlocked("drain", "glasses");
    renderTram("La carte mentionne cette plaque, mais les indications sont devenues illisibles.");
    return;
  }
  trackBlocked("drain", "glasses+journal");
  renderTram("Une plaque rouillée, solidement fermée. Rien ne permet encore de comprendre son utilité.");
}

function renderGreenhouse(overrideText) {
  const spots = [];
  if (!hasItem("glasses")) {
    spots.push(objectSpot("glasses", "Prendre les lunettes", itemDefs.glasses.sprite, "27%", "76%", "36px", () => {
      addItem("glasses", "Des lunettes polarisées. À travers les verres, certaines traces vertes deviennent beaucoup plus nettes.");
    }));
  }
  spots.push(objectSpot("musician", "Parler à la musicienne", "assets/sprites/musician.svg", "72%", "56%", "78px", talkMusician, "person-hotspot"));
  spots.push(navSpot("back-courtyard", "Retourner dans la cour", "back", "50%", "94%", "220px", "64px", () => goTo("courtyard")));

  let text = "Une musicienne tient une viole sans archet. Elle écoute le même son que toi, mais ne semble pas perdue.";
  if (state.helpedMusician) text = "La musicienne fait vibrer une note grave. Elle se propage jusque sous la ville.";
  setText(overrideText || text);
  renderHotspots(spots);
}

function talkMusician() {
  if (!state.metMusician) {
    state.metMusician = true;
    discover("met-musician", 5);
    if (hasItem("bow")) {
      setText("« Mon archet ! Je le cherchais depuis que le son a changé. »");
      setChoices([
        { label: "LUI RENDRE L’ARCHET", action: returnBow },
        { label: "QU’EST-CE QUE TU JOUES ?", action: askAboutMusic },
        { label: "LE GARDER POUR L’INSTANT", action: () => renderGreenhouse("Elle te regarde repartir, sans insister.") }
      ]);
      return;
    }
    setText("« J’ai perdu mon archet près du tram. Sans lui, je ne peux pas terminer le morceau. »");
    setChoices([
      { label: "JE VAIS REGARDER PRÈS DES RAILS", action: () => renderGreenhouse("Elle acquiesce et recommence à écouter les vibrations du sol.") },
      { label: "QU’EST-CE QUE TU JOUES ?", action: askAboutMusic },
      { label: "JE PRÉFÈRE CONTINUER", action: () => renderGreenhouse("Tu la laisses dans la serre. Elle ne cherche pas à te retenir.") }
    ]);
    return;
  }

  if (hasItem("bow") && !state.helpedMusician) {
    setText("Elle reconnaît immédiatement l’archet dans ton inventaire.");
    setChoices([
      { label: "LUI RENDRE L’ARCHET", action: returnBow },
      { label: "LUI DEMANDER CE QU’ELLE JOUE", action: askAboutMusic },
      { label: "LE GARDER POUR L’INSTANT", action: () => renderGreenhouse("Elle te regarde repartir, sans insister.") }
    ]);
    return;
  }

  if (state.helpedMusician) {
    setText("« La viole ne remplace pas une voix. Ce soir, c’est elle qui guide les breaks. »");
    setChoices([
      { label: "ÉCOUTER LA NOTE JUSQU’AU BOUT", action: listenToMusician },
      { label: "REPARTIR EXPLORER", action: () => renderGreenhouse() }
    ]);
    return;
  }

  setText("« L’archet a dû tomber entre les rails. Reviens si tu le trouves. »");
  setChoices([
    { label: "PARLER DE SA MUSIQUE", action: askAboutMusic },
    { label: "REPARTIR VERS LA COUR", action: () => goTo("courtyard") }
  ]);
}

function askAboutMusic() {
  discover("viola-lore", 6);
  setText("Elle joue de la jungle avec une viole : un instrument plus grave et plus chaud qu’un violon. Les cordes se mêlent aux breakbeats.");
  setChoices([
    { label: "REVENIR À LA SERRE", action: () => renderGreenhouse() }
  ]);
}

function returnBow() {
  removeItem("bow");
  state.helpedMusician = true;
  discover("help-musician", 12);
  state.inventory.add("battery");
  updateInventory();
  setText("Elle récupère l’archet et te donne une pile trouvée dans son ampli. Une note grave traverse alors toute la serre.");
  setChoices([
    { label: "ÉCOUTER", action: listenToMusician },
    { label: "REPARTIR AVEC LA PILE", action: () => renderGreenhouse() }
  ]);
}

function listenToMusician() {
  discover("musician-note", 7);
  renderGreenhouse("La note tenue fait réagir le walkman et les rails au même instant. Les deux sons viennent du même endroit.");
}

function renderKarmen(overrideText) {
  const entryLabels = {
    vines: "Entrer par le passage de service",
    signal: "Suivre la voix jusqu’à la porte",
    sewer: "Remonter sous la salle"
  };
  const entrySprites = {
    vines: "assets/sprites/vine.png",
    signal: "assets/sprites/door.png",
    sewer: "assets/sprites/sewer.png"
  };
  const entryPositions = {
    vines: ["73%", "41%"],
    signal: ["29%", "66%"],
    sewer: ["67%", "84%"]
  };
  const [x, y] = entryPositions[state.route] || ["45%", "62%"];

  setText(overrideText || "Tu as trouvé le Karmen. Tu peux entrer maintenant ou revenir explorer ce que tu as laissé derrière toi.");
  renderHotspots([
    objectSpot("enter-karmen", entryLabels[state.route] || "Entrer", entrySprites[state.route] || "assets/sprites/door.png", x, y, "62px", enterKarmen, "path-hotspot"),
    navSpot("go-back", "Revenir sur tes pas", "back", "50%", "94%", "220px", "64px", () => goTo(state.originBeforeKarmen))
  ]);
}

function enterKarmen() {
  goTo("final", "La couleur revient d’un coup. La voix, la viole et les basses ne formaient qu’un seul signal.");
}

function renderFinal(overrideText) {
  setText(overrideText || "La salle entière se trouvait de l’autre côté. Ton trajet détermine ce que tu as compris avant d’arriver.");
  renderHotspots([
    objectSpot("profile", "Découvrir mon profil", "assets/sprites/waveform.png", "50%", "60%", "76px", showResults, "path-hotspot")
  ]);
}

function begin(withSound) {
  state.startTime = Date.now();
  state.muted = !withSound;
  state.sessionId = makeSessionId();
  state.started = true;
  track("start", { sound: withSound, screen: `${window.innerWidth}x${window.innerHeight}` });
  dom.startScreen.classList.add("hidden");
  dom.gameScreen.classList.remove("hidden");
  dom.soundButton.classList.toggle("off", state.muted);
  updateHUD();
  updateInventory();
  if (withSound) startAudio();

  state.location = "courtyard";
  state.visited.add("courtyard");
  track("location", { place: "courtyard" });
  applyScene("courtyard");
  setText("…");
  renderHotspots([]);
  dom.blink.classList.remove("waking");
  void dom.blink.offsetWidth;
  dom.blink.classList.add("waking");
  window.setTimeout(() => renderCourtyard(), 2200);
}

function hintTargets(place, targets, navId) {
  if (state.location === place) return targets;
  if (state.location === "courtyard") return [navId];
  return [state.location === "karmen" ? "go-back" : "back-courtyard"];
}

function getHint() {
  const loc = state.location;
  const missing = (id) => !hasItem(id);
  if (loc === "final") return { vague: "Le signal est là.", precise: "Découvre ton profil.", targets: ["profile"] };
  if (loc === "karmen") return { vague: "Tu y es presque.", precise: "Entre par la porte qui s’ouvre devant toi.", targets: ["enter-karmen"] };
  const pickups = ({
    alcove: ["walkman", "journal"].filter(missing),
    local: ["knife"].filter(missing),
    tram: !hasItem("bow") && !state.helpedMusician ? ["bow"] : [],
    greenhouse: ["glasses"].filter(missing)
  })[loc] || [];
  if (pickups.length) {
    return { vague: "Il reste quelque chose à ramasser ici.", precise: `Regarde bien : ${pickups.map((id) => itemDefs[id].name.toLowerCase()).join(" et ")}.`, targets: pickups };
  }
  if (hasItem("walkman") && hasItem("battery")) return { vague: "Le walkman a enfin de quoi fonctionner.", precise: "Écoute la cabine du tram.", targets: hintTargets("tram", ["tram-panel"], "to-tram") };
  if (hasItem("glasses") && hasItem("journal")) return { vague: "Ce que tu portes se complète.", precise: "Regarde la plaque au sol du tram.", targets: hintTargets("tram", ["drain"], "to-tram") };
  if (hasItem("knife")) return { vague: "Une lame peut venir à bout de ce qui barre un passage.", precise: "Les lianes du local technique, à gauche de la cour.", targets: hintTargets("local", ["vines"], "to-local") };
  if (hasItem("bow")) return { vague: "Quelqu’un attend ce que tu as ramassé.", precise: "Rends l’archet à la musicienne, dans la serre.", targets: hintTargets("greenhouse", ["musician"], "to-greenhouse") };
  if (hasItem("walkman") && !state.helpedMusician) return { vague: "Le walkman a besoin d’énergie, et quelqu’un en a.", precise: "La musicienne de la serre cherche son archet, près des rails.", targets: hintTargets("tram", ["bow"], "to-tram") };
  const unseen = [
    ["alcove", "to-alcove", "Quelque chose a été laissé là où tu t’es réveillé·e.", "Retourne dans l’alcôve, derrière la cour."],
    ["local", "to-local", "Ça sent la rouille, côté gauche.", "Va dans le local technique, à gauche."],
    ["tram", "to-tram", "Les rails vibrent droit devant.", "Avance vers le tram, en face."],
    ["greenhouse", "to-greenhouse", "Quelques notes viennent de la droite.", "Va dans la serre, à droite."]
  ].find(([place]) => !state.visited.has(place));
  if (unseen) return { vague: unseen[2], precise: unseen[3], targets: state.location === "courtyard" ? [unseen[1]] : [state.location === "karmen" ? "go-back" : "back-courtyard"] };
  return { vague: "Tu as presque tout vu. Un objet peut ouvrir un passage.", precise: "Reviens à la cour et tente un autre chemin.", targets: [] };
}

function highlightTargets(ids) {
  window.clearTimeout(state.hintTimer);
  dom.hotspots.querySelectorAll(".hotspot").forEach((button) => button.classList.toggle("hint-target", ids.includes(button.dataset.id)));
  dom.hintButton.classList.add("active");
  state.hintTimer = window.setTimeout(() => {
    dom.hotspots.querySelectorAll(".hint-target").forEach((button) => button.classList.remove("hint-target"));
    dom.hintButton.classList.remove("active");
  }, 4500);
}

function revealHints() {
  const marker = `${state.discoveries.size}|${state.inventory.size}`;
  if (state.hintMarker !== marker) {
    state.hintMarker = marker;
    state.hintLevel = 0;
  }
  state.hintLevel = Math.min(3, state.hintLevel + 1);
  state.hintCount += 1;
  track("hint", { n: state.hintCount, level: state.hintLevel });
  dom.hintButton.classList.remove("nudge");
  const hint = getHint();
  setText(`INDICE ${state.hintLevel}/3 — ${state.hintLevel === 1 ? hint.vague : hint.precise}`);
  if (state.hintLevel === 3) highlightTargets(hint.targets);
}

function armNudge() {
  window.clearTimeout(state.nudgeTimer);
  dom.hintButton.classList.remove("nudge");
  state.nudgeTimer = window.setTimeout(() => dom.hintButton.classList.add("nudge"), 45000);
}

function getElapsed() {
  const seconds = Math.max(1, Math.round((Date.now() - state.startTime) / 1000));
  state.elapsed = seconds;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function getScore() {
  const raw = 38 + state.discoveries.size * 5 + state.visited.size * 2 + state.inventory.size * 2 + (state.helpedMusician ? 8 : 0);
  return clamp(raw, 48, 100);
}

function getProfile() {
  if (state.discoveries.size >= 9 && state.visited.size >= 5) return "L’ÉCLAIREUR·SE";
  if (state.discoveries.size <= 3) return "L’INSTINCTIF·VE";
  if (state.route === "signal") return "L’OREILLE VERTE";
  if (state.helpedMusician) return "L’ALLIÉ·E DU SIGNAL";
  if (state.route === "vines") return "LE PASSE-MURAILLE";
  if (state.route === "sewer") return "L’ŒIL VERT";
  return "L’INSTINCTIF·VE";
}

function getProfileStory() {
  const profile = getProfile();
  const stories = {
    "L’ÉCLAIREUR·SE": "Tu as refusé le premier chemin évident. Tu as exploré, comparé les indices et compris le lieu avant d’entrer.",
    "L’ALLIÉ·E DU SIGNAL": "Tu as trouvé le passage en prenant le temps d’aider quelqu’un. Une partie du morceau n’aurait pas existé sans toi.",
    "LE PASSE-MURAILLE": "Tu avances par les endroits que les autres considèrent comme fermés. Une lame, un passage et aucun détour inutile.",
    "L’ŒIL VERT": "Tu remarques les traces que les autres traversent sans les voir. La ville t’a donné une carte sans jamais te parler.",
    "L’OREILLE VERTE": "Tu as réparé le signal et suivi la voix jusqu’au bout. Pour toi, le son était déjà une direction.",
    "L’INSTINCTIF·VE": "Tu n’avais pas besoin de tout comprendre. Tu as choisi une direction et tu as continué jusqu’à ce qu’elle devienne la bonne."
  };
  return stories[profile];
}

function showResults() {
  getElapsed();
  stopAudio();
  window.clearTimeout(state.nudgeTimer);
  const score = getScore();
  dom.gameScreen.classList.add("hidden");
  dom.resultScreen.classList.remove("hidden");
  dom.resultTitle.textContent = getProfile();
  dom.resultStory.textContent = getProfileStory();
  dom.resultScore.textContent = `${score}%`;
  dom.resultDiscoveries.textContent = `${state.discoveries.size}/${TOTAL_DISCOVERIES}`;
  dom.resultObjects.textContent = `${state.inventory.size}`;
  dom.resultRoute.textContent = routeNames[state.route] || "INCONNU";
  dom.resultTime.textContent = `${Math.floor(state.elapsed / 60)}:${String(state.elapsed % 60).padStart(2, "0")}`;
  sendResult(score);
}

function sendResult(score) {
  state.ended = true;
  track("end", {
    profile: getProfile(),
    score,
    items: Array.from(state.inventory).join(","),
    discoveries: state.discoveries.size,
    visited: Array.from(state.visited).join(","),
    helpedMusician: state.helpedMusician,
    seconds: state.elapsed,
    hints: state.hintCount
  });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawCover(ctx, image, x, y, width, height) {
  const scale = Math.max(width / image.width, height / image.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (image.width - sw) / 2;
  const sy = (image.height - sh) / 2;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(image, sx, sy, sw, sh, x, y, width, height);
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 4) {
  const words = text.split(" ");
  let line = "";
  let lineNumber = 0;
  words.forEach((word, index) => {
    const test = `${line}${word} `;
    if (ctx.measureText(test).width > maxWidth && line && lineNumber < maxLines - 1) {
      ctx.fillText(line.trim(), x, y + lineNumber * lineHeight);
      line = `${word} `;
      lineNumber += 1;
    } else {
      line = test;
    }
    if (index === words.length - 1) ctx.fillText(line.trim(), x, y + lineNumber * lineHeight);
  });
}

async function createStory() {
  dom.shareStatus.textContent = "CRÉATION DE LA STORY…";
  const canvas = dom.storyCanvas;
  const ctx = canvas.getContext("2d");
  const image = await loadImage("assets/px-06.png");
  drawCover(ctx, image, 0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0,0,0,.12)");
  gradient.addColorStop(.45, "rgba(0,0,0,.5)");
  gradient.addColorStop(1, "rgba(0,0,0,.96)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#26fd75";
  ctx.fillRect(70, 72, 14, 330);
  ctx.font = "900 38px Courier New";
  ctx.fillText("SPECTR × KEEP HUSH", 116, 126);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 112px Courier New";
  wrapText(ctx, getProfile(), 72, 1020, 920, 112, 3);

  ctx.fillStyle = "#26fd75";
  ctx.font = "900 190px Courier New";
  ctx.fillText(`${getScore()}%`, 72, 1430);
  ctx.font = "900 34px Courier New";
  ctx.fillText("RÉSONANCE", 76, 1485);

  ctx.fillStyle = "#e8eee9";
  ctx.font = "700 30px Courier New";
  ctx.fillText(`${state.discoveries.size}/${TOTAL_DISCOVERIES} DÉCOUVERTES`, 76, 1570);
  ctx.fillText(routeNames[state.route] || "CHEMIN INCONNU", 76, 1620);

  ctx.strokeStyle = "rgba(38,253,117,.65)";
  ctx.strokeRect(76, 1672, 928, 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 42px Courier New";
  ctx.fillText("KARMEN CAMINA", 76, 1760);
  ctx.fillStyle = "#26fd75";
  ctx.font = "900 32px Courier New";
  ctx.fillText("20.11.2026 — STRASBOURG", 76, 1810);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png", .94));
}

async function shareStory() {
  try {
    const blob = await createStory();
    if (!blob) throw new Error("story");
    const file = new File([blob], "follow-the-green-story.png", { type: "image/png" });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ files: [file], title: "FOLLOW THE GREEN", text: "J’ai suivi mon propre chemin jusqu’au Karmen." });
      dom.shareStatus.textContent = "STORY PRÊTE À ÊTRE PARTAGÉE.";
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "follow-the-green-story.png";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1500);
    dom.shareStatus.textContent = "IMAGE ENREGISTRÉE — AJOUTE-LA À TA STORY.";
  } catch (error) {
    dom.shareStatus.textContent = error?.name === "AbortError" ? "PARTAGE ANNULÉ." : "IMPOSSIBLE DE CRÉER L’IMAGE SUR CE NAVIGATEUR.";
  }
}

function startAudio() {
  if (state.audio || state.muted) return;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  const context = new AudioContext();
  if (context.state === "suspended") context.resume();
  const master = context.createGain();
  master.gain.value = .065;
  master.connect(context.destination);

  // Tout passe par un filtre qui s'ouvre quand le signal devient plus clair.
  const bus = context.createBiquadFilter();
  bus.type = "lowpass";
  bus.frequency.value = 450;
  bus.Q.value = .7;
  bus.connect(master);

  const drone = context.createOscillator();
  const droneGain = context.createGain();
  drone.type = "sine";
  drone.frequency.value = 54;
  droneGain.gain.value = .2;
  drone.connect(droneGain).connect(bus);
  drone.start();

  const layer = (type, freq, filterFreq, lfoHz, lfoDepth) => {
    const osc = context.createOscillator();
    const filter = context.createBiquadFilter();
    const amp = context.createGain();
    const out = context.createGain();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = filterFreq;
    amp.gain.value = .6;
    out.gain.value = 0;
    lfo.frequency.value = lfoHz;
    lfoGain.gain.value = lfoDepth;
    osc.connect(filter).connect(amp).connect(out).connect(bus);
    lfo.connect(lfoGain).connect(amp.gain);
    osc.start();
    lfo.start();
    return out;
  };

  state.audio = {
    context,
    master,
    bus,
    voice: layer("triangle", 330, 1100, .35, .35),
    viola: layer("sawtooth", 147, 700, .22, .3),
    bass: layer("triangle", 55, 400, 1.8, .45)
  };
  state.audioTimer = window.setInterval(playSignalTone, 3400);
  updateAudioLayers();
  playSignalTone();
}

function updateAudioLayers() {
  if (!state.audio) return;
  const { context, bus, voice, viola, bass } = state.audio;
  const now = context.currentTime;
  const final = state.location === "final";
  const set = (node, value) => node.gain.setTargetAtTime(value, now, .5);
  set(voice, hasItem("walkman") ? (final ? .9 : hasItem("battery") || state.route === "signal" ? .6 : .2) : 0);
  set(viola, state.helpedMusician ? (final ? .8 : .5) : state.metMusician ? .15 : 0);
  set(bass, final ? 1 : state.route ? .7 : 0);
  bus.frequency.setTargetAtTime([450, 900, 1800, 3600, 9000][signalStage()], now, .6);
}

function playStageCue(stage) {
  if (!state.audio || state.muted || state.audio.context.state !== "running") return;
  const { context, master } = state.audio;
  const now = context.currentTime;
  const base = [262, 294, 330, 392][Math.max(0, stage - 1)];
  [1, 1.25, 1.5].forEach((ratio, i) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = now + i * .09;
    oscillator.type = "sine";
    oscillator.frequency.value = base * ratio;
    gain.gain.setValueAtTime(.0001, start);
    gain.gain.exponentialRampToValueAtTime(.16, start + .03);
    gain.gain.exponentialRampToValueAtTime(.0001, start + .5);
    oscillator.connect(gain).connect(master);
    oscillator.start(start);
    oscillator.stop(start + .55);
  });
}

function stopAudio() {
  if (!state.audio) return;
  const { context, master } = state.audio;
  window.clearInterval(state.audioTimer);
  master.gain.setTargetAtTime(0, context.currentTime, .5);
  window.setTimeout(() => context.close().catch(() => {}), 2500);
  state.audio = null;
}

function playSignalTone() {
  if (!state.audio || state.muted || state.audio.context.state !== "running") return;
  const { context, bus } = state.audio;
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = state.location === "greenhouse" ? "triangle" : "sine";
  oscillator.frequency.setValueAtTime(state.location === "greenhouse" ? 196 : 146, now);
  oscillator.frequency.exponentialRampToValueAtTime(state.location === "greenhouse" ? 294 : 220, now + .7);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.075 + signalStage() * .012, now + .08);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .9);
  oscillator.connect(gain).connect(bus);
  oscillator.start(now);
  oscillator.stop(now + 1);
}

function toggleSound() {
  if (!state.audio) {
    state.muted = false;
    startAudio();
  } else {
    state.muted = !state.muted;
    state.audio.master.gain.setTargetAtTime(state.muted ? 0 : .065, state.audio.context.currentTime, .03);
    if (!state.muted) state.audio.context.resume();
  }
  dom.soundButton.classList.toggle("off", state.muted);
}

dom.startButton.addEventListener("click", () => begin(true));
dom.silentButton.addEventListener("click", () => begin(false));
dom.soundButton.addEventListener("click", toggleSound);
dom.hintButton.addEventListener("click", revealHints);
dom.shareButton.addEventListener("click", shareStory);
dom.replayButton.addEventListener("click", () => window.location.reload());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    trackLeave();
    if (state.audio) state.audio.context.suspend();
  } else if (state.audio && !state.muted) {
    state.audio.context.resume();
  }
});
window.addEventListener("pagehide", trackLeave);
