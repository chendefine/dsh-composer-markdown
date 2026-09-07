#!/usr/bin/env node
/**
 * scripts/build.mjs — regenerate client.js from the src/client/ modules.
 *
 * Why a build step at all: the DSH module graph loads a plugin's browser
 * half as ONE classic <script src> — the package.json exports['./client']
 * file — whose only job is to call
 * window.__ModuleLoader__.load({ id, factory }). The loader has no
 * multi-file plugin support (dsh.client.inject names sibling PACKAGES,
 * not files), so the runtime artifact must stay a single self-contained
 * file. The sources, however, are split by feature under src/client/.
 *
 * Module convention: each src/client/*.js file is a CommonJS-style body.
 * The build wraps it verbatim as function (module, exports, require) and
 * concatenates the wrappers into an in-bundle registry. The `require`
 * seen inside a module body resolves sibling ids ('./editor', …) through
 * that registry — it is NOT the DSH module-table require the factory
 * receives. Bodies are never re-indented or transformed: the generated
 * file is a byte-faithful concatenation.
 *
 * Usage:
 *   node scripts/build.mjs          regenerate client.js (write + report)
 *   node scripts/build.mjs --check  exit 1 when client.js is stale
 *
 * Zero dependencies; node ^22.19 || >=24 (DSH's support window).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));

/** Bundle module table: [registry id, source path], in emitted order. */
export const MODULES = [
  ['./constants', 'src/client/constants.js'],
  ['./editor', 'src/client/editor.js'],
  ['./grammar', 'src/client/grammar.js'],
  ['./doc', 'src/client/doc.js'],
  ['./fence-plan', 'src/client/fence-plan.js'],
  ['./code-plan', 'src/client/code-plan.js'],
  ['./enter-plan', 'src/client/enter-plan.js'],
  ['./list-plan', 'src/client/list-plan.js'],
  ['./analysis', 'src/client/analysis.js'],
  ['./edits', 'src/client/edits.js'],
  ['./style-sheet', 'src/client/style-sheet.js'],
  ['./present', 'src/client/present.js'],
  ['./gestures', 'src/client/gestures.js'],
  ['./restyle', 'src/client/restyle.js'],
  ['./index', 'src/client/index.js'],
];

/** The bundle prologue: generated banner + the behavioral spec comment. */
const PROLOGUE = `\
/**
 * dsh-composer-markdown — Client bundle.
 *
 * GENERATED FILE — do not edit. Built by scripts/build.mjs from the
 * src/client/ modules; edit the sources, then run \`node scripts/build.mjs\`
 * and commit the regenerated artifact. It must stay ONE self-contained
 * classic script: the DSH module graph loads each plugin's ./client
 * export as a single <script src> that registers through
 * window.__ModuleLoader__.load (no multi-file plugin loading exists).
 *
 * Markdown editing aids for the DSH web composer (a Lexical plain-text
 * editor inside [data-composer-input]). The editing gestures ride on
 * **Shift+Enter** — plain Enter keeps DSH's native submit, untouched:
 *
 *   R1  \`- item\` + Shift+Enter   → next line pre-seeded with \`- \` (a new
 *                                    paragraph at a paragraph head; a soft
 *                                    line break when the list line is a
 *                                    soft line — native Shift+Enter break
 *                                    or a pasted \`\n\` — so lists start on
 *                                    ANY line, not just the draft's first).
 *                                    v1.12: a caret mid-content CUTS the
 *                                    line there — the tail moves down and
 *                                    becomes the new item's content (byte
 *                                    faithful, nothing trimmed); caret at
 *                                    line start / inside the marker / at
 *                                    the line end keeps the append-below
 *   R2  \`1. item\` + Shift+Enter  → next line pre-seeded with \`2. \`
 *                                    (n+1); deleting a member line of a
 *                                    numbered list closes the gap below
 *                                    (1. 2. 3. 4. minus \`2.\` → 1. 2. 3.)
 *                                    — same group only, run-tracked, the
 *                                    rewrite folded into the user's
 *                                    deletion on the undo stack. Runs are
 *                                    VISUAL lines (v1.9): a soft-lined list
 *                                    (continuation-typed or pasted into one
 *                                    paragraph) renumbers too; members are
 *                                    tracked across passes by (paragraph
 *                                    key, digits) — lines carry no node
 *                                    keys of their own. An INSERTION
 *                                    cascades the other way (v1.11): a
 *                                    new item between 1. and 2. takes 2.
 *                                    and every member below shifts +1
 *                                    (the run stays continuous and
 *                                    duplicate-free; one undo step for
 *                                    insert + shift together)
 *   MK  Backspace/Delete at a   → the list atom is ONE unit — indent,
 *      list-atom boundary         digits/dot/space, or indent/dash/
 *                                    space (v2.8 folded the indent
 *                                    in, the day the grammar started
 *                                    nesting at any depth): Delete
 *                                    right BEFORE it (at the line
 *                                    head) removes the whole thing
 *                                    in one stroke — the indent can
 *                                    never be eaten char by char —
 *                                    and Backspace right AFTER it is
 *                                    the LEVEL LADDER's gesture (see
 *                                    LL): one stroke, one undo step;
 *                                    any visual line, fences
 *                                    excluded, everything else native
 *                                    per-character
 *   LL  Tab / Shift+Tab /        → the list LEVEL LADDER (v2.8):
 *      Backspace after the atom    with the collapsed caret anywhere
 *                                    on an ordered/bullet item line
 *                                    (content included), Tab sinks
 *                                    the item one level (indent
 *                                    +2 spaces) and Shift+Tab or
 *                                    Backspace-at-the-atom-end lifts
 *                                    it — and the move carries the
 *                                    item's WHOLE SUBTREE (every
 *                                    deeper line below, recursion
 *                                    included) in ONE discrete
 *                                    update. A top-level item lifting
 *                                    further UNLISTS: the atom dies,
 *                                    the content stays as plain
 *                                    text, the subtree still rises
 *                                    one level. SINKING IS CAPPED
 *                                    (v2.9): an item may sit at most
 *                                    ONE level below its parent
 *                                    context — the nearest item line
 *                                    above, plain lines skipped,
 *                                    blanks/fences ending the block —
 *                                    so a Tab past that (including
 *                                    any Tab on a list's FIRST item)
 *                                    still claims the key but moves
 *                                    nothing (focus never jumps away
 *                                    mid-list-editing). The subtree
 *                                    walk stops at a fence region, a
 *                                    blank line, or a sibling (a
 *                                    line at/below the item's own
 *                                    indent); fenced bytes never
 *                                    shift. The ordered runs the move
 *                                    reshuffles converge on the
 *                                    renumber invariant by the next
 *                                    restyle pass (a plain line left
 *                                    behind by an unlist splits the
 *                                    run — the tail restarts at 1).
 *                                    This REPLACES the v1.13 join/
 *                                    detach Backspace. Anywhere else
 *                                    (plain lines, fences, range
 *                                    selections, repeats, modifier
 *                                    chords) is not ours: Tab keeps
 *                                    DSH's native behavior untouched
 *   LS  ←/→ at a list atom      → the atomic atom TRAVELS whole too
 *      (v2.2)                       (plain arrows only): → hops from the
 *                                    line head clear over \`␣␣1. \` /
 *                                    \`␣␣- \` (indent included) to the
 *                                    content head, ← hops back; a
 *                                    caret that landed inside an atom (a
 *                                    click) exits to the far edge — the
 *                                    interior is never walked. The marker
 *                                    glyphs also RENDER distinct (edit
 *                                    state only): ordered digits in the
 *                                    code font, the bullet dash/star hid-
 *                                    den at zero advance with a "•" dot
 *                                    rendered in place; every byte stays
 *                                    literal, and a selection genuinely
 *                                    covering a glyph reveals the raw
 *                                    character (Shift+arrows stay native —
 *                                    select-what-you-see). Same leaf
 *                                    isolation + DOM class machinery as
 *                                    the hidden inline-code ticks.
 *      (v2.3)                       The interior is now unreachable from
 *                                    ANY direction: a collapsed caret
 *                                    resting strictly inside a marker
 *                                    (↑/↓ column moves, clicks, scripts —
 *                                    arrivals the ←/→ hop cannot
 *                                    intercept) is homed to the NEAREST
 *                                    marker edge by the restyle caret-home
 *                                    stage (a tie snaps to the start).
 *                                    And a marker delete that empties its
 *                                    whole block resets it to the pristine
 *                                    childless paragraph (empty husk
 *                                    leaves cannot carry a DOM-reachable
 *                                    selection — the composer would go
 *                                    caret-less and dead); the caret after
 *                                    any partial erase parks on the first
 *                                    NON-empty leaf, never on a husk.
 *      (v2.8)                       The atom grew a head: the leading
 *                                    INDENT is interior now too (the
 *                                    grammar nests at any depth), so
 *                                    no arrow ever steps into the
 *                                    indent spaces, a stray caret
 *                                    there is homed out like any other
 *                                    interior position, and Delete at
 *                                    the line head eats indent+marker
 *                                    in one stroke.
 *      (v2.4)                       The bullet atom renders as ONE whole
 *                                    unit: the trailing space after \`-\`
 *                                    /\`*\` joins the "•" dot in the
 *                                    marker's code font (its own leaf
 *                                    class), so "• " reads as one styled
 *                                    marker before any body text; the
 *                                    reveal rule covers it per char like
 *                                    every other glyph.
 *      (v2.5)                       And the LINE-HEAD caret now reads
 *                                    BEFORE that whole unit: the dot
 *                                    rides an ::AFTER on the zero-
 *                                    advance dash (was ::before — a
 *                                    pseudo before the text put the
 *                                    legal line-head caret to the RIGHT
 *                                    of the dot, visually between the
 *                                    dot and the space, so every
 *                                    hop/eviction landing looked like
 *                                    the caret had entered the marker).
 *                                    The caret-home re-plans also read
 *                                    the LIVE pending selection at
 *                                    commit time now — a stale
 *                                    committed-state read let a queued
 *                                    eviction yank the caret back after
 *                                    a newer same-batch hop had already
 *                                    carried it out.
 *      (v2.6)                       The ordered RENUMBER is now an
 *                                    unconditional state invariant:
 *                                    every ordered run (consecutive
 *                                    ordered lines, one indent, outside
 *                                    fences) reads 1..n from its first
 *                                    member, ALWAYS — a run split by a
 *                                    plain/bullet line (an empty item
 *                                    exited with Shift+Enter) restarts
 *                                    its tail at 1, two runs merged by
 *                                    deleting the line between them
 *                                    fuse into one continuous count,
 *                                    pasted and undo-restored shapes
 *                                    normalize as they stand, and no
 *                                    run can hold a non-1 start or a
 *                                    manual gap (typed digits snap
 *                                    back — continuity IS the contract).
 *                                    The cross-pass run memory is GONE:
 *                                    the plan is a pure function of the
 *                                    current draft. Digit rewrites also
 *                                    shift the caret through the LIVE
 *                                    pending selection now — Lexical
 *                                    re-derives a fresh writable selec-
 *                                    tion per update, while committed
 *                                    points are frozen history.
 *   R3  \`\` \`code\` \`\` in a line   → inner text styled as inline code
 *                                    (Lexical IS_CODE format bit → <code>
 *                                    DOM) and the pair's backticks HIDDEN:
 *                                    the span write isolates each tick into
 *                                    its own text leaf and a DOM pass marks
 *                                    those leaves a hiding class with REAL
 *                                    font metrics — monospace +
 *                                    letter-spacing -1ch cancels the tick's
 *                                    advance exactly, color transparent
 *                                    hides the ink — because the caret
 *                                    derives its height from the anchored
 *                                    text node: font-size:0 (or
 *                                    display:none) leaves an invisible
 *                                    zero-height caret at the closure
 *                                    moment. The hiding
 *                                    takes effect the INSTANT the pair
 *                                    closes (a collapsed caret never
 *                                    reveals, inside or beside the span);
 *                                    the ticks surface again only while a
 *                                    selection genuinely covers one of them.
 *                                    The glyphs live on in the draft text
 *                                    and the send projection. A pair renders
 *                                    only when its content is non-empty,
 *                                    stays on one line, and starts/ends
 *                                    with a non-blank char — the char right
 *                                    after the opening backtick and right
 *                                    before the closing one may not be a
 *                                    space (or a line break); invalid pairs
 *                                    are inert (their ticks stay visible)
 *   R4  \`\`\` + Shift+Enter        → fence skeleton (\`\`\` / empty / \`\`\`), caret
 *                                    on the empty line; Shift+Enter inside a
 *                                    fence inserts a paragraph instead of a
 *                                    soft break
 *   R5  \`\`\`…\`\`\` regions          → rendered as ONE code block: the whole
 *                                    fenced region gets the code-block look
 *                                    (banner with the language id + body
 *                                    lines in the code font, same tokens as
 *                                    the rendered message's CodeBlock), and
 *                                    the \`\`\` marker lines are hidden — the
 *                                    glyphs live on in the draft text, so
 *                                    sending stays byte-for-byte literal. A
 *                                    caret on a marker line reveals the raw
 *                                    marker (small, muted) so it can be
 *                                    edited or deleted. Activation is
 *                                    deferred: typing \`\`\` alone renders
 *                                    plain text — the block only appears
 *                                    once a newline has opened a line
 *                                    below the marker. Once active, the
 *                                    block behaves as ONE atomic object:
 *                                    the opening marker takes zero height
 *                                    (the box top starts at the first
 *                                    content line; the language id rides
 *                                    as an overlay badge — never a banner
 *                                    line), the caret never rests on a
 *                                    marker line (vertical arrows skip
 *                                    them; stragglers are nudged off),
 *                                    and ONE Backspace/Delete at the
 *                                    box's boundary removes the entire
 *                                    block (markers + content, its own
 *                                    undo step). The fence grammar reads
 *                                    paragraphs, while the composer keeps
 *                                    soft lines (\`<br>\` from the native
 *                                    Shift+Enter, literal \`\n\` from
 *                                    multi-line paste) INSIDE one
 *                                    paragraph — so the restyle pass first
 *                                    promotes every fence-adjacent soft
 *                                    line boundary to a real paragraph
 *                                    break (text projection identical),
 *                                    making \`\`\` at the head of ANY line —
 *                                    not just paragraph heads — open a
 *                                    block.
 *   E2  empty \`- \` + Shift+Enter → prefix removed, empty paragraph kept
 *
 * A Shift+Enter that matches no plan passes through to the native soft
 * line break; Enter / Ctrl+Enter / Alt variants are never intercepted.
 * Backspace/Delete pass through untouched unless the collapsed caret
 * sits exactly on a list-atom boundary (MK — the atomic unit delete;
 * LL — Backspace right after the atom lifts one ladder rung) or a
 * fence-box boundary (R5's atomic delete) — plain, unmodified keys
 * only. Tab/Shift+Tab pass through unless the caret's line is a list
 * item (LL); a modifier chord is never ours, and held repeats re-plan
 * like any press (a held Tab sinks once and holds at the cap, claimed
 * and inert — passing repeats through would let the native default
 * move focus out of the composer mid-edit).
 * Everything here is edit-state only: text content is never rewritten by
 * the styling pass, and the inserted prefixes are exactly the literal
 * markdown the user would have typed — save ONE deliberate exception:
 * the ordered-list renumber rewrites digit runs to close gaps a deletion
 * tore into a numbered list (what you see is what gets sent). The
 * composer's clipboard projection serializes text node-for-node, so what
 * gets sent stays literal markdown byte-for-byte (send-format fidelity).
 *
 * Integration mechanics (all verified against lexical 0.49 + the DSH
 * ui-conversation sources):
 *
 *   - The editor instance hangs off the contenteditable root element as
 *     \`__lexicalEditor\`; it is re-resolved per event because the composer
 *     is rebuilt per session (never cached).
 *   - DSH's Enter command handler swallows every non-Shift Enter at
 *     CRITICAL priority (submit), and Lexical dispatches KEY_ENTER_COMMAND
 *     from the root element's own keydown listener — so a document-capture
 *     keydown runs first; on a matching Shift+Enter, preventDefault +
 *     stopImmediatePropagation keeps the key away from Lexical entirely
 *     (it would otherwise insert the native soft break) and we apply our
 *     own editor.update().
 *   - lexical is NOT a module-table seed word (the shell shares only
 *     react/cordis/store/slots/primitives), so this bundle must never
 *     import it — and bundling a second copy would split module state and
 *     node classes. All node work therefore goes through real-instance
 *     methods plus the editor's own type registry:
 *       editor._nodes.get('paragraph'|'text').klass   → real classes
 *       editorState._nodeMap.get('root')              → root block
 *       editorState._selection                        → caret (anchor)
 *     Inside editor.update() the host copy's module state is active, so
 *     instance methods (insertAfter/append/select/splitText/spliceText/
 *     setFormat/…) are fully functional on nodes the host created.
 *   - Style pass convergence: read → diff → write only on difference. The
 *     update listener re-fires after our write, finds no diff, and stops.
 *     Writes carry the 'history-merge' tag so formatting joins the
 *     adjacent undo step instead of polluting the stack.
 *   - Fence blocks are styled at the DOM layer, not the node layer: the
 *     same restyle pass also classifies every paragraph (fence-open /
 *     fence-body / fence-close / none — pure string logic) and toggles CSS
 *     classes + a data-dmd-lang attribute on the paragraph elements via
 *     editor.getElementByKey(). Classes are additive DOM state only: Lexical
 *     reuses paragraph elements across reconciliations (ParagraphNode
 *     .updateDOM never resets className), and any element it does recreate
 *     is re-classed by the update listener firing right after the commit.
 *     No editor state is touched — nothing to converge, no history entry.
 *     The \`\`\` markers are hidden with font-size:0 — the text stays in the
 *     DOM (and in the send projection); the language id rides in as a CSS
 *     content: attr() badge on the opening line.
 *   - Inline-code delimiters hide the same way (DOM layer, not format
 *     bits): every Lexical text leaf renders as its own element, so the
 *     span write first isolates each rendered pair's backticks into
 *     single-char leaves (splitText at the delimiter boundaries — part
 *     of the same convergence diff), and a DOM pass sweeping every
 *     update classes exactly those leaf elements with a rule that keeps
 *     REAL font metrics but collapses the glyph to zero advance:
 *     monospace + letter-spacing -1ch (ch = the monospace advance, so
 *     the tick's step cancels exactly) + color transparent. Neither
 *     display:none nor font-size:0 work: the caret takes its height
 *     from the text node it anchors in, and at the closure moment it
 *     sits right after the closing tick — an unrendered or zero-size
 *     leaf there means an invisible caret (display:none additionally
 *     makes typing snap INSIDE the span).
 *     The pair stays hidden even under the caret: a collapsed caret
 *     covers no character, so the ticks hide the instant the pair
 *     closes (caret right after the closing tick) and remain hidden
 *     while the caret travels inside the span; they reappear only
 *     while a range selection genuinely covers one of the tick glyphs
 *     (Shift+Arrows, select-all — select-what-you-see editing).
 *     Unpaired/inert backticks never get the class.
 *
 * Source layout (this file is generated from it) — concern-layered,
 * each module importing only downward (v3 holistic refactor: ONE
 * line grammar, ONE analysis per pass, ONE presentation engine, ONE
 * gesture policy table — features are rows in shared tables, not
 * individually plumbed passes):
 *
 *   src/client/constants.js    shared constants + line grammars + CSS
 *                              class names (the stylesheet composes
 *                              its selectors from them — no drift)
 *   src/client/editor.js       host contract seam: the ONLY module
 *                              touching host underscore internals
 *                              (__lexicalEditor, _nodes, _nodeMap,
 *                              _selection, _compositionKey)
 *   src/client/grammar.js      the line grammar: visual lines, fence
 *                              intervals + committed coverage, the
 *                              shared caret-line preamble, the
 *                              selection-covers reveal rule — the pure
 *                              string substrate derived ONCE per read
 *   src/client/doc.js          the document read: blocks/leaves with
 *                              flat char geometry + caret/selection
 *                              mapping (committed + live flavors) +
 *                              the husk-block query — one coherent
 *                              node-level view shared by everything
 *   src/client/fence-plan.js   pure fence projections + decisions
 *                              (line/block roles, soft-line promotion,
 *                              pairs, orphan cleanup, atomic fence
 *                              keys, marker nudges)
 *   src/client/code-plan.js    pure inline-code kernels + per-block
 *                              span/delimiter projections
 *   src/client/enter-plan.js   pure Shift+Enter arbitration (one
 *                              decision tree: fences, then lists)
 *   src/client/list-plan.js    pure list planning (the state-driven
 *                              renumber walk, marker glyphs, atom
 *                              geometry + atomic delete/hop/caret-home,
 *                              the level ladder, shift-down)
 *   src/client/analysis.js     ONE analyzeDraft(texts): the model plus
 *                              every domain projection, assembled once
 *                              per pass (the v2 code re-derived fences
 *                              and visual lines seven times per scan)
 *   src/client/edits.js        the edit algebra: EVERY live-node
 *                              mutation, as one small primitive set
 *   src/client/style-sheet.js  CSS text (from the class constants) +
 *                              style-tag lifecycle
 *   src/client/present.js      the presentation layer: block marks
 *                              (fence classes/badge) + ONE glyph-mark
 *                              engine (hidden ticks, styled markers —
 *                              a {at, class, reveal} table, not three
 *                              near-identical passes) + stripDom
 *   src/client/gestures.js     key surface: guards + a gesture policy
 *                              table (prepare/apply/history over one
 *                              shared model) + the one claim path
 *   src/client/restyle.js      the convergent restyle engine: an
 *                              ordered STAGE table (normalize → marks →
 *                              repairs → caret home → leaf shapes)
 *                              over one analysis per pass; cross-pass
 *                              memory, wiring, loop guard — instance
 *                              state, no module globals
 *   src/client/index.js        composition root: lifecycle + the
 *                              __internals surface (lines-based test
 *                              adapters over the model-consuming
 *                              cores — assembled here, drift-free)
 */
`;

const HEADER = `\
window.__ModuleLoader__.load({
  id: 'dsh-composer-markdown',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    // ── in-bundle module registry (concatenated from src/client/) ──
    // Each entry below is one source module, verbatim. A module body is
    // CommonJS-style: it receives (module, exports, require), and that
    // require resolves sibling ids ('./editor', …) through this registry —
    // it is NOT the DSH module-table require the factory receives.
    var __dmdFactories = {
`;

const FOOTER = `\
    };
    var __dmdCache = Object.create(null);
    var __dmdStack = [];
    function __dmdRequire(id) {
      if (id in __dmdCache) return __dmdCache[id].exports;
      const factory = __dmdFactories[id];
      if (factory === undefined) {
        throw new Error('[dsh-composer-markdown] unknown internal module ' + id);
      }
      if (__dmdStack.includes(id)) {
        throw new Error('[dsh-composer-markdown] require cycle ' + __dmdStack.concat(id).join(' -> '));
      }
      const mod = { exports: {} };
      __dmdCache[id] = mod;
      __dmdStack.push(id);
      try {
        factory(mod, mod.exports, __dmdRequire);
      } finally {
        __dmdStack.pop();
      }
      return mod.exports;
    }

    var entry = __dmdRequire('./index');
    exports.name = entry.name;
    exports.apply = entry.apply;
    // Pure logic surface for the zero-browser test runner (tests/run-tests.mjs).
    exports.__internals = entry.__internals;
    return module.exports;
  },
});
`;

/**
 * Render the full client.js text from the sources.
 * @returns {string} the bundle.
 */
export function renderBundle() {
  const known = new Set(MODULES.map(([id]) => id));
  const entries = [];
  for (const [id, file] of MODULES) {
    const body = readFileSync(join(root, file), 'utf8').replace(/\s+$/, '');
    if (!body.includes('module.exports =')) {
      throw new Error(`${file}: missing a module.exports assignment`);
    }
    for (const match of body.matchAll(/require\('(\.[^']*)'\)/g)) {
      if (!known.has(match[1])) {
        throw new Error(`${file}: requires unknown internal module '${match[1]}'`);
      }
    }
    entries.push(`    '${id}': function (module, exports, require) {\n${body}\n    },`);
  }
  return `${PROLOGUE}${HEADER}${entries.join('\n\n')}\n${FOOTER}`;
}

const invokedDirectly = process.argv[1] !== undefined
  && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  const rendered = renderBundle();
  if (process.argv.includes('--check')) {
    const current = readFileSync(join(root, 'client.js'), 'utf8');
    if (current !== rendered) {
      console.error('client.js is stale — run: node scripts/build.mjs');
      process.exit(1);
    }
    console.log('client.js is up to date with src/client/');
  } else {
    writeFileSync(join(root, 'client.js'), rendered);
    console.log(`client.js regenerated from ${MODULES.length} src/client/ modules`);
  }
}
