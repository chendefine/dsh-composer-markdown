# dsh-composer-markdown

[中文](./README.zh-CN.md)

> **In one sentence**: a pure client-side plugin for DSH (DeepSeek Harness) Web that adds Markdown editing aids to the conversation composer — list auto-continuation and renumbering, inline-code styling (backticks hidden once rendered), and code-fence auto-closing with atomic block interactions. Every editing gesture rides on **Shift+Enter**; **Enter keeps DSH's native "submit" semantics and is never intercepted**. Apart from the ordered-list renumbering, everything is edit-state visuals and key gestures only — **the submitted text always stays literal Markdown, byte-for-byte faithful**.

- Platform: web (the DSH Web GUI, `dsh plugin --profile web`)
- Shape: a pure client plugin — the host half is a no-op carrier, zero runtime dependencies, toggleable any time in "Settings → Plugins" (设置 → 插件)
- Tests: 426 assertions passing (a zero-dependency runner: artifact freshness + pure-logic unit tests + bundle-shape assertions + an optional host-contract smoke)
- License: MIT

## Contents

- [Purpose and use cases](#purpose-and-use-cases)
- [Feature overview](#feature-overview)
- [Installation](#installation)
- [Usage](#usage)
- [Architecture](#architecture)
- [Compatibility](#compatibility)
- [Known limits](#known-limits)
- [Development notes and conventions](#development-notes-and-conventions)

## Purpose and use cases

The DSH composer is a Lexical plain-text editor that natively offers only "Enter submits / Shift+Enter soft-breaks" — writing Markdown means typing every literal character by hand. This plugin brings the composer's Markdown editing experience up to the level of mature chat products:

- **Write structured content in the input box**: lists, steps, code snippets, code blocks — without leaving the keyboard for a toolbar;
- **Make literal Markdown readable**: `• ` bullet markers, monospace numbering, the inline-code background, and paired ```` ``` ```` fences rendering as a real code block — what you see approaches how the sent message renders;
- **Keep the plain-text contract**: every enhancement is an edit-state visual layer; what gets sent is exactly the literal Markdown you typed, byte-for-byte — the model side, the message renderer, and the clipboard projection are untouched;
- **Change no native habit**: Enter still submits; the `/` and `@` menus, `@xxx` reference chips, image pastes, and IME input all behave exactly as before.

Not for: rich-text (non-Markdown) editing, or rewriting/beautifying Markdown at send time — this plugin deliberately performs no send-state transformation.

## Feature overview

````
  you type                   edit-state rendering                sent text
─────────────────────────────────────────────────────────────────────
  - apple                  • apple  (bullet marker)             - apple
      ⇧↵ (Shift+Enter)     - ␣      (next line auto-prefixed)    …
  1. step one              1. step one (monospace digits)       1. step one
      ⇧↵                   2. ␣     (auto-incremented, ...)      …
  `code`                   code     (mono+bg, backticks hidden) `code`
  ```ts ⇧↵                ┌─────────────────┐                  ```
                          │ ts badge        │                  (blank)
                          │ ␣ (caret here)  │                  ```
                          └─────────────────┘
````

By domain:

| Domain | Capabilities |
|---|---|
| **Lists** | bullet/ordered continuation (any visual line, including soft-broken and pasted lines), split-at-caret continuation, empty-item exit, the per-group renumbering invariant (delete closes gaps / breaks restart / merges accumulate / nesting-aware), mid-insert shift-down, atomic prefix delete, ordered-item Backspace join/detach, atomic arrow hops over prefixes, no resting inside a marker, differentiated marker rendering (`• ` dot / monospace digits) |
| **Inline code** | paired-backtick inner text styled as inline code, backticks hidden the instant the pair closes (zero-advance invisibility, real font metrics kept), revealed while a selection genuinely covers them (select-what-you-see) |
| **Code blocks** | ```` ``` ```` / ```` ```ts ```` + Shift+Enter skeleton closing, the type-```` ``` ````-at-a-content-line-head flow that preserves the tail, commit-only paired rendering (whole-block code look + floating language badge + zero-height marker lines), one-keystroke unwrap at block boundaries (markers removed, body kept), ↑/↓ skipping the marker lines, Shift+Enter inside a fence inserts a paragraph, fences open at the head of any line (soft-line promotion), orphan close-marker cleanup |

## Installation

### Prerequisites

- DSH `0.1.2-alpha.x` (the composer is a Lexical plain-text editor + `@lexical/plain-text`, lexical `0.49`);
- a modern desktop browser (Chrome / Edge / Firefox / Safari).

### Installing the plugin

The package declares a `dsh.bundle.patch` (`cordis.patch.yml`: one insert row mounting the host half's no-op entry, which makes the plugin appear in "Settings → Plugins").

From a local checkout (the usual development route):

```sh
dsh plugin --profile web add link:/absolute/path/to/dsh-composer-markdown
```

From the npm registry (once published):

```sh
dsh plugin --profile web add dsh-composer-markdown
```

Or through the DSH plugin marketplace (设置 → DSH插件市场) — tag the repo with the `dsh-plugin` topic and it is indexed automatically.

After installing, **restart the `dsh web` service** and refresh the browser page. With a `link:` install, edit the sources under `src/client/`, run `node scripts/build.mjs` to regenerate `client.js` — in dev mode HMR hot-reloads the regenerated artifact (no refresh needed; refresh once if HMR is not running).

### Toggle and uninstall

- **Toggle**: Settings → Plugins (设置 → 插件) → `composer-markdown`; disabling restores all native behavior (effective after a refresh);
- **Uninstall**: `dsh plugin --profile web remove dsh-composer-markdown`.

Disable/uninstall auto-cleans: the document listeners, the injected style tag, and every code-style format bit in the editor (the draft text content is unchanged).

## Usage

Every editing gesture rides on **Shift+Enter**; **Enter = native submit, never intercepted**; a Shift+Enter that matches no scenario = the native soft break. Plain Backspace / Delete / arrow keys are claimed only when they hit exactly the boundaries below — everything else keeps the native per-character behavior.

### Lists

| Operation | Trigger | Behavior |
|---|---|---|
| Bullet/ordered continuation | Type content after a line-head `- ` / `* ` / `N. ` (indent ≤ 3 spaces), press **Shift+Enter** | The new line below is auto-seeded with the `{indent}- ` / `{n+1}. ` prefix, caret right after it; works on **any visual line** — paragraph heads, soft-broken lines, and multi-line-pasted lines alike |
| Split at caret | **Shift+Enter** with the caret mid-content of a list item | The line is cut at the caret: everything after it moves down and becomes the new item's content, spliced after the new prefix (byte-faithful); a caret at the line start / inside the marker / at the line end keeps the append-below behavior |
| Mid-insert shift-down | Shift+Enter inserting a new item mid-group | The new line takes `n+1` and every member below in the same group shifts +1 (`1. 2. 3.` inserting between 1 and 2 → `1. 2. 3. 4.`); the group stays continuous and duplicate-free; insert and shift share one undo step |
| Renumbering (the invariant) | After any change (delete/insert a line, empty-item exit, paste, undo/redo) | Every ordered group (consecutive ordered lines, one indent, outside fences) is **always numbered `1. … n.` from its first member**: a deleted line closes the gap below; a group split by a plain/blank/bullet line restarts its tail at `1.`; deleting the splitting line merges the two runs into one continuous count; **deeper indents merely suspend the outer group** (a nested sublist never interrupts the outer run — its count resumes when the outer indent returns), nested groups normalize independently. Deliberate trade: a group cannot hold a non-1 start or a manual gap — hand-typed digits snap back (continuity IS the contract) |
| Empty-item exit | **Shift+Enter** on an item that is only a prefix | The prefix is removed and the empty paragraph kept (an empty line on soft lines) — press twice to cleanly leave the list |
| Atomic prefix delete | **Backspace** right **after** a **bullet** prefix `- `, or **Delete** right **before** **any** list prefix (after the indent, at the line head) | The whole prefix goes in one stroke (indent excluded), its own undo step; deleting a middle item's prefix turns the line plain, the group breaks there, and the lines below renumber as a new group from `1.` |
| Ordered-item join/detach | **Backspace** right **after** an **ordered** prefix `N. ` | Non-first member → **join**: the line's content splices onto the end of the line above, caret at the seam, the numbering below closes up (`2.` of `1. 2. 3. 4.` joining → `1. 2. 3.`); first member → **detach**: only the marker dies, the line turns plain, the members below re-anchor (`1. 2. 3.` → plain line + `1. 2.`); join/detach and the renumbering share one undo step |
| Atomic arrow hop over prefixes | Plain **← / →** with the collapsed caret at any list-prefix boundary | `→` at the line head jumps clear over the whole `1. ` / `- ` to the content's first character; `←` right after the prefix jumps back to the line head; a caret already inside the prefix (a click, a vertical move) exits to the far edge — the keyboard never walks the prefix interior. **Shift+arrows stay native** (a selection can still cover exactly the digit characters for manual renumbering) |
| Differentiated marker rendering | Any visual line headed by `- ` / `* ` / `N. ` (outside fences, empty prefixes included) | Ordered digits switch to the code font; the bullet dash/star renders as `• ` (dot + space as one marker unit); the marker bytes are **kept verbatim** in the draft/copy/send text; a selection genuinely covering a marker character **reveals the raw character** |
| No resting inside a marker | A collapsed caret landing inside a marker via any path (↑/↓, mouse click) | The caret is homed to the nearest marker edge (ties snap to the front edge); the edges themselves (line head / content head) are legal rest points; selections are unaffected |

### Inline code

- When a line holds a paired `` `non-empty` `` whose content **stays on one line** and whose **inner-edge characters are non-blank** (full-width space / NBSP included): the inner text gets the inline-code look (code font, light background, rounded corners — reusing the DSH theme tokens);
- The paired backticks **hide the instant the pair closes** (invisible, zero width, still kept byte-for-byte in the draft and the sent text); they **stay hidden** while the caret travels inside the pair or brushes either side;
- Only a **selection genuinely covering one of the backtick characters** (Shift+arrows, select-all) temporarily reveals the pair (select-what-you-see); it hides again once the selection collapses; a cross-paragraph selection (Ctrl+A) projects per paragraph — no misses at paragraph boundaries;
- Non-matching pairs are fully inert (their backticks stay visible and never affect later pairing); `` `` ``-style multi-backtick delimiters are not recognized (naive left-to-right pairing).

### Code blocks

| Operation | Trigger | Behavior |
|---|---|---|
| Skeleton closing | The caret's line is exactly ```` ``` ```` (optionally with a language id ```` ```ts ````) and the caret sits inside/after the marker run, **Shift+Enter** | Inserts the three-line skeleton ```` ``` / empty / ``` ````, caret at the head of the empty line; works when typed at the head of **any line** (soft-broken and pasted lines included); a caret **before** the marker run (bare ```` ``` ```` line, offset 0) is plain text and keeps the native soft break |
| Content-preserving flow | Type ```` ``` ```` at the head of a line **that already has content** (caret still right after it), **Shift+Enter** | Splits after the ```` ``` ````: the marker line keeps ```` ``` ````, an empty line + closing skeleton is inserted, and **everything after ```` ``` ```` on the original line moves below the closing marker** (outside the block, byte-faithful); the language-id flow is unaffected (```` ```ts ```` at line end still yields the badged skeleton) |
| Paired rendering | A paired ```` ```…``` ```` region in the draft | The whole region renders as **one code block**: code background + code font inside (the same theme tokens and geometry as the message-side CodeBlock); the first marker line is **zero-height**, the language id shows as a **floating badge** at the block's top-right; the ```` ``` ```` markers are fully imperceptible (invisible, never host the caret); **an unclosed ```` ``` ```` is plain text, always** — typing ```` ``` ```` mid-draft never swallows the content below into a block |
| One-keystroke unwrap | **Backspace / Delete** at a block boundary (← at the first body line's head / the paragraph after the block; → at the paragraph before the block / the last body line's end) | **One keystroke removes the pair of ```` ``` ```` marker lines**: the block un-renders, the body survives verbatim as plain paragraphs, the caret stays put — its own undo step |
| Leaving the block | **↓** at the last body line's end (an empty paragraph grows below when the block ends the draft) | The caret drops to the new paragraph below the block to continue typing plain text; ↑/↓ skip the marker lines at block boundaries |
| New paragraph inside a fence | **Shift+Enter** inside a fence (the closing line included) | Inserts a new paragraph (not a soft break), split at the caret; plain **Enter** inside a fence still submits |

### Coexistence with native behavior

- **Enter**: keeps DSH's native "submit" and is never intercepted (on list lines and inside fences alike);
- **Ctrl/Cmd+Enter**: keeps the native "accelerated submit";
- **Shift+Enter (no scenario matched)**: the native soft break (`<br>`);
- **While a `/` or `@` trigger menu is open**: the Enter family is fully yielded;
- **IME (e.g. Chinese input)**: keys during a composition trigger nothing (three-signal guard: `isComposing` / `keyCode 229` / a 10 ms window after `compositionend` — the same guard the DSH input machine itself uses);
- Slash-command claims, `@` reference chips, image drag-drop/paste, busy/locked states, and Q&A/approval cards are unaffected;
- Coexisting with other composer plugins: capture-phase first-come-first-served — a key already `preventDefault`-ed is yielded to; keys this plugin consumes get `stopImmediatePropagation`.

## Architecture

### The two halves

A DSH plugin has a host (node) half and a browser half; this plugin is the **extreme pure-client** shape:

```
┌─ host half (node) ────────────────────────────────────────────┐
│ index.js          a no-op carrier: an importable entry row for │
│                   the bundle, so the plugin shows up in        │
│                   "Settings → Plugins" and is toggleable there │
└────────────────────────────────────────────────────────────────┘
┌─ browser half (web) ──────────────────────────────────────────┐
│ client.js         the single-file load artifact (the DSH       │
│                   loader only accepts single-file bundles),    │
│                   generated from the 15 src/client/ modules by │
│                   scripts/build.mjs and committed; registers   │
│                   via window.__ModuleLoader__.load             │
│                   ({id, factory}), with an in-bundle           │
│                   CommonJS-style module registry               │
└────────────────────────────────────────────────────────────────┘
```

### Source layering (src/client/, one-way dependencies top-down)

```text
constants.js     constants + line-grammar regexes + CSS class names
                 (the stylesheet composes its selectors from them — no drift)
editor.js        the host-contract seam: the ONLY module touching the
                 host's underscore internals
                 (__lexicalEditor/_nodes/_nodeMap/_selection/_compositionKey)
grammar.js       the line-grammar substrate: visual lines, fence intervals
                 + committed coverage, the shared caret-line resolution,
                 the selection-covers reveal rule — derived once per read
doc.js           the document read: block/leaf flat geometry + caret/selection
                 mapping (committed/live flavors) + the husk-block query
fence-plan.js    pure fence projections and decisions (line/block roles,
                 soft-line promotion, fence pairs, orphan cleanup,
                 atomic keys, caret homing)
code-plan.js     the pure inline-code kernels + per-block span/delimiter
                 projections
enter-plan.js    pure Shift+Enter arbitration (one decision tree: fences
                 first, then lists)
list-plan.js     pure list planning (the state-driven renumber walk, marker
                 glyphs, atomic delete/hop/homing, join/detach, shift-down,
                 re-anchor)
analysis.js      one analyzeDraft(texts): the model + every domain projection
edits.js         the edit algebra: the ONLY home of every live-node mutation
                 (flat-range erase / soft-line promotion / paragraph split /
                 digit rewrite / format shapes)
style-sheet.js   the CSS text (composed from the class constants) + the
                 style-tag lifecycle
present.js       the presentation layer: block marks (fence classes / badge)
                 + the ONE glyph-mark engine ({at, class, reveal} table)
                 + stripDom
gestures.js      the key surface: guards + the gesture policy table
                 (prepare/apply/history steps) + the one claim path
restyle.js       the convergent engine: the ordered STAGES table (normalize →
                 DOM marks → repairs → caret home → code/marker shapes),
                 one analysis per pass, at most one structural commit
                 + cross-pass memory + loop guard; instance state, never
                 module globals
index.js         the composition root: lifecycle + __internals assembly
```

### Five cross-cutting designs

Features are not individually plumbed pipelines — they are rows over one set of orthogonal abstractions:

1. **One line grammar**: visual-line splitting (each paragraph split on `\n`; a soft break's `\n` and a pasted `\n` are the same thing), fence pairing with committed coverage, and caret-line resolution are derived once in `grammar.js`; lists, inline code, fences, and Enter arbitration all consume the same model — they cannot drift apart by construction.
2. **One draft analysis**: `analyzeDraft(texts)` assembles the fence roles, soft-line promotion, inline-code spans/delimiters, list marker glyphs, and the renumber invariant into a single object — every projection sees the same lines and the same fence coverage.
3. **One edit algebra**: plan (pure data, unit-tested) and apply (live-node operations, `edits.js` only) are strictly separated; neither the gesture policies nor the convergence engine touch nodes directly.
4. **One presentation engine**: edit-state visuals come in exactly two shapes — block marks (fence paragraph classes / badge) and glyph marks (a single-char leaf + class + reveal rule); hidden backticks and list-marker styling share one engine and one reveal predicate — adding a glyph kind is a table row, not a pass.
5. **One table-driven dual driver**: the keyboard side is a policy table (one prepare/apply/history per key family), the convergence side is a stage table (one pure plan function per stage); new behavior is a row in a table, not a new pipeline.

### Key technical details

**The keyboard path (why the document capture phase)**: DSH's Enter command handler swallows every non-Shift Enter at CRITICAL priority (submit), leaving no seam at the command layer; Lexical dispatches Enter from the root element's own keydown listener. The plugin therefore listens to keydown at the **document capture phase** — guaranteed to run before Lexical — and only on a matching edit scenario calls `preventDefault()` + `stopImmediatePropagation()` to keep out the native soft break, then performs the insertion via `editor.update()`. Plain Enter never enters this path.

**The hidden-glyph trick (zero-advance invisibility)**: Lexical renders every text node as its own element. The styling write first splits the text around each backtick/marker character (`splitText`) and flags the single-char leaf **unmergeable** (Lexical's normalization would merge same-format adjacent leaves back; only this detail bit keeps the isolation); a follow-up DOM scan then classes those leaves via `editor.getElementByKey()`: the code font + `letter-spacing: -1ch` cancels the character's advance exactly, and `color: transparent` hides the ink — **real font metrics are kept**. `display: none` is unusable (no box — the browser cannot anchor a caret beside it), and so is `font-size: 0` (the caret takes its height from the text node it anchors in — you would get an invisible zero-height caret). The bullet dot renders through an `::after` pseudo-element (placed after the zero-advance dash, so a line-head caret renders before the whole `• ` unit).

**Commit-only fence activation**: only a **closed** fence renders; an unclosed interval covers only its own marker line in the coverage rule — typing ```` ``` ```` mid-line neither renders the content below into a code block nor turns off list continuation / inline-code pairing on those (plain-text) lines.

**Soft-line promotion (fences at any line head)**: the fence grammar speaks paragraphs, while a soft break is an in-paragraph `<br>` and a multi-line paste splices a literal `\n` into a text node. Restyle stage 1 promotes the fence-adjacent soft boundaries to real paragraph breaks (text-projection identical; the draft/send text stays unchanged byte-for-byte), so ```` ``` ```` typed at the head of **any** line can commit into a block.

**The convergence engine**: restyle is driven by the editor's update listener — each pass reads the document once, runs the stage table, and commits **at most one structural update**; the commit re-fires the listener and the next pass finds no diff and stops (writes happen only on difference — idempotent convergence). Self-triggered writes are rate-limited (16 per rolling second) as a loop guard; an in-flight IME composition is yielded to outright. Format/style writes carry the `history-merge` tag so they don't pollute the undo stack; structural gestures (insert+shift, join/detach+renumber) are discrete undo steps — one Ctrl+Z reverts the whole gesture.

**Host contract and safe degradation**: lexical is not a module-table shared module, and the plugin must not bundle a second lexical (two copies would split module state and node classes). Every node operation goes through the **host editor instance**: `editor._nodes` for the real node classes, `editorState._nodeMap`/`_selection` for reads and positioning, and the host nodes' own methods (`insertAfter/append/select/splitText/spliceText/setFormat`) throughout. These internal access points, like `__lexicalEditor`, are de-facto contracts concentrated in `editor.js`; when an upgrade breaks one, the plugin degrades safely to a no-op (one `console.warn`).

**Send fidelity**: except for the ordered-list renumbering (which itself rewrites the digits to their literal continuous values — what you see is what gets sent), no line touches text content — the send text = the composer's clipboard projection = per-text-node `getTextContent()`; format bits and DOM classes never affect serialization.

## Compatibility

- DSH `0.1.2-alpha.x` (composer = a Lexical plain-text editor + `@lexical/plain-text`, lexical `0.49`);
- modern desktop browsers (Chrome / Edge / Firefox / Safari);
- coexisting with other composer plugins: capture-phase first-come-first-served (see "Coexistence with native behavior").

## Known limits

- **List-marker styling and backtick hiding are edit-state visual layers**: the characters remain in the draft/copy/send text; a covering selection restores the raw glyphs and widths. The bullet dot's width does not exactly match the original dash (the dot uses the code-font `::after`) — in extremely narrow columns the dot may be slightly wider than the original `- `; an acceptable typographic difference.
- **Vertical homing has a brief transient**: after ↑/↓ lands inside a marker, the eviction happens in the following restyle scan (microtask-scale); in extreme cases one frame of the interior position may be visible; ←/→ arbitration at key time has no such transient.
- **A code block's language id cannot be edited directly** (the marker line is unreachable): changing the language = one Backspace unwrap (body preserved), then retype the fence.
- An unclosed ```` ``` ```` never renders (pasted/draft-restored ones included); Shift+Enter on the marker line (or typing the closing ```` ``` ````) commits it into a block.
- `` `` `` / ```` ``x`` ````-style multi-backtick delimiters are not recognized (naive pairing).
- Ordered-list normalization rewrites every non-continuous numbering as it stands: manual gaps and non-1 starts snap back; deeper indents merely suspend the outer group (blank lines, fences, and plain/bullet lines at-or-shallower than the group still break it); groups with more than 9-digit numbers (≥ 1 billion lines) are out of scope.
- Inline-code content that happens to be a `/name` / `@name` text-reference token in the lexicon may have its styling overridden by the chip coloring (text content unaffected).
- A reference chip (`@xxx`) containing line breaks cannot be soft-line-promoted (chips are atomic nodes); fence judgement on such lines degrades to the whole paragraph.
- A fully reveal-free inline-code scheme needs chip nodes (tech-doc route B, left for future evolution).

## Development notes and conventions

### Build and test

```sh
node scripts/build.mjs                       # regenerate client.js from src/client/
node scripts/build.mjs --check               # only verify client.js is in sync with the sources
node tests/run-tests.mjs                     # artifact freshness + pure-logic unit tests + bundle-shape assertions
DSH_CHECKOUT=/path/to/dsh node tests/run-tests.mjs   # + the host-contract smoke (grep assertions)
```

`npm run build` / `npm test` are equivalent shortcuts. The manual acceptance checklist lives in [tests/e2e-recipe.md](tests/e2e-recipe.md) (Chinese; drivable with playwright-cli — keyboard events must be real keydowns). Design and evidence document: `dsh-composer-markdown-view-tech.md` at the repository root (Chinese; requirements, evidence index, rejected alternatives).

### Source conventions

- **Never edit `client.js` directly**: it is the artifact generated by `scripts/build.mjs`, committed to the repo, and its freshness is asserted by the tests; edit `src/client/`, rebuild, and commit the regenerated artifact. The DSH loader loads each plugin's `./client` export as a **single** `<script src>` (no multi-file plugin support) — the one and only reason a build step exists.
- **Module convention**: every `src/client/*.js` file is a CommonJS-style module body (receiving `module, exports, require`; `require('./xxx')` resolves through the in-bundle registry); the build concatenates them verbatim in `MODULES` order — no transpilation, no re-indentation. Zero runtime dependencies — no external packages.
- **Never import/bundle lexical**: lexical is not a module-table seed; a second copy would split module state and node classes. All node work goes through the host editor instance (`editor.js` is the only contract seam); when adding host-internal access points, put them in `editor.js` and keep the "broken contract → warn once → no-op" degradation.
- **Extension is a table row, not a pipeline**: a new key gesture → one `{keys, guard, prepare, apply, history}` entry in the `gestures.js` policy table; a new convergence stage → one pure plan function in `restyle.js`'s `STAGES`; a new glyph style → one `{at, class, reveal}` row in `present.js`'s glyph table. No new pipelines.
- **plan/apply separation**: planners must be pure functions of the current draft (no cross-pass memory — the fence-pair memory of the orphan cleanup excepted), exposed for unit testing through `__internals` to the zero-browser runner; live-node mutations live only in `edits.js`.
- **Convergence discipline**: write only on difference; at most one structural commit per pass; style/caret writes carry `history-merge`, structural gestures use discrete undo steps; respect the `MAX_WRITES_PER_SECOND` loop guard and the IME yield.
- **Styling reuses DSH theme tokens** (`--ds-font-family-code`, `--dsw-alias-markdown-inline-code`, `--dsw-alias-markdown-code-block*`); selectors are composed from the class-name constants in `constants.js` — no hardcoded colors, no CSS/class-name drift.

## License

MIT (see [LICENSE](LICENSE)).
