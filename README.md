# Athanor: Alchemy Merge

*— Forge the Unknown —*

A discovery-based crafting game themed as a dark alchemist's working circle.
Tap elements into sigil slots, watch burning ley-lines race around the
crucible, and forge new elements whose true names burn across the board.

The *athanor* is the alchemist's eternal furnace — the slow, patient flame
from which the Great Work is born.

A Pizza Hero Gaming project. **Currently in private testing on Google Play.**

## Play

Two ways to run the game.

**Web (development / browser testing):**

```powershell
python -m http.server 8000
```

Then visit <http://localhost:8000>. To play on a phone, find your laptop's
LAN IP and visit `http://<that-ip>:8000` from the phone on the same Wi-Fi
(the game locks to landscape on mobile). The web build skips the Hint button
and rewarded-ad system — those are Android-wrapper-only.

**Android (production-grade testing):**

Wrapped with Capacitor for the Google Play Store. See **[BUILD.md](BUILD.md)**
for the full native-build pipeline: signed AAB generation, the AdMob bridge,
icon and splash regeneration. The wrapped build enables rewarded-ad hints
and real-device performance.

## How it works

You begin as an **Initiate** with the four primal elements — Water, Fire,
Earth, Air — and a **Vesica Piscis** circle holding two slots.

**Library gestures** (the same on web + Android):

| Gesture | Action |
|---|---|
| **Tap** an element | Drops it into the next empty circle slot |
| **Drag** an element | Drops it into a specific slot |
| **Long-press** an element | Opens its Lineage panel (what made it, what it makes) |
| **Right-click** (desktop) | Opens Lineage (same as long-press) |

When every slot is filled, the brew fires:

- Burning ley-lines race from each slot to the crucible at the center, then
  clockwise around its perimeter to meet on the far side
- The crucible erupts in gold sparks
- The result rises from the crucible, hovers, and settles
- Its **true name** burns across the top of the board, Ring-of-Power style
- Pillars of light fire back out from the crucible along each filled
  slot's axis — energy returning to its source

If the combination isn't a valid recipe, the brew fizzles instead: smoke
billows, dark embers spit outward, the slots shake red, and the board jolts.

## Rank progression — eight tiers, four sigils

| Rank | Slots | Sigil | %  |
|---|---|---|---|
| Initiate    | 2 | **Vesica Piscis** — twin overlapping circles    | 0%   |
| Apprentice  | 2 | Vesica Piscis                                   | 5%   |
| Adept       | 3 | **Triquetra** — trinity arms + inscribed triangle | 15% |
| Scholar     | 3 | Triquetra                                       | 30%  |
| Mystic      | 4 | **Squaring of the Circle** — diamond + triangle + ring | 50% |
| Sage        | 4 | Squaring of the Circle                          | 70%  |
| Archmage    | 5 | **Pentacle** — pentagram in a circle            | 90%  |
| Demiurge    | 5 | Pentacle                                        | 100% |

Each time you cross a tier that widens the circle, a cutscene plays — gold
rays sweep in, the new slot reveals itself, and a brief tutorial explains
the new mechanics. Each rank also re-themes the workspace background.

## Brewing pairs at higher ranks

When your circle holds three or more slots but you only want a 2-element
combination, fill any two slots and **tap the crucible** to fire the brew.
The crucible pulses gold when it's ready. Only the filled slots' channels
ignite.

## Miracle recipes

In addition to the **158 pair recipes**, there are **29 hand-authored
"miracle" recipes** that take 3, 4, or 5 specific ingredients at once:

- **Triplets** unlock at Adept (3 slots) — 21 of them
- **Quartets** unlock at Mystic (4 slots) — 7 of them
- **Quintet** unlocks at Archmage (5 slots) — 1 great working

These are the rituals that give the larger circles their reason for being —
particular combinations of mythic, conceptual, and primal elements that no
sequential pair-chain can reach. Multi-input miracles are checked *before*
sequential pair fallback, so the miracle path always wins when its
ingredients are all in the slots.

(The specific recipes aren't listed here — that's the game.)

## The Hint system

Stuck? **Burn the flame.** The **Hint** button in the topbar (Android only)
costs one rewarded ad and reveals the two ingredients of an undiscovered
recipe whose elements you already own. The result stays a mystery — you
still have to bind them in the circle to find out what they make.

Hints are smart-picked: only recipes you can actually act on. The picker
gates on arity (no hinting a 5-input miracle at an Apprentice), prefers
the lowest-arity match, and avoids same-hint-twice-per-session.

## The Tree of Forging

Press the **Tree** button in the topbar to open a tiered map of every
element you've discovered, organized by BFS-depth from the four primal
seeds. Click any node to drill into its **lineage** — what made it, and
what it makes — with clickable chips to traverse the recipe graph.

Long-press any tile in your library to open its lineage directly. Or
right-click on desktop.

## Library — sort, filter, search

- **Search bar** — match on element names
- **Sort** — A-Z, most recent discovery, or grouped by category
- **Filters** — multi-select category chips (Liquid, Fire, Earth, Air,
  Plant, Animal, Tool, Build, Mineral, Mythic, Time, Idea); collapsed
  by default
- **Lineage** — long-press / right-click any tile

## Music + sound

A custom soundtrack — three ambient tracks shuffle during gameplay, plus
an orchestral sting on every rank-up:

- **"Discovery Hit"** — orchestral sting on rank-up
- **"Southern Gothic"** — slow alchemical mood piece
- **"Kalimba Relaxation Music"** — sparse, contemplative
- **"Night Vigil"** — atmospheric drone

All music by **Kevin MacLeod** ([incompetech.com](https://incompetech.com)),
licensed under Creative Commons By Attribution 4.0.

Settings has separate **Sound effects** and **Music** sections — independent
on/off toggles, plus a music volume slider. Audio pauses when the phone
locks or you switch apps; resumes on focus.

## Other features

- **Save / load** — 5 named slots plus an auto-save. Export to clipboard /
  import from text for backups or sharing runs
- **Settings** — library position (left or right), library width, tile size,
  sound effects toggle, music toggle + volume
- **Seasonal sigils** — workspace gains decorative accents during All
  Hallows, Long Night (winter solstice), Verdant Hour (spring), and Solar
  Apex (summer solstice). Gameplay is unchanged; only atmosphere shifts
- **First-run + Adept tutorials** — a light walkthrough on first launch,
  and a short lesson when the circle widens to three slots
- **Title screen** — Pizza Hero Gaming splash dissolves into the Athanor
  title with a candlelit ember background, then fades into the workspace
- **Discord** — link in the About modal to the Pizza Hero Gaming community
- **Privacy policy** — full disclosure of AdMob data handling at
  [pizzaherogaming.github.io/alchemy/privacy.html](https://pizzaherogaming.github.io/alchemy/privacy.html)

## Project layout

```
athanor/   (repo dir; GitHub repo is named "alchemy" — testing links
            stay live, repo URL doesn't surface to players)
├── index.html                    — entry point + PWA shell
├── manifest.json                 — PWA manifest, landscape orientation
├── privacy.html                  — privacy policy (hosted via GitHub Pages)
├── package.json                  — Capacitor 6 wrapper deps + npm scripts
├── capacitor.config.json         — wrapper config (appId, appName)
├── BUILD.md                      — native Android build pipeline
├── STORE_LISTING.md              — Play Store listing copy
├── assets/
│   ├── icon.png                  — 1024² source for the wrapper icon generator
│   ├── icons/                    — SVG + PNG variants (Play Store listing icon)
│   └── audio/                    — Kevin MacLeod tracks (CC-BY 4.0)
├── android-templates/            — Capacitor patches (AdMob bridge, gradle bumps)
├── scripts/
│   └── build-www.js              — copies web files into www/ for Capacitor
├── tools/                        — standalone HTML generators (icons, feature graphic)
├── css/
│   ├── main.css                  — theme, typography, layout, modals
│   ├── workspace.css             — library + workspace shell
│   ├── icons.css                 — procedural CSS-shape icons per category
│   ├── circle.css                — slots, channels, crucible, success/fail FX
│   ├── themes.css                — rank-tier board themes, rank-up banner
│   ├── seasons.css               — seasonal decoration overlays
│   ├── lineage.css               — lineage panel + Tree of Forging
│   ├── hints.css                 — Hint modal + rewarded-ad UI
│   ├── title.css                 — pre-game title screen
│   └── splash.css                — Pizza Hero Gaming bumper
├── js/
│   ├── main.js                   — bootstrap, migration, ATHANOR_VERSION
│   ├── state.js                  — discovered set + persistence
│   ├── storage.js                — localStorage wrapper, versioned
│   ├── recipes.js                — pair-recipe index + lookup
│   ├── multi_recipes.js          — multi-input miracle lookup
│   ├── ranks.js                  — 8 rank tiers + theme metadata
│   ├── icons.js                  — buildIcon(element)
│   ├── progress.js               — rank/percent topbar + theme application
│   ├── circle.js                 — Circle of Binding: slots, channels, brew,
│   │                               animations, sigils, slot-unlock cutscene
│   ├── workspace.js              — library tap / long-press / drag gestures
│   ├── sidebar.js                — library list, search, multi-filter, sort
│   ├── saves.js                  — manual save slots + export/import
│   ├── settings.js               — UI/audio preference persistence
│   ├── lineage.js                — element-lineage panel
│   ├── graph.js                  — Tree of Forging tier view
│   ├── seasons.js                — seasonal-theme detection
│   ├── tutorial.js               — first-run + Adept tutorials
│   ├── title.js                  — pre-game title screen
│   ├── ads.js                    — AdMob rewarded-ad bridge (web + Android)
│   ├── hints.js                  — Hint modal + recipe-suggestion logic
│   ├── sound.js                  — SFX + music playback system
│   └── splash.js                 — Pizza Hero Gaming bumper module
└── data/
    ├── elements.json             — every element (id, name, category, tint, base?)
    ├── recipes.json              — pair recipes (a + b → result)
    └── multi_recipes.json        — 3/4/5-input miracle recipes
```

The `data/*.json` files are the source of truth. The matching `data/*.js`
files are regenerated wrappers (`window.ELEMENTS_DATA = …`) that the page
loads via `<script>` tags so the game works from `file://` too. To rebuild
after editing JSON:

```powershell
node -e "const fs=require('fs');
for (const n of ['elements','recipes','multi_recipes']) {
  const k = n === 'elements' ? 'ELEMENTS_DATA' :
            n === 'recipes'  ? 'RECIPES_DATA'  : 'MULTI_RECIPES_DATA';
  fs.writeFileSync('data/'+n+'.js', 'window.'+k+' = '+fs.readFileSync('data/'+n+'.json','utf8')+';\n');
}"
```

## Authoring rules

- **Slugs are forever.** Once an element ships, never rename its `id` —
  doing so orphans every existing save
- **One producer per element.** The dataset is audited to keep exactly one
  recipe creating each non-base element (no orphans, no multi-producers,
  no canonical-pair conflicts, no self-replication)
- **Reachability** from the four bases is verified by BFS — every element
  must be makeable from `water / fire / earth / air` through the recipe
  graph
- **Version bumps** — increment `ATHANOR_VERSION` in `js/main.js` AND
  `versionCode` + `versionName` in `android/app/build.gradle` on every
  release. Each AAB upload needs a unique, monotonically increasing
  `versionCode`

Categories drive the icon shape: `liquid, fire, earth, air, plant, animal,
tool, structure, mineral, mythic, time, abstract`.

## Stats at a glance

- **190 elements** (4 base + 186 discoverable)
- **158 pair recipes** + **29 miracle recipes** = **187 paths**
- **4 alchemical sigils** tied to rank progression
- **8 rank tiers** with themed boards
- **4 Kevin MacLeod soundtracks** (CC-BY 4.0)
- 100% reachable from a fresh save
- AAB size: ~42 MB (mostly music)
- Currently in private testing on Google Play

## Credits

- **Code · design · art:** YourPizzaHero (Pizza Hero Gaming)
- **Music:** Kevin MacLeod ([incompetech.com](https://incompetech.com)) — "Discovery Hit",
  "Southern Gothic", "Kalimba Relaxation Music", "Night Vigil". Licensed
  under Creative Commons By Attribution 4.0
- **Wrapper:** Capacitor 6 · Google Mobile Ads SDK 23.6.0
- **Tested by:** the Pizza Hero Gaming Discord community

## License

Code: TBD (planning commercial release on Google Play). Recipe data is
hand-curated for this project.

🎮 A **Pizza Hero Gaming** project · ◆ PHG · MMXXVI
