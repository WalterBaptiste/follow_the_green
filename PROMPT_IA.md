# Prompt à transmettre à une IA

Copie-colle le texte ci-dessous en joignant le ZIP ou les fichiers du jeu.

---

Je souhaite que tu m'aides à continuer et améliorer un jeu web point-and-click nommé **FOLLOW THE GREEN**, conçu pour une soirée **SPECTR × KEEP HUSH** au **Karmen Camina à Strasbourg, le 20 novembre 2026**.

## Contexte du projet

SPECTR est un collectif strasbourgeois tourné vers les musiques UK : UK Garage, Jungle, Drum & Bass, Bass, Grime et styles associés. Keep Hush est un média et format de fête filmant les artistes au plus près du public. Sa couleur principale est le vert acide **#26FD75**.

Le jeu doit servir de teaser immersif pour la soirée. Il ne doit pas ressembler à une simple succession de questions : la personne doit avoir l'impression d'explorer librement un lieu étrange, de découvrir certains éléments ou de pouvoir complètement passer à côté.

## Direction artistique

- Ambiance de vieux jeu d'aventure et point-and-click, en pixel art ou avec des photographies très fortement pixelisées.
- Palette sombre : noir, gris, vert très foncé et vert Keep Hush **#26FD75** comme fil conducteur.
- Rendu brut, mystérieux, underground et crédible ; éviter l'aspect générique ou manifestement généré par IA.
- Interface lisible sur téléphone, principalement en format vertical.
- Les textes et boutons doivent rester suffisamment grands.
- Les objets cliquables doivent être intégrés naturellement au décor : pas de gros ronds verts ni d'indications trop évidentes.
- Un bouton `?` peut révéler brièvement les zones interactives pour les personnes bloquées.

## Principe actuel du jeu

La personne se réveille dans un environnement urbain envahi par la végétation. Elle entend un signal sonore lointain composé d'une voix, d'une viole et de basses. La cour centrale sert de hub et permet d'aller à gauche, à droite, en face ou de revenir en arrière. Le joueur peut revisiter librement les lieux et conserve ses objets.

### Lieux actuels

1. **Cour centrale** : point de départ et carrefour entre tous les chemins.
2. **Alcôve du réveil** : contient un walkman sans pile et un journal avec une carte incomplète.
3. **Local technique** : contient un couteau, un panneau à examiner et un passage recouvert de lianes.
4. **Tram immobile** : contient un archet perdu, une cabine qui grésille et une plaque au sol.
5. **Serre envahie** : contient des lunettes polarisées et une musicienne qui a perdu son archet.
6. **Karmen Camina** : point de convergence des différents itinéraires.
7. **Scène finale** : le signal est retrouvé pendant la soirée SPECTR × KEEP HUSH.

## Objets et logique

- **Couteau** : permet de couper les lianes et d'ouvrir un passage de service.
- **Walkman** : inutilisable sans pile.
- **Archet** : peut être rendu à la musicienne.
- **Pile** : donnée par la musicienne en échange de l'archet ; elle active le walkman et révèle un trajet sonore.
- **Journal** : contient une carte indiquant quelque chose sous les rails.
- **Lunettes polarisées** : révèlent des marques vertes invisibles à l'œil nu.

## Trois chemins possibles vers la fin

1. **Chemin des lianes** : récupérer le couteau, couper les lianes du local technique et rejoindre le passage de service.
2. **Chemin du signal** : récupérer le walkman, retrouver l'archet, aider la musicienne, obtenir la pile, puis écouter la cabine du tram.
3. **Chemin sous les rails** : récupérer le journal et les lunettes, puis identifier et ouvrir le passage caché sous le tram.

Un joueur peut explorer beaucoup ou aller presque directement à la fin. Les objets manquants doivent réellement bloquer certains passages, avec un message cohérent, sans casser la partie.

## Rencontre et narration

La musicienne est un PNJ optionnel. Le joueur peut lui parler, en apprendre davantage sur la viole et le signal, l'aider en retrouvant son archet ou l'ignorer. Ce choix doit influencer les découvertes et le profil final.

La narration doit rester concise et intrigante. Elle suggère ce qui s'est passé sans tout expliquer. L'objectif est que deux personnes puissent terminer le jeu avec des parcours et des niveaux de compréhension différents.

## Fin et partage

À la fin, le jeu calcule un profil selon le comportement réel du joueur : exploration, aide apportée, objets trouvés et chemin utilisé. Les profils actuellement prévus sont notamment :

- L'ÉCLAIREUR·SE
- L'ALLIÉ·E DU SIGNAL
- LE PASSE-MURAILLE
- L'ŒIL VERT
- L'OREILLE VERTE
- L'INSTINCTIF·VE

Le résultat affiche aussi un pourcentage de résonance, le nombre de découvertes, les objets, le chemin et le temps. Un bouton génère une image verticale personnalisée à partager en Story Instagram.

## Contraintes techniques

- Le projet doit rester compatible avec GitHub Pages.
- Il est réalisé en **HTML, CSS et JavaScript vanilla**, sans framework ni dépendance.
- `index.html` doit rester à la racine du dépôt.
- Tous les chemins vers les images doivent rester relatifs.
- Le jeu doit fonctionner sur mobile et ordinateur.
- Il ne faut pas casser les déplacements, l'inventaire, les trois chemins, le profil final ni la création de la Story.
- Les résultats peuvent être envoyés à Google Sheets avec l'URL Apps Script définie dans `RESULT_ENDPOINT` au début de `game.js`.
- Travaille à partir des fichiers existants et modifie seulement ce qui est nécessaire, plutôt que de tout réécrire sans raison.

## Priorités et état d'avancement

**Objectif prioritaire** : maximiser le nombre de personnes qui terminent le jeu. Gagner est secondaire. Tout le monde obtient un profil valorisant (le pourcentage de résonance ne punit jamais, minimum 48 %). Durée cible : 5 à 8 minutes sur téléphone ; le parcours le plus court fait 5 clics.

Déjà en place :
- **Mesure des abandons** : événements anonymes envoyés à Google Sheets (`start`, `location`, `first_item`, `route`, `blocked`, `hint`, `signal_stage`, `leave`, `end`) avec un identifiant de session aléatoire. Script de réception : `apps-script/Code.gs`.
- **Aide progressive** (bouton `?`) : indice vague, puis précis, puis mise en évidence des seules zones utiles. Le niveau repart à zéro à chaque progression. Aucun effet sur le score. Le `?` pulse après 45 s d'inactivité.
- **Progression du signal** : la jauge a des paliers ; l'image s'éclaircit et le grain recule ; un signal sonore se précise (filtre qui s'ouvre, voix avec le walkman, viole avec la musicienne, basses avec un chemin débloqué). Le signal monte à 80 % au Karmen et à 100 % à la scène finale.
- **Profils** : les six sont atteignables (INSTINCTIF·VE = 3 découvertes ou moins).

À faire : **tirage au sort** (2 gagnants × 2 places, parmi les personnes ayant terminé) avec champ pseudo Instagram ou e-mail, case de consentement (usage limité au tirage, suppression après), page `reglement.html` et enregistrement séparé des événements pour ne pas relier comportement et identité.

Règles de travail : avant de coder, pose tes questions et propose un plan. Donne seulement les fichiers modifiés et liste ce que tu as testé. Aucune impasse n'est possible. Le son ne démarre qu'après un tap.

## Ce que j'attends de toi

Commence par lire tous les fichiers fournis et résume précisément le fonctionnement actuel. Ensuite, propose les améliorations demandées en indiquant leur impact sur l'histoire, l'interface et la logique du jeu. Si je te demande de coder une modification, fournis-moi une version complète et directement fonctionnelle, vérifie qu'aucune erreur JavaScript n'empêche le bouton de démarrage ou les interactions de fonctionner, puis redonne-moi un dossier prêt pour GitHub Pages.

---
