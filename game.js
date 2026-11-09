"use strict";

// Colle ici ton URL Google Apps Script si tu souhaites enregistrer les résultats.
const RESULT_ENDPOINT = "";
const TOTAL_DISCOVERIES = 25;

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
  resultPosters: $("#resultPosters"),
  shareButton: $("#shareButton"),
  replayButton: $("#replayButton"),
  shareStatus: $("#shareStatus"),
  storyCanvas: $("#storyCanvas")
};

const itemDefs = {
  walkman: { name: "CASQUE RADIO", sprite: "assets/sprites/walkman.png", inspect: "Un casque radio. Il lui manque une pile pour capter le signal." },
  journal: { name: "CARNET", sprite: "assets/sprites/journal.png", inspect: "Le carnet de tournage. Une carte incomplète mentionne un accès sous les rails." },
  knife: { name: "SÉCATEUR", sprite: "assets/sprites/knife.png", inspect: "Assez solide pour venir à bout des lianes." },
  glasses: { name: "CAMÉRA", sprite: "assets/sprites/glasses.png", inspect: "La caméra Keep Hush. Son viseur fait ressortir les traces vertes invisibles à l’œil nu." },
  bow: { name: "ARCHET", sprite: "assets/sprites/bow.svg", inspect: "L’archet d’un alto, un peu rayé mais encore utilisable." },
  battery: { name: "PILE", sprite: "assets/sprites/battery.svg", inspect: "Une pile presque neuve. Elle pourrait alimenter le casque radio." }
};

const locationDefs = {
  courtyard: { name: "LA COUR", chapter: "17 H · KRUTENAU", image: "assets/scenes/courtyard.png", position: "center" },
  alcove: { name: "LE VAN KEEP HUSH", chapter: "DERRIÈRE TOI", image: "assets/scenes/alcove.png", position: "center" },
  local: { name: "LA RÉGIE", chapter: "À GAUCHE", image: "assets/scenes/local.png", position: "center" },
  tram: { name: "LE TRAM", chapter: "EN FACE", image: "assets/scenes/tram.png", position: "center" },
  greenhouse: { name: "LA SERRE", chapter: "À DROITE", image: "assets/scenes/greenhouse.png", position: "center" },
  karmen: { name: "KARMEN CAMINA", chapter: "LE SIGNAL EST PROCHE", image: "assets/scenes/karmen.png", position: "center" },
  final: { name: "LA SALLE", chapter: "SPECTR × KEEP HUSH", image: "assets/scenes/final.png", position: "center", color: true }
};

const AMBIENT = {
  courtyard: ["Une lumière verte bat au loin, au rythme d’une basse.", "Des lianes ont recouvert les fenêtres. Quelque chose bruisse derrière."],
  alcove: ["Un van, une banquette, des câbles. Le café est froid depuis longtemps.", "Quelqu’un a collé un autocollant vert sur la vitre."],
  local: ["Les tuyaux vibrent très légèrement. Quelqu’un a déjà écouté ici.", "Des câbles disparaissent sous la végétation, vers la salle."],
  tram: ["Le tram n’ira plus nulle part. Ses vitres gardent pourtant une lueur.", "Les rails sont tièdes. Une basse circule dessous."],
  greenhouse: ["Les vitres captent la lune. Chaque feuille tremble sur le même tempo.", "Une odeur d’orage et de terre. La serre respire."],
  karmen: ["Les lettres du néon grésillent en rythme. Le lieu t’attend.", "Une affiche à moitié décollée : 20.11."],
  final: ["Tu ne sais plus si tu entends la salle ou si c’est elle qui t’entend.", "Le vert est partout. Il ne fait plus peur."]
};

const POSTERS = {
  keephush: { title: "KEEP HUSH", tag: "Local dancefloors, worldwide. Back the Underground.", text: "Média londonien de la scène underground. Des sets filmés pour faire découvrir des artistes et des scènes locales du monde entier, et montrer l’ambiance des soirées." },
  spectr: { title: "SPECTR", tag: "« From Soul to Jungle » · bar · 19 h–21 h · accès libre", text: "Une association strasbourgeoise qui fait découvrir les musiques UK : UK garage, drum & bass, jungle, dubstep, bass music, avec des influences caribéennes. Une bande de potes, pour que de nouvelles oreilles découvrent le style." },
  gtk: { title: "GTK", tag: "Membre de SPECTR · Room Gallery", text: "Plus de dix ans de passion pour la culture UK. Du UK garage aux multiples facettes de la bass music, sans jamais perdre les racines du club britannique." },
  aoujsenorita: { title: "AOÛJ B2B SEÑORITA", tag: "Deux univers derrière les platines · Room Gallery", text: "Aoûj, en résidence chez Zest Radio, explore les passerelles entre scènes afro-électroniques et musiques nord-africaines, de la batida au gqom. Señorita, membre de Seul Amour, apporte ses influences rap et hip-hop." },
  noli: { title: "NOLI", tag: "Live alto · Londres · Room Gallery", text: "Altiste et DJ, membre du collectif Tokio Station, où le jazz live rencontre la jungle. Son alto, plus chaud et plus profond que le violon, se mêle aux rythmiques de la jungle. Passée par Outlook Origins 2026 et le Southbank Centre." },
  driia: { title: "DRIIA", tag: "Londres · Room Gallery", text: "Artiste, DJ et productrice, entre jungle, breakbeat, drum & bass et influences alternatives. Repérée par BBC Radio 1." },
  karmen: { title: "KARMEN CAMINA", tag: "Strasbourg · Krutenau · 20.11.2026", text: "Lieu culturel de la manufacture de tabac, pour montrer tous les spectres de la musique, avec une sonorisation spatialisée. Un lieu inclusif et respectueux : ici, l’acceptation de l’autre est obligatoire." }
};

const routeNames = {
  vines: "LE PASSAGE DE SERVICE",
  signal: "LA VOIX DE DRIIA",
  sewer: "LES MARQUES SOUS LES RAILS"
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
  nudgeTimer: null,
  typeTimer: null,
  fullText: "",
  ambient: 0
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
  window.clearInterval(state.typeTimer);
  state.fullText = text;
  const calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (calm) {
    dom.dialogueText.textContent = text;
    return;
  }
  let shown = 0;
  dom.dialogueText.textContent = "";
  state.typeTimer = window.setInterval(() => {
    shown += 2;
    dom.dialogueText.textContent = text.slice(0, shown);
    if (shown >= text.length) window.clearInterval(state.typeTimer);
  }, 18);
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
  const scaled = kind === "object-hotspot" ? `${Math.round(parseFloat(size) * 1.35)}px` : size;
  return { id, label, sprite, x, y, size: scaled, kind, action };
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

function posterCount() {
  return Array.from(state.discoveries).filter((id) => id.startsWith("poster-")).length;
}

function posterSpot(id, x, y) {
  return objectSpot(`poster-${id}`, "Lire l’affiche", "assets/sprites/poster.png", x, y, "34px", () => openPoster(id));
}

function openPoster(id) {
  const poster = POSTERS[id];
  if (!state.discoveries.has(`poster-${id}`)) track("poster", { id });
  discover(`poster-${id}`, 4);
  $("#posterTitle").textContent = poster.title;
  $("#posterTag").textContent = poster.tag;
  $("#posterText").textContent = poster.text;
  $("#posterCount").textContent = `AFFICHES ${posterCount()}/${Object.keys(POSTERS).length}`;
  $("#posterModal").classList.remove("hidden");
}

function renderCourtyard(overrideText) {
  const firstVisit = state.visited.size <= 1;
  setText(overrideText || (firstVisit
    ? "17 h. La Krutenau. La manufacture de tabac a disparu sous les feuilles. Un morceau passe quelque part, étouffé, comme à travers un mur. Il en manque des bouts. Suis le vert."
    : "La cour relie tous les chemins : la régie à gauche, le tram en face, la serre à droite, le van derrière toi."));
  renderHotspots([
    navSpot("to-local", "Aller à gauche", "left", "7%", "55%", "72px", "260px", () => goTo("local")),
    navSpot("to-tram", "Avancer vers le tram", "up", "50%", "30%", "210px", "92px", () => goTo("tram")),
    navSpot("to-greenhouse", "Aller à droite", "right", "93%", "55%", "72px", "260px", () => goTo("greenhouse")),
    navSpot("to-alcove", "Revenir sur tes pas", "down", "50%", "94%", "220px", "64px", () => goTo("alcove")),
    posterSpot("keephush", "24%", "36%")
  ]);
}

function renderAlcove(overrideText) {
  const spots = [];
  if (!hasItem("walkman")) {
    spots.push(objectSpot("walkman", "Prendre le casque radio", itemDefs.walkman.sprite, "72%", "73%", "38px", () => {
      addItem("walkman", "Un casque radio : il capte quelque chose de très faible, mais sans pile, impossible d’écouter.");
    }));
  }
  if (!hasItem("journal")) {
    spots.push(objectSpot("journal", "Ramasser le carnet", itemDefs.journal.sprite, "34%", "61%", "36px", () => {
      addItem("journal", "Le carnet de tournage. Plusieurs pages manquent, mais une carte indique quelque chose sous les rails.");
    }));
  }
  spots.push(posterSpot("spectr", "50%", "28%"));
  spots.push(navSpot("back-courtyard", "Retourner dans la cour", "back", "50%", "94%", "220px", "64px", () => goTo("courtyard")));
  setText(overrideText || (!hasItem("walkman") || !hasItem("journal")
    ? "Le van Keep Hush, porte ouverte. Sur la banquette : un carnet de tournage et un casque radio sans pile."
    : "Tu as fouillé le van. Il reste une odeur de câbles et de café froid."));
  renderHotspots(spots);
}

function renderLocal(overrideText) {
  const spots = [];
  if (!hasItem("knife")) {
    spots.push(objectSpot("knife", "Prendre le sécateur", itemDefs.knife.sprite, "61%", "68%", "38px", () => {
      addItem("knife", "Un sécateur oublié sur l’établi. Parfait pour éclaircir un passage.");
    }));
  }
  if (!state.discoveries.has("local-panel")) {
    spots.push(objectSpot("local-panel", "Examiner l’armoire électrique", "assets/sprites/panel.png", "34%", "40%", "42px", inspectLocalPanel));
  }
  spots.push(posterSpot("gtk", "62%", "40%"));
  spots.push(objectSpot("regie", "Parler à la régie", "assets/sprites/regie.png", "22%", "66%", "96px", talkRegie, "person-hotspot"));
  spots.push(objectSpot("vines", "Essayer le passage envahi", "assets/sprites/vine.png", "84%", "33%", "54px", tryVines, "path-hotspot"));
  spots.push(navSpot("back-courtyard", "Retourner dans la cour", "back", "50%", "94%", "220px", "64px", () => goTo("courtyard")));
  setText(overrideText || "La régie de la manufacture. Ça sent la rouille et le café. Derrière les machines, des lianes recouvrent une ouverture.");
  renderHotspots(spots);
}

function inspectLocalPanel() {
  discover("local-panel", 5);
  renderLocal("L’armoire est hors service, mais son aiguille bouge à chaque basse. Le signal passe derrière les lianes.");
}

function tryVines() {
  if (!hasItem("knife")) {
    trackBlocked("vines", "knife");
    renderLocal("Les tiges sont trop épaisses pour être arrachées. Il te faut un outil.");
    return;
  }
  markRoute("vines");
  state.originBeforeKarmen = "local";
  discover("route-vines", 12);
  goTo("karmen", "Les lianes cèdent une à une. Derrière, un ancien passage de service : les murs vibrent au rythme des basses.");
}

function regieMenu(intro) {
  const choices = [];
  if (!state.discoveries.has("regie-lore")) {
    choices.push({ label: "ET LE BAR CE SOIR ?", action: () => {
      discover("regie-lore", 6);
      regieMenu("LA RÉGIE — « À 19 h, au bar, c’est nous : un set “From Soul to Jungle”, accès libre. Et la nuit, la Room Gallery prend le relais. »");
    } });
  }
  choices.push({ label: "UN CONSEIL ?", action: () => {
    track("hint", { n: state.hintCount, level: "regie" });
    regieMenu(`LA RÉGIE — « ${getHint().vague} »`);
  } });
  choices.push({ label: "LAISSER TRAVAILLER", action: () => renderLocal() });
  setText(intro);
  setChoices(choices);
}

function talkRegie() {
  discover("met-regie", 5);
  regieMenu(state.discoveries.has("regie-lore")
    ? "LA RÉGIE — « Toujours là ? Tant mieux. Ça fait du monde à la régie. »"
    : "LA RÉGIE — « Ah, enfin quelqu’un de chez Keep Hush ! Moi, je suis de SPECTR. On est une bande de potes : on a monté l’asso pour faire découvrir le UK garage, la jungle, la drum & bass, la bass… et un peu de Caraïbes aussi. »");
}

function renderTram(overrideText) {
  const spots = [];
  const powered = hasItem("walkman") && hasItem("battery");
  if (!hasItem("bow") && !state.helpedMusician) {
    spots.push(objectSpot("bow", "Ramasser l’objet entre les rails", itemDefs.bow.sprite, "25%", "86%", "36px", () => {
      addItem("bow", "Un archet d’alto, coincé entre les rails. Quelqu’un doit le chercher.");
    }));
  }
  if (powered) {
    spots.push(objectSpot("driia", "Parler à DRIIA", "assets/sprites/driia.png", "61%", "64%", "104px", talkDriia, "person-hotspot"));
  } else {
    spots.push(objectSpot("tram-panel", "Écouter la cabine", "assets/sprites/panel.png", "61%", "67%", "44px", inspectTramPanel));
  }
  spots.push({ id: "drain", label: "Examiner la plaque au sol", x: "79%", y: "84%", width: "82px", height: "70px", kind: "embedded-hotspot", action: inspectDrain });
  spots.push(posterSpot("aoujsenorita", "16%", "62%"));
  spots.push(navSpot("back-courtyard", "Retourner dans la cour", "back", "50%", "94%", "220px", "64px", () => goTo("courtyard")));
  setText(overrideText || (powered
    ? "La pile a réveillé le casque : la voix qui chantait derrière la vitre est maintenant parfaitement claire."
    : "Le tram est immobile. De la cabine, une voix étouffée passe à travers la vitre. Quelque chose brille entre les rails."));
  renderHotspots(spots);
}

function inspectTramPanel() {
  if (hasItem("walkman") && hasItem("battery")) return talkDriia();
  if (hasItem("walkman")) {
    trackBlocked("tram-panel", "battery");
    renderTram("La prise du casque réagit au grésillement. Quelqu’un chante, mais le casque n’a toujours pas de pile.");
    return;
  }
  trackBlocked("tram-panel", "walkman");
  renderTram("Un câble audio sort de la console. Quelqu’un chante derrière la vitre, trop bas pour que tu l’entendes. Il te faut de quoi écouter.");
}

function driiaMenu(intro) {
  const choices = [];
  if (!state.discoveries.has("driia-who")) {
    choices.push({ label: "TU VIENS D’OÙ ?", action: () => {
      discover("driia-who", 5);
      driiaMenu("DRIIA — « De Londres. Jungle, breakbeat, drum & bass… et un peu d’alternatif. Tout se mélange, non ? »");
    } });
  }
  choices.push({ label: "SUIVRE SA VOIX", action: followDriia });
  choices.push({ label: "PLUS TARD", action: () => renderTram() });
  setText(intro);
  setChoices(choices);
}

function talkDriia() {
  driiaMenu("DRIIA — « Hey ! Tu captes ça, toi aussi ? Je cherche le bon break pour poser ma voix. »");
}

function followDriia() {
  markRoute("signal");
  state.originBeforeKarmen = "tram";
  discover("route-signal", 14);
  goTo("karmen", "DRIIA — « Follow the green. On se retrouve en bas. » Sa voix te guide jusqu’à une porte du Karmen.");
}

function inspectDrain() {
  if (hasItem("glasses") && hasItem("journal")) {
    markRoute("sewer");
    state.originBeforeKarmen = "tram";
    discover("route-sewer", 13);
    goTo("karmen", "Le viseur révèle les mêmes marques que sur la carte du carnet. Sous la plaque, un tunnel rejoint le Karmen.");
    return;
  }
  if (hasItem("glasses")) {
    trackBlocked("drain", "journal");
    discover("green-marks", 5);
    renderTram("Dans le viseur, des marques vertes apparaissent sur le métal. On dirait un fragment de plan.");
    return;
  }
  if (hasItem("journal")) {
    trackBlocked("drain", "glasses");
    renderTram("Le carnet mentionne cette plaque, mais les indications sont illisibles à l’œil nu.");
    return;
  }
  trackBlocked("drain", "glasses+journal");
  renderTram("Une plaque rouillée, solidement fermée. Rien ne permet encore de comprendre son utilité.");
}

function renderGreenhouse(overrideText) {
  const spots = [];
  if (!hasItem("glasses")) {
    spots.push(objectSpot("glasses", "Prendre la caméra", itemDefs.glasses.sprite, "27%", "76%", "36px", () => {
      addItem("glasses", "La caméra Keep Hush. Dans le viseur, certaines traces vertes deviennent très nettes.");
    }));
  }
  spots.push(objectSpot("musician", "Parler à Noli", "assets/sprites/noli.png", "72%", "56%", "104px", talkMusician, "person-hotspot"));
  spots.push(posterSpot("noli", "14%", "24%"));
  spots.push(navSpot("back-courtyard", "Retourner dans la cour", "back", "50%", "94%", "220px", "64px", () => goTo("courtyard")));
  setText(overrideText || (state.helpedMusician
    ? "Noli tire une note grave de son alto. Les feuilles se tendent vers elle et le son file jusque sous la ville."
    : "Dans la serre, les plantes bougent en rythme. Une personne joue de l’alto sans archet, en pinçant les cordes du bout des doigts."));
  renderHotspots(spots);
}

function musicianMenu(intro) {
  const choices = [];
  if (hasItem("bow") && !state.helpedMusician) choices.push({ label: "LUI RENDRE L’ARCHET", action: returnBow });
  if (state.helpedMusician && !state.discoveries.has("musician-note")) choices.push({ label: "ÉCOUTER LA NOTE JUSQU’AU BOUT", action: listenToMusician });
  [
    ["noli-alto", "C’EST QUOI, UN ALTO ?", askAboutMusic],
    ["noli-tokio", "TOKIO STATION ?", askWho],
    ["noli-tonight", "ET CE SOIR ?", askPlace]
  ].forEach(([id, label, action]) => {
    if (!state.discoveries.has(id)) choices.push({ label, action });
  });
  setText(intro);
  setChoices([...choices.slice(0, 3), { label: "REPARTIR EXPLORER", action: () => renderGreenhouse() }]);
}

function talkMusician() {
  if (!state.metMusician) {
    state.metMusician = true;
    discover("met-musician", 5);
    musicianMenu(hasItem("bow")
      ? "NOLI — « Mon archet… Tu l’as trouvé entre les rails ? Je jouais en pizz depuis une heure, mon alto faisait la moue. »"
      : "NOLI — « Tu l’entends, toi aussi ? Les plantes suivent le tempo. Mais j’ai perdu mon archet près du tram. Sans lui, mon alto ne chante qu’à moitié. »");
    return;
  }
  if (state.helpedMusician) return musicianMenu("NOLI — « Merci encore. Ce soir, je viens avec mon alto : du mix et du live. »");
  musicianMenu(hasItem("bow")
    ? "NOLI — « C’est bien lui. Donne-le-moi, tu veux ? »"
    : "NOLI — « Entre les rails, je te dis. Il brille un peu quand le signal passe. »");
}

function askAboutMusic() {
  discover("noli-alto", 6);
  musicianMenu("NOLI — « Le cousin du violon, en plus grave et plus chaud. On le confond tout le temps. Moi, je le trouve parfait avec une jungle bien sombre. »");
}

function askWho() {
  discover("noli-tokio", 5);
  musicianMenu("NOLI — « Un collectif où le jazz live rencontre la jungle. On joue vraiment ensemble. »");
}

function askPlace() {
  discover("noli-tonight", 5);
  musicianMenu("NOLI — « Je viens avec mon alto, pour un set entre mix et live : des mélodies aériennes et des sons plus sombres. Viens voir. »");
}

function returnBow() {
  removeItem("bow");
  state.helpedMusician = true;
  discover("help-musician", 12);
  state.inventory.add("battery");
  updateInventory();
  setText("NOLI — « Merci. Tiens, une pile pour ton casque. Il y a de l’ombre et de la lumière dans ce morceau. Il faut les deux. » Une note grave traverse la serre.");
  setChoices([
    { label: "ÉCOUTER", action: listenToMusician },
    { label: "REPARTIR AVEC LA PILE", action: () => renderGreenhouse() }
  ]);
}

function listenToMusician() {
  discover("musician-note", 7);
  renderGreenhouse("La note tenue fait vibrer le casque et les rails au même moment. Tout vient du même endroit.");
}

function renderKarmen(overrideText) {
  const entryLabels = { vines: "Entrer par le passage de service", signal: "Suivre la voix jusqu’à la porte", sewer: "Remonter sous la salle" };
  const entrySprites = { vines: "assets/sprites/vine.png", signal: "assets/sprites/door.png", sewer: "assets/sprites/sewer.png" };
  const entryPositions = { vines: ["73%", "41%"], signal: ["29%", "66%"], sewer: ["67%", "84%"] };
  const [x, y] = entryPositions[state.route] || ["45%", "62%"];
  setText(overrideText || "Les lettres du néon grésillent en rythme. Ici, on vient pour la musique, et chaque personne est la bienvenue. Le signal est tout près.");
  renderHotspots([
    objectSpot("enter-karmen", entryLabels[state.route] || "Entrer", entrySprites[state.route] || "assets/sprites/door.png", x, y, "62px", enterKarmen, "path-hotspot"),
    posterSpot("karmen", "45%", "62%"),
    navSpot("go-back", "Revenir sur tes pas", "back", "50%", "94%", "220px", "64px", () => goTo(state.originBeforeKarmen))
  ]);
}

function enterKarmen() {
  goTo("final", "Le morceau explose. L’alto, la voix et le break ne formaient qu’un seul signal.");
}

function renderFinal(overrideText) {
  setText(overrideText || "Tu ne sais plus si tu entends la salle ou si c’est elle qui t’entend. Le vert est partout. Il ne fait plus peur.");
  renderHotspots([
    objectSpot("profile", "Découvrir mon profil", "assets/sprites/waveform.png", "50%", "60%", "76px", showResults, "path-hotspot"),
    posterSpot("driia", "50%", "26%")
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
  if (hasItem("walkman") && hasItem("battery")) return { vague: "Le casque a enfin de quoi fonctionner.", precise: "Écoute la cabine du tram : quelqu’un y chante.", targets: hintTargets("tram", ["driia"], "to-tram") };
  if (hasItem("glasses") && hasItem("journal")) return { vague: "Ce que tu portes se complète.", precise: "Regarde la plaque au sol du tram.", targets: hintTargets("tram", ["drain"], "to-tram") };
  if (hasItem("knife")) return { vague: "Un outil peut venir à bout de ce qui barre un passage.", precise: "Les lianes de la régie, à gauche de la cour.", targets: hintTargets("local", ["vines"], "to-local") };
  if (hasItem("bow")) return { vague: "Quelqu’un attend ce que tu as ramassé.", precise: "Rends l’archet à Noli, dans la serre.", targets: hintTargets("greenhouse", ["musician"], "to-greenhouse") };
  if (hasItem("walkman") && !state.helpedMusician) return { vague: "Le casque a besoin d’énergie, et quelqu’un en a.", precise: "Noli, dans la serre, cherche son archet : il doit être près des rails.", targets: hintTargets("tram", ["bow"], "to-tram") };
  const unseen = [
    ["alcove", "to-alcove", "Le van Keep Hush est resté ouvert, derrière la cour.", "Retourne au van, derrière la cour."],
    ["local", "to-local", "Ça sent la rouille, côté gauche.", "Va à la régie, à gauche."],
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
  const stories = {
    "L’ÉCLAIREUR·SE": "Tu as pris le temps de tout regarder : les affiches, les voix, les recoins. Tu arrives au Karmen en sachant déjà qui joue ce soir.",
    "L’ALLIÉ·E DU SIGNAL": "Tu as rendu son archet à Noli. Sans toi, le morceau n’aurait pas eu son alto.",
    "LE PASSE-MURAILLE": "Tu avances par les passages que les autres jugent fermés. Un sécateur, une régie, aucun détour inutile.",
    "L’ŒIL VERT": "Tu repères les marques que les autres traversent sans les voir. Le viseur Keep Hush, c’est toi.",
    "L’OREILLE VERTE": "Tu as suivi la voix de DRIIA jusqu’au bout. Pour toi, le son était déjà une direction.",
    "L’INSTINCTIF·VE": "Tu n’avais pas besoin de tout comprendre. Tu as choisi une direction et tu as continué jusqu’à ce qu’elle devienne la bonne."
  };
  return stories[getProfile()];
}

function showResults() {
  getElapsed();
  if (state.audio) state.audio.master.gain.setTargetAtTime(.55, state.audio.context.currentTime, .5);
  window.setTimeout(stopAudio, 25000);
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
  dom.resultPosters.textContent = `${posterCount()}/${Object.keys(POSTERS).length}`;
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
    hints: state.hintCount,
    posters: posterCount()
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
  const image = await loadImage("assets/scenes/final.png");
  ctx.imageSmoothingEnabled = false;
  drawCover(ctx, image, 0, 0, canvas.width, canvas.height);

  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "rgba(0,0,0,.12)");
  gradient.addColorStop(.45, "rgba(0,0,0,.5)");
  gradient.addColorStop(1, "rgba(0,0,0,.96)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  try {
    const logo = await loadImage("assets/logo-spectr-kh.png");
    ctx.drawImage(logo, 70, 70, 620, 620 * logo.height / logo.width);
  } catch (error) {
    ctx.fillStyle = "#26fd75";
    ctx.font = "900 38px Courier New";
    ctx.fillText("SPECTR × KEEP HUSH", 76, 126);
  }

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
  ctx.fillText(`${posterCount()}/${Object.keys(POSTERS).length} AFFICHES · ${state.discoveries.size} DÉCOUVERTES`, 76, 1570);
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
      await navigator.share({ files: [file], title: "FOLLOW THE GREEN", text: "J’ai suivi le vert jusqu’au Karmen Camina. 20.11 · SPECTR × KEEP HUSH" });
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

const MUSIC = { explore: "assets/audio/explore.mp3", riser: "assets/audio/riser.mp3", drop: "assets/audio/drop.mp3" };

function startAudio() {
  if (state.audio || state.muted) return;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  if (context.state === "suspended") context.resume();
  const master = context.createGain();
  master.gain.value = .9;
  master.connect(context.destination);
  const bus = context.createBiquadFilter();
  bus.type = "lowpass";
  bus.frequency.value = 500;
  bus.Q.value = .7;
  bus.connect(master);
  const audio = { context, master, bus, buffers: {}, current: null, source: null, gain: null };
  state.audio = audio;
  Object.entries(MUSIC).forEach(([name, url]) => {
    fetch(url)
      .then((response) => response.arrayBuffer())
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        audio.buffers[name] = buffer;
        if (state.audio === audio) updateAudioLayers();
      })
      .catch(() => {});
  });
}

function playTrack(name) {
  const audio = state.audio;
  if (!audio || audio.current === name || !audio.buffers[name]) return;
  const { context, bus } = audio;
  const now = context.currentTime;
  if (audio.gain) {
    const oldGain = audio.gain;
    const oldSource = audio.source;
    oldGain.gain.setTargetAtTime(0, now, .25);
    window.setTimeout(() => { try { oldSource.stop(); } catch (error) { /* déjà arrêté */ } }, 1500);
  }
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = audio.buffers[name];
  source.loop = true;
  gain.gain.value = 0;
  source.connect(gain).connect(bus);
  source.start(now);
  gain.gain.setTargetAtTime(1, now, .15);
  audio.current = name;
  audio.source = source;
  audio.gain = gain;
}

function updateAudioLayers() {
  const audio = state.audio;
  if (!audio) return;
  const now = audio.context.currentTime;
  const place = state.location;
  playTrack(place === "final" ? "drop" : place === "karmen" ? "riser" : "explore");
  audio.bus.frequency.setTargetAtTime([500, 1000, 2200, 4500, 20000][signalStage()], now, .6);
  if (!state.muted) audio.master.gain.setTargetAtTime(place === "final" ? 1 : [.8, .9, 1, 1.05, 1.05][signalStage()], now, .4);
}

function playStageCue(stage) {
  const audio = state.audio;
  if (!audio || state.muted || audio.context.state !== "running") return;
  const { context, master } = audio;
  const now = context.currentTime;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * .7), context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.Q.value = 3;
  filter.frequency.setValueAtTime(300 * stage, now);
  filter.frequency.exponentialRampToValueAtTime(5000, now + .6);
  gain.gain.setValueAtTime(.0001, now);
  gain.gain.exponentialRampToValueAtTime(.3, now + .15);
  gain.gain.exponentialRampToValueAtTime(.0001, now + .7);
  source.connect(filter).connect(gain).connect(master);
  source.start(now);
}

function stopAudio() {
  const audio = state.audio;
  if (!audio) return;
  state.audio = null;
  audio.master.gain.setTargetAtTime(0, audio.context.currentTime, .6);
  window.setTimeout(() => audio.context.close().catch(() => {}), 3000);
}

function toggleSound() {
  if (!state.audio) {
    state.muted = false;
    startAudio();
  } else {
    state.muted = !state.muted;
    state.audio.master.gain.setTargetAtTime(state.muted ? 0 : 1, state.audio.context.currentTime, .03);
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
dom.dialogueText.addEventListener("click", () => {
  window.clearInterval(state.typeTimer);
  dom.dialogueText.textContent = state.fullText;
});
dom.scene.addEventListener("click", (event) => {
  if (!state.started || state.ended || event.target.closest(".hotspot")) return;
  const lines = AMBIENT[state.location];
  if (!lines) return;
  state.ambient += 1;
  setText(lines[state.ambient % lines.length]);
});
$("#posterClose").addEventListener("click", () => $("#posterModal").classList.add("hidden"));
$("#posterModal").addEventListener("click", (event) => {
  if (event.target.id === "posterModal") $("#posterModal").classList.add("hidden");
});
$("#ticketButton").addEventListener("click", () => track("ticket_click"));
