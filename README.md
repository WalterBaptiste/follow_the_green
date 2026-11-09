# FOLLOW THE GREEN

Jeu point-and-click non linéaire conçu pour **SPECTR × KEEP HUSH** au **Karmen Camina**, le **20 novembre 2026**.

Le jeu fonctionne uniquement avec HTML, CSS et JavaScript : aucune installation et aucun build ne sont nécessaires.

## Mettre le jeu sur GitHub Pages

1. Crée un nouveau dépôt GitHub public.
2. Dans le dépôt, clique sur **Add file**, puis **Upload files**.
3. Dépose directement le contenu de ce dossier. `index.html` doit être à la racine du dépôt, pas dans un sous-dossier.
4. Clique sur **Commit changes**.
5. Ouvre **Settings**, puis **Pages**.
6. Dans **Build and deployment**, choisis **Deploy from a branch**.
7. Sélectionne la branche **main**, le dossier **/(root)**, puis clique sur **Save**.
8. GitHub affichera ensuite l'adresse publique du jeu, généralement sous cette forme :
   `https://TON-PSEUDO.github.io/NOM-DU-DEPOT/`

## Organisation des fichiers

- `index.html` : structure des trois écrans du jeu.
- `styles.css` : esthétique, responsive et mise en page.
- `game.js` : histoire, objets, déplacements, profils et export Story.
- `assets/` : `scenes/` (décors), `sprites/` (objets et personnages), `audio/` (extraits MP3 du morceau), logos Keep Hush et SPECTR × KEEP HUSH.
- `tools/` : scripts Python qui génèrent les décors et les sprites.
- `apps-script/Code.gs` : script Google Sheets qui reçoit les événements (à coller dans Apps Script, le site ne l'utilise pas).
- `PROMPT_IA.md` : résumé complet à transmettre à une IA pour continuer le projet.

## Connecter le jeu à Google Sheets

Dans `game.js`, remplace la valeur vide située au début du fichier :

```js
const RESULT_ENDPOINT = "";
```

par l'URL de ton déploiement Google Apps Script :

```js
const RESULT_ENDPOINT = "https://script.google.com/macros/s/TON-ID/exec";
```

Le jeu enverra alors le profil, le score, le chemin, les objets, les découvertes et le temps de jeu à ton script.

## Modifier les informations de la soirée

- La ligne visible en bas du résultat se trouve dans `index.html`.
- Les informations inscrites sur l'image Story se trouvent vers la fin de `game.js`.
- Les textes, objets et chemins sont principalement regroupés dans `game.js`.

## Important

Conserve les noms des dossiers et les chemins relatifs des images. GitHub distingue les majuscules et les minuscules : `Image.png` et `image.png` sont deux noms différents.

## Mesurer les abandons (événements Google Sheets)

Le jeu envoie des événements anonymes (identifiant de session aléatoire, aucune donnée personnelle) : `start`, `location`, `first_item`, `route`, `blocked`, `hint`, `leave` et `end`.

1. Crée un Google Sheet, puis **Extensions > Apps Script**.
2. Colle le contenu de `apps-script/Code.gs`, enregistre, puis lance une fois la fonction `setupStats` (autorise l'accès).
3. **Déployer > Nouveau déploiement > Application Web** : exécuter en tant que **toi**, accès **Tout le monde**.
4. Copie l'URL `/exec` dans `RESULT_ENDPOINT` au début de `game.js`.
5. Joue une partie : l'onglet `events` se remplit et l'onglet `stats` affiche l'entonnoir.

Pour modifier le script plus tard sans changer l'URL : **Gérer les déploiements > modifier > Nouvelle version**.

## Modifier les infos de la soirée (V3)

- **Carte « Rendez-vous »** et **lien de billetterie** : dans `index.html` (cherche `rdv-card` et `ticketButton`).
- **Textes des 7 affiches** : dans `game.js`, constante `POSTERS`.
- **Dialogues** de Noli, DRIIA et de la régie : dans `game.js`, fonctions `talkMusician`, `talkDriia` et `talkRegie`.
- **Musique** : trois extraits dans `assets/audio/` (`explore`, `riser`, `drop`), joués selon l'avancée. Le son démarre uniquement après un tap.
