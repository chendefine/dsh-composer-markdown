/**
 * dsh-composer-markdown — Client bundle.
 *
 * GENERATED FILE — do not edit. Built by scripts/build.mjs from the
 * src/client/ modules; edit the sources, then run `node scripts/build.mjs`
 * and commit the regenerated artifact. It must stay ONE self-contained
 * classic script: the DSH module graph loads each plugin's ./client
 * export as a single <script src> that registers through
 * window.__ModuleLoader__.load (no multi-file plugin loading exists).
 *
 * Markdown editing aids for the DSH web composer (a Lexical plain-text
 * editor inside [data-composer-input]). The editing gestures ride on
 * **Shift+Enter** — plain Enter keeps DSH's native submit, untouched:
 *
 *   R1  `- item` + Shift+Enter   → next line pre-seeded with `- ` (a new
 *                                    paragraph at a paragraph head; a soft
 *                                    line break when the list line is a
 *                                    soft line — native Shift+Enter break
 *                                    or a pasted `
` — so lists start on
 *                                    ANY line, not just the draft's first).
 *                                    v1.12: a caret mid-content CUTS the
 *                                    line there — the tail moves down and
 *                                    becomes the new item's content (byte
 *                                    faithful, nothing trimmed); caret at
 *                                    line start / inside the marker / at
 *                                    the line end keeps the append-below
 *   R2  `1. item` + Shift+Enter  → next line pre-seeded with `2. `
 *                                    (n+1); deleting a member line of a
 *                                    numbered list closes the gap below
 *                                    (1. 2. 3. 4. minus `2.` → 1. 2. 3.)
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
 *                                    line head clear over `␣␣1. ` /
 *                                    `␣␣- ` (indent included) to the
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
 *                                    unit: the trailing space after `-`
 *                                    /`*` joins the "•" dot in the
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
 *   R3  `` `code` `` in a line   → inner text styled as inline code
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
 *   R4  ``` + Shift+Enter        → fence skeleton (``` / empty / ```), caret
 *                                    on the empty line; Shift+Enter inside a
 *                                    fence inserts a paragraph instead of a
 *                                    soft break
 *   R5  ```…``` regions          → rendered as ONE code block: the whole
 *                                    fenced region gets the code-block look
 *                                    (banner with the language id + body
 *                                    lines in the code font, same tokens as
 *                                    the rendered message's CodeBlock), and
 *                                    the ``` marker lines are hidden — the
 *                                    glyphs live on in the draft text, so
 *                                    sending stays byte-for-byte literal. A
 *                                    caret on a marker line reveals the raw
 *                                    marker (small, muted) so it can be
 *                                    edited or deleted. Activation is
 *                                    deferred: typing ``` alone renders
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
 *                                    soft lines (`<br>` from the native
 *                                    Shift+Enter, literal `
` from
 *                                    multi-line paste) INSIDE one
 *                                    paragraph — so the restyle pass first
 *                                    promotes every fence-adjacent soft
 *                                    line boundary to a real paragraph
 *                                    break (text projection identical),
 *                                    making ``` at the head of ANY line —
 *                                    not just paragraph heads — open a
 *                                    block.
 *   E2  empty `- ` + Shift+Enter → prefix removed, empty paragraph kept
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
 *     `__lexicalEditor`; it is re-resolved per event because the composer
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
 *     The ``` markers are hidden with font-size:0 — the text stays in the
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
    './constants': function (module, exports, require) {
    /**
     * Shared constants and line grammars.
     *
     * Module convention for this bundle: every src/client/ file is a
     * CommonJS-style body that scripts/build.mjs wraps as
     * function (module, exports, require) inside client.js. The wrapper's
     * `require` resolves sibling modules by relative id ('./constants',
     * './editor', …) through the in-bundle registry — it is NOT the DSH
     * module-table require the bundle factory receives.
     */

    /** Lexical TextNode code format bit (IS_CODE = 1 << 4). */
    const IS_CODE = 1 << 4;
    /** History tag that folds an update into the previous undo entry. */
    const HISTORY_MERGE_TAG = 'history-merge';
    /** The composer contenteditable (Lexical root element). */
    const COMPOSER_INPUT = '[data-composer-input]';
    /** Slash/at trigger menu visibility probe (role=listbox inside the card). */
    const MENU_PROBE = '[data-composer-card] [role="listbox"]';
    /** Backtick char code. */
    const BACKTICK = 96;
    /** Legacy IME-composition keyCode engines emit without isComposing. */
    const IME_KEYCODE = 229;
    /** Safari can deliver the closing keydown AFTER compositionend. */
    const RECENT_COMPOSITION_MS = 10;
    /** Self-triggered restyle writes allowed per rolling second (loop guard). */
    const MAX_WRITES_PER_SECOND = 16;

    /** Spaces of indent one nesting level adds/removes (the Tab ladder). */
    const LEVEL_STEP = 2;

    /** Non-empty bullet item line: `- x` / `* x`, any indent (nesting, v2.8). */
    const BULLET_RE = /^(\s*)([-*]) \S/;
    /** Non-empty ordered item line: `1. x` … `999999999. x`, any indent. */
    const NUMBER_RE = /^(\s*)(\d{1,9})\. \S/;
    /** Bullet prefix with no content (Enter here exits the list). */
    const EMPTY_BULLET_RE = /^(\s*)([-*]) $/;
    /** Ordered prefix with no content (Enter here exits the list). */
    const EMPTY_NUMBER_RE = /^(\s*)(\d{1,9})\. $/;
    /** Any ordered item line — with content or a bare prefix — used to
     *  group a list for renumbering (content may also be empty). */
    const ORDERED_ITEM_RE = /^(\s*)(\d{1,9})\. (?=\S|$)/;
    /** Any bullet item line — with content or a bare prefix — used for
     *  the atomic marker delete (the marker dies as one unit). */
    const BULLET_ITEM_RE = /^(\s*)([-*]) (?=\S|$)/;
    /** A continuation marker that carries an ordered number (`2. `). */
    const ORDERED_MARKER_RE = /^\d{1,9}\. $/;
    /** Any fence-marker line (``` at paragraph start, CommonMark indent ≤ 3). */
    const FENCE_MARKER_RE = /^\s{0,3}```/;
    /** A fence-OPENING line: exactly ``` + optional language id. */
    const FENCE_OPEN_RE = /^\s{0,3}```[A-Za-z0-9_+#.-]*\s*$/;
    /** DOM classes the fence pass toggles on composer paragraphs. */
    const FENCE_CLASS_OPEN = 'dmd-fence-open';
    const FENCE_CLASS_BODY = 'dmd-fence-body';
    const FENCE_CLASS_CLOSE = 'dmd-fence-close';
    /** Legacy raw-reveal class (v1.2-1.4); scrubbed from stale elements. */
    const FENCE_CLASS_RAW = 'dmd-raw';
    /** Attribute carrying the fence language id for the CSS badge. */
    const FENCE_LANG_ATTR = 'data-dmd-lang';
    /** DOM class the code-delimiter pass puts on a rendered pair's
     *  backtick text leaves (hidden glyphs; revealed near the caret). */
    const CODE_DELIM_CLASS = 'dmd-code-delim';
    /** DOM class the list-marker pass puts on an ordered item's digit
     *  leaves (rendered in the code font, distinct from body text). */
    const LIST_NUM_CLASS = 'dmd-list-num';
    /** DOM class the list-marker pass puts on a bullet item's dash/star
     *  leaf (ink hidden at zero advance; a "•" dot renders in place). */
    const LIST_BULLET_CLASS = 'dmd-list-bullet';
    /** DOM class the list-marker pass puts on a bullet item's trailing
     *  SPACE leaf — the gap after the dot joins the marker's code font,
     *  so the whole "- " atom renders as one "• " unit (v2.4). */
    const LIST_BULLET_SPACE_CLASS = 'dmd-list-bullet-space';

    module.exports = {
      IS_CODE,
      HISTORY_MERGE_TAG,
      COMPOSER_INPUT,
      MENU_PROBE,
      BACKTICK,
      IME_KEYCODE,
      RECENT_COMPOSITION_MS,
      MAX_WRITES_PER_SECOND,
      LEVEL_STEP,
      BULLET_RE,
      NUMBER_RE,
      EMPTY_BULLET_RE,
      EMPTY_NUMBER_RE,
      ORDERED_ITEM_RE,
      BULLET_ITEM_RE,
      ORDERED_MARKER_RE,
      FENCE_MARKER_RE,
      FENCE_OPEN_RE,
      FENCE_CLASS_OPEN,
      FENCE_CLASS_BODY,
      FENCE_CLASS_CLOSE,
      FENCE_CLASS_RAW,
      FENCE_LANG_ATTR,
      CODE_DELIM_CLASS,
      LIST_NUM_CLASS,
      LIST_BULLET_CLASS,
      LIST_BULLET_SPACE_CLASS,
    };
    },

    './editor': function (module, exports, require) {
    /**
     * Host-editor contract seam — the only module that touches the
     * host's underscore internals (the fact contracts F2/F6/F7 in the
     * tech doc: __lexicalEditor, _nodes, _nodeMap, _selection,
     * _compositionKey). Everything else in the bundle reaches the
     * editor THROUGH these helpers, so an upgrade that breaks one
     * degrades in ONE place: warnContract fires once and the plugin
     * becomes a safe no-op.
     */
    const { COMPOSER_INPUT, MENU_PROBE } = require('./constants');

    let contractWarned = false;

    /** Warn once about a broken host/editor contract, then stay quiet. */
    function warnContract(detail) {
      if (contractWarned) return;
      contractWarned = true;
      console.warn('[dsh-composer-markdown] host contract missing; plugin inert', detail);
    }

    /**
     * Resolve the live composer editor (F2: Lexical hangs the instance
     * off the contenteditable root element). Re-resolved per call: the
     * composer is rebuilt per session, so a cached instance would be
     * disposed.
     * @returns {object|null} the Lexical editor, or null when absent
     * (no session / workspace picker / not yet mounted).
     */
    function resolveEditor() {
      const el = document.querySelector(COMPOSER_INPUT);
      if (!(el instanceof HTMLElement)) return null;
      const editor = el.__lexicalEditor;
      return editor ?? null;
    }

    /**
     * The real node class for a registered type, from the editor's own
     * registry (so created nodes belong to the host's lexical copy —
     * bundling a second lexical would split module state and node
     * classes).
     * @param {object} editor - the live editor.
     * @param {string} type - node type string ('paragraph' | 'text' | …).
     * @returns {Function|null} the class, or null when unknown.
     */
    function klassOf(editor, type) {
      const entry = editor._nodes?.get?.(type);
      return entry?.klass ?? null;
    }

    /**
     * Whether the slash/at trigger menu is currently visible (F12: a
     * visible listbox inside the composer card owns the Enter keys).
     * @returns {boolean}
     */
    function isTriggerMenuVisible() {
      const menu = document.querySelector(MENU_PROBE);
      return menu instanceof HTMLElement && menu.offsetParent !== null;
    }

    /** The editor state's live node map (blocks looked up by key). */
    function nodeMapOf(editor) {
      return editor.getEditorState()._nodeMap;
    }

    /** The root block's children as an array (empty when unusable). */
    function rootBlocksOf(editor) {
      const root = nodeMapOf(editor)?.get?.('root');
      if (root == null || typeof root.getChildren !== 'function') return [];
      return root.getChildren();
    }

    /** The live selection object (anchor/focus points), or null. */
    function selectionOf(editor) {
      return editor.getEditorState()._selection;
    }

    /**
     * The LIVE selection as of RIGHT NOW: inside an in-flight
     * editor.update() the pending state carries the current selection
     * (earlier callbacks in the same batch may already have moved it —
     * a marker hop, a caret placement), while getEditorState() answers
     * with the last COMMITTED state. Check-then-move re-plans (the
     * caret-home stage) must read through here or they act on stale
     * positions and yank the caret back. Outside an update the pending
     * state is null and this reads exactly like selectionOf.
     * @param {object} editor - the live editor.
     * @returns {object|null} the active selection, or null.
     */
    function liveSelectionOf(editor) {
      const pending = editor._pendingEditorState;
      return pending != null && pending._selection !== undefined
        ? pending._selection
        : selectionOf(editor);
    }

    /**
     * The LIVE node map (same pending-vs-committed rule as
     * liveSelectionOf): inside an in-flight update, lookups resolve the
     * versions earlier same-batch callbacks produced. Node METHODS
     * resolve the active state on their own, but direct data reads
     * (getTextContent) on a committed-map node see stale text.
     * @param {object} editor - the live editor.
     * @returns {Map|null} the active node map.
     */
    function liveNodeMapOf(editor) {
      const pending = editor._pendingEditorState;
      return pending != null && pending._nodeMap !== undefined
        ? pending._nodeMap
        : nodeMapOf(editor);
    }

    /**
     * The composition key Lexical maintains while an IME owns the
     * caret (null/undefined when idle) — the restyle pass yields to it.
     */
    function compositionKeyOf(editor) {
      return editor._compositionKey;
    }

    module.exports = {
      warnContract,
      resolveEditor,
      klassOf,
      isTriggerMenuVisible,
      nodeMapOf,
      liveNodeMapOf,
      rootBlocksOf,
      selectionOf,
      liveSelectionOf,
      compositionKeyOf,
    };
    },

    './grammar': function (module, exports, require) {
    /**
     * The line grammar — the pure string substrate the whole bundle
     * shares. Everything the planners and projections say about the
     * draft is said in THIS vocabulary: blocks flatten to text, text
     * splits into VISUAL LINES ('\n' from a soft break and a pasted
     * newline are the same thing), fence markers pair over those lines
     * under the committed-coverage rule, and a caret resolves to the
     * one line it is editing. Deriving any of this per feature is what
     * the pre-v3 code did seven times per scan; it lives here now,
     * once.
     */
    const { FENCE_MARKER_RE } = require('./constants');

    /**
     * Pair fence-marker lines sequentially (odd/even rule): the 1st
     * marker opens, the 2nd closes, the 3rd opens again… An unclosed
     * open extends to end-of-draft.
     * @param {readonly string[]} lines - one text per line (blocks or
     *   visual lines — the grammar is the same).
     * @returns {{open: number, close: number}[]} close === Infinity for unclosed.
     */
    function computeFenceIntervals(lines) {
      const intervals = [];
      let open = -1;
      for (let i = 0; i < lines.length; i += 1) {
        if (!FENCE_MARKER_RE.test(lines[i])) continue;
        if (open === -1) {
          open = i;
        } else {
          intervals.push({ open, close: i });
          open = -1;
        }
      }
      if (open !== -1) intervals.push({ open, close: Infinity });
      return intervals;
    }

    /**
     * Whether one line/block index is COVERED by a fence region, under the
     * committed-fence model: a CLOSED interval (both markers present)
     * covers open..close; an UNCOMMITTED (unclosed) interval covers only
     * its own opening-marker line — the marker stays recognized (soft-line
     * promotion, the Shift+Enter commit gesture, grammar guards) while
     * every line below it keeps its plain-text behavior (lists, inline
     * code, native edits). This is the single derivation of fence
     * coverage; planners must not re-hand-roll the old "unclosed extends
     * to end-of-draft" swallow.
     * @param {{open: number, close: number}[]} intervals - fence intervals
     *   (close === Infinity for unclosed).
     * @param {number} i - the line/block index under test.
     * @returns {boolean}
     */
    function fenceCoversLine(intervals, i) {
      return intervals.some(
        ({ open, close }) => (close !== Infinity ? i >= open && i <= close : i === open),
      );
    }

    /**
     * The visual-line model of a whole draft: every block's text split
     * on '\n' into lines (each carrying its block index and its flat
     * [start, end) span inside that block), the fence intervals over
     * those lines, and the two queries every planner asks — which line
     * holds a caret position, and which lines live inside a fence.
     * @param {readonly string[]} texts - one flattened text per block.
     * @returns {{
     *   texts: readonly string[],
     *   lines: {block: number, start: number, end: number, text: string}[],
     *   intervals: {open: number, close: number}[],
     *   last: number,
     *   lineIndexAt(block: number, offset: number): number,
     *   inFence(i: number): boolean,
     * }}
     */
    function visualModelOf(texts) {
      const lines = [];
      texts.forEach((text, block) => {
        let start = 0;
        for (let i = 0; i < text.length; i += 1) {
          if (text.charCodeAt(i) !== 10) continue;
          lines.push({ block, start, end: i, text: text.slice(start, i) });
          start = i + 1;
        }
        lines.push({ block, start, end: text.length, text: text.slice(start) });
      });
      const intervals = computeFenceIntervals(lines.map((line) => line.text));
      const last = lines.length - 1;
      return {
        texts,
        lines,
        intervals,
        last,
        /** The visual line holding (blockIndex, flat offset); the
         *  boundary case offset === line.start belongs to that line.
         *  -1 when the block is unknown. */
        lineIndexAt(block, offset) {
          for (let i = last; i >= 0; i -= 1) {
            if (lines[i].block === block && lines[i].start <= offset) return i;
          }
          return -1;
        },
        /** Whether visual line i sits inside a fence region (the
         *  committed-fence coverage rule — see fenceCoversLine). */
        inFence(i) {
          return fenceCoversLine(intervals, i);
        },
      };
    }

    /**
     * Whether a flat selection [lo, hi) genuinely covers at least one
     * character of the char run [start, end) — the ONE reveal rule the
     * edit-state glyph styling shares (hidden inline-code ticks, list
     * markers): a styled glyph run surfaces its raw characters only
     * while the selection truly sweeps over one of them. A collapsed
     * caret (lo === hi) covers nothing at all; a range adjacent on
     * either side covers nothing either — covering means straddling at
     * least one character of the run.
     * @param {number} start - the run's first char offset.
     * @param {number} end - the run's end offset (exclusive, > start).
     * @param {number} lo - the selection's low flat offset.
     * @param {number} hi - the selection's high flat offset.
     * @returns {boolean}
     */
    function selectionCoversRange(start, end, lo, hi) {
      return lo < end && start < hi;
    }

    /**
     * The shared caret-line resolution every marker/list planner opens
     * with: the collapsed caret's visual line, or null when the caret
     * is unusable (no selection, unknown block). This is the preamble
     * that used to be hand-copied into six planners.
     * @param {ReturnType<visualModelOf>} model - the shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset.
     * @returns {{v: number, line: {block: number, start: number, end: number, text: string}}|null}
     */
    function caretLineOf(model, caret) {
      if (caret === null || model.texts[caret.index] === undefined) return null;
      const v = model.lineIndexAt(caret.index, caret.offset);
      if (v < 0) return null;
      return { v, line: model.lines[v] };
    }

    /**
     * caretLineOf plus the fence guard: the line the caret is editing
     * must sit OUTSIDE every fence region for the list grammar to own
     * it (a `1. `/`- ` inside a fence is code, not a list).
     * @param {ReturnType<visualModelOf>} model - the shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset.
     * @returns {{v: number, line: object}|null}
     */
    function editableLineOf(model, caret) {
      const hit = caretLineOf(model, caret);
      return hit !== null && !model.inFence(hit.v) ? hit : null;
    }

    module.exports = {
      computeFenceIntervals,
      fenceCoversLine,
      visualModelOf,
      selectionCoversRange,
      caretLineOf,
      editableLineOf,
    };
    },

    './doc': function (module, exports, require) {
    /**
     * The document read: ONE coherent view of the composer draft's
     * NODES that every planner and every edit shares.
     *
     *   BLOCKS — root children flattened into leaves (text runs,
     *   reference chips, line breaks) with flat char geometry, so
     *   plans and edits address content by (block index, flat char
     *   offset) instead of node-key arithmetic.
     *
     *   CARET — the selection resolved onto that geometry (block index
     *   + flat offset, collapsed-caret shape, per-block covered
     *   ranges), each in a committed and a LIVE (pending-update)
     *   flavor.
     *
     * The string side of the model (visual lines, fences) lives in
     * ./grammar; this module is the only one that reads nodes.
     */
    const {
      nodeMapOf,
      rootBlocksOf,
      selectionOf,
      liveSelectionOf,
    } = require('./editor');

    /**
     * @typedef {{kind: 'text'|'chip'|'br', node: object|null, text: string}} Leaf
     * @typedef {{node: object, leaves: Leaf[], text: string}} Block
     */

    /**
     * Flatten one block's children into leaves. Text-ish nodes
     * (including the composer-text-ref subclass) carry their node;
     * reference chips are opaque atomic leaves (their clipboard text
     * counts toward the line but they can never be formatted); line
     * breaks contribute '\n' and carry their node too (the soft-line
     * pass needs the handle to promote one into a paragraph break).
     * @param {object} blockNode - a root child element node.
     * @returns {Block} the block view.
     */
    function makeBlock(blockNode) {
      const leaves = [];
      const walk = (element) => {
        for (const kid of element.getChildren()) {
          const type = kid.__type;
          if (typeof kid.__text === 'string') {
            leaves.push({ kind: 'text', node: kid, text: kid.getTextContent() });
          } else if (type === 'reference-chip') {
            leaves.push({ kind: 'chip', node: kid, text: kid.getTextContent() });
          } else if (type === 'linebreak') {
            leaves.push({ kind: 'br', node: kid, text: '\n' });
          } else if (typeof kid.getChildren === 'function') {
            walk(kid);
          }
        }
      };
      if (typeof blockNode.getChildren === 'function') walk(blockNode);
      return { node: blockNode, leaves, text: leaves.map((leaf) => leaf.text).join('') };
    }

    /**
     * Read the current blocks. Valid inside read() and update() alike —
     * node methods resolve the latest state on their own.
     * @param {object} editor - the live editor.
     * @returns {Block[]} blocks in document order.
     */
    function readBlocks(editor) {
      return rootBlocksOf(editor).map(makeBlock);
    }

    /**
     * The top-level block index holding one selection key, walking up
     * the parent chain to a root child (-1 when the key is unusable).
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @param {unknown} key - a selection anchor/focus node key.
     * @returns {number} index into blocks, or -1.
     */
    function blockIndexForKey(editor, blocks, key) {
      if (typeof key !== 'string') return -1;
      let node = nodeMapOf(editor)?.get?.(key);
      let guard = 0;
      while (node != null && guard < 64) {
        guard += 1;
        const parent = typeof node.getParent === 'function' ? node.getParent() : null;
        if (parent != null && parent.getKey?.() === 'root') {
          const blockKey = node.getKey();
          return blocks.findIndex((block) => block.node.getKey() === blockKey);
        }
        node = parent;
      }
      return -1;
    }

    /**
     * Map one selection endpoint (anchor/focus) to a flat char offset
     * inside its block. A text leaf carries the offset directly; a
     * line-break leaf maps its 0/1 side; an element selection on the
     * paragraph itself maps to the boundary BEFORE its offset-th
     * child — the sum of the text lengths of the preceding children
     * (v2.7: a mid-children element selection no longer snaps to the
     * block end; offset 0 is still the block start, and an offset
     * past the last child is still the block end).
     * @param {Block} block - the block view.
     * @param {unknown} key - the endpoint's node key.
     * @param {unknown} offset - the endpoint's offset.
     * @returns {number|null} the flat offset, or null when unusable.
     */
    function flatOffsetForKey(block, key, offset) {
      if (key === block.node.getKey()) {
        if (offset === 0) return 0;
        const kids = typeof block.node.getChildren === 'function'
          ? block.node.getChildren()
          : [];
        let flat = 0;
        for (let i = 0; i < Math.min(offset, kids.length); i += 1) {
          flat += typeof kids[i]?.getTextContent === 'function'
            ? kids[i].getTextContent().length
            : 0;
        }
        return flat;
      }
      let flat = 0;
      for (const leaf of block.leaves) {
        if (leaf.node.getKey() === key) {
          if (leaf.kind === 'text') return flat + Math.min(offset, leaf.text.length);
          return flat + (offset > 0 ? 1 : 0);
        }
        flat += leaf.text.length;
      }
      return null;
    }

    /**
     * The caret's block index AND flat char offset inside that block —
     * the visual line the caret is editing starts at the previous '\n'
     * after this offset. Range selections use the anchor (Shift+Enter
     * arbitration is anchor-driven).
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, offset: number}|null} null when unusable.
     */
    function caretBlockPoint(editor, blocks) {
      return caretBlockPointFrom(selectionOf(editor), editor, blocks);
    }

    /**
     * caretBlockPoint against the LIVE selection (inside an in-flight
     * editor.update, where getEditorState() still answers with the last
     * committed state): the commit-time re-plans of the caret-home
     * stage read through here so they never act on a position a newer
     * same-batch update has already left.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, offset: number}|null} null when unusable.
     */
    function caretBlockPointLive(editor, blocks) {
      return caretBlockPointFrom(liveSelectionOf(editor), editor, blocks);
    }

    /** caretBlockPoint's core over an explicit selection object. */
    function caretBlockPointFrom(selection, editor, blocks) {
      const anchor = selection?.anchor;
      if (anchor?.key === undefined) return null;
      const index = blockIndexForKey(editor, blocks, anchor.key);
      if (index < 0) return null;
      const block = blocks[index];
      if (block === undefined) return null;
      const offset = flatOffsetForKey(block, anchor.key, anchor.offset ?? 0);
      return offset === null ? null : { index, offset };
    }

    /**
     * The flat char ranges the selection genuinely covers, ONE entry
     * per touched block — the glyph-reveal test's input (a hidden tick
     * or marker glyph shows only while a range covers it). Same-block
     * endpoints yield the single [lo, hi) span between them (a
     * collapsed caret covers nothing); cross-block selections (v2.7:
     * Ctrl+A over a multi-paragraph draft, a drag across paragraphs)
     * project per block: the upper endpoint's block keeps its span
     * down to the block end, blocks in between are fully covered, and
     * the lower endpoint's block is covered up to its endpoint. Null
     * for missing selections or unresolvable keys.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, lo: number, hi: number}[]|null}
     */
    function selectionCoveredRanges(editor, blocks) {
      const selection = selectionOf(editor);
      const anchor = selection?.anchor;
      const focus = selection?.focus;
      if (anchor?.key === undefined || focus?.key === undefined) return null;
      const aIndex = blockIndexForKey(editor, blocks, anchor.key);
      const fIndex = blockIndexForKey(editor, blocks, focus.key);
      if (aIndex < 0 || fIndex < 0) return null;
      const a = flatOffsetForKey(blocks[aIndex], anchor.key, anchor.offset ?? 0);
      const f = flatOffsetForKey(blocks[fIndex], focus.key, focus.offset ?? 0);
      if (a === null || f === null) return null;
      if (aIndex === fIndex) {
        return [{ index: aIndex, lo: Math.min(a, f), hi: Math.max(a, f) }];
      }
      const down = aIndex < fIndex; // the anchor sits above the focus
      const ranges = [];
      for (let i = Math.min(aIndex, fIndex); i <= Math.max(aIndex, fIndex); i += 1) {
        const len = blocks[i]?.text.length ?? 0;
        let lo = 0;
        let hi = len;
        if (i === aIndex) {
          if (down) lo = a;
          else hi = a;
        }
        if (i === fIndex) {
          if (down) hi = f;
          else lo = f;
        }
        ranges.push({ index: i, lo: Math.min(lo, hi), hi: Math.max(lo, hi) });
      }
      return ranges;
    }

    /**
     * The collapsed caret as an atomic-key point: which block it sits
     * in and whether it rests on the block's first/last character.
     * Range selections (and missing/blurred selections) yield null —
     * the atomic fence/list gestures only apply to a plain collapsed
     * caret.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, atStart: boolean, atEnd: boolean}|null}
     */
    function caretPoint(editor, blocks) {
      return caretPointFrom(selectionOf(editor), editor, blocks);
    }

    /**
     * caretPoint against the LIVE selection (same pending-vs-committed
     * rule as caretBlockPointLive — see there).
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, atStart: boolean, atEnd: boolean}|null}
     */
    function caretPointLive(editor, blocks) {
      return caretPointFrom(liveSelectionOf(editor), editor, blocks);
    }

    /** caretPoint's core over an explicit selection object. */
    function caretPointFrom(selection, editor, blocks) {
      const anchor = selection?.anchor;
      const focus = selection?.focus;
      if (anchor?.key === undefined || focus?.key === undefined) return null;
      if (anchor.key !== focus.key || anchor.offset !== focus.offset) return null;
      const index = blockIndexForKey(editor, blocks, anchor.key);
      if (index < 0) return null;
      const block = blocks[index];
      if (block === undefined) return null;
      if (block.text === '') return { index, atStart: true, atEnd: true };
      const first = block.leaves[0];
      const lastLeaf = block.leaves[block.leaves.length - 1];
      const atStart = first !== undefined && first.kind === 'text'
        && first.node.getKey() === anchor.key && anchor.offset === 0;
      const atEnd = lastLeaf !== undefined && lastLeaf.kind === 'text'
        && lastLeaf.node.getKey() === anchor.key && anchor.offset === lastLeaf.text.length;
      return { index, atStart, atEnd };
    }

    /**
     * Blocks whose whole text was spliced away but which still strand
     * zero-length leaf "husks" (the unmergeable glyph leaves of a
     * marker-only line survive Lexical's normalization). A text
     * selection anchored in such a husk cannot reach the DOM, so the
     * repairs stage strips these blocks back to the pristine childless
     * paragraph. Pure query over the read blocks.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{node: object, keys: string[]}[]} one entry per husk
     *   block, carrying the removable leaf keys.
     */
    function huskBlocksOf(blocks) {
      const husks = [];
      blocks.forEach((block) => {
        if (block.text !== '' || block.leaves.length === 0) return;
        husks.push({
          node: block.node,
          keys: block.leaves
            .map((leaf) => (leaf.node != null && typeof leaf.node.getKey === 'function'
              ? leaf.node.getKey()
              : null))
            .filter((key) => typeof key === 'string'),
        });
      });
      return husks;
    }

    module.exports = {
      makeBlock,
      readBlocks,
      blockIndexForKey,
      flatOffsetForKey,
      caretBlockPoint,
      caretBlockPointLive,
      selectionCoveredRanges,
      caretPoint,
      caretPointLive,
      huskBlocksOf,
    };
    },

    './fence-plan': function (module, exports, require) {
    /**
     * Pure fence planning (unit-tested through __internals).
     *
     * Fence grammar is line grammar (./grammar): intervals and coverage
     * arrive pre-computed on the shared model, so every function here
     * is a pure projection (roles, soft-line promotion, pairs) or a
     * pure decision plan (atomic keys, marker nudges, orphan cleanup)
     * over it. The one hybrid is closedFencePairs, which reads block
     * node keys from the block views (never the editor itself).
     */
    const { FENCE_MARKER_RE, FENCE_OPEN_RE } = require('./constants');

    /**
     * Map a visual line to the BLOCK it wholly IS (-1 unless the line
     * spans exactly one whole block). The fence grammar speaks visual
     * lines; the DOM pass, the fence key plans and the pair tracker
     * speak paragraphs — this is the one translation point. After the
     * normalize stage every fence line is its own paragraph, so the
     * mapping is the identity there; an unpromoted transient (a fence
     * still sharing a paragraph with other lines) maps to -1 and its
     * consumers simply treat the fence as not-yet-atomic.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {number} v - the visual line index.
     * @returns {number} the block index, or -1 when the line is not a
     *   whole block.
     */
    function wholeBlockOf(model, v) {
      const line = model.lines[v];
      if (line === undefined || line.start !== 0) return -1;
      if (line.end !== model.texts[line.block].length) return -1;
      return line.block;
    }

    /**
     * The language id of a fence-opening line ('```py' → 'py', '```' →
     * null). Tolerates ≤3 leading spaces and trailing whitespace.
     * @param {string} line - the flattened opening-marker text.
     * @returns {string|null} the language id, or null when bare/unknown.
     */
    function fenceLangOf(line) {
      const m = FENCE_OPEN_RE.exec(line);
      if (m === null) return null;
      const lang = line.trim().slice(3).trim();
      return lang.length > 0 ? lang : null;
    }

    /**
     * Per-line fence roles: which VISUAL lines form each fenced code
     * block. The opening marker renders as the block banner (language
     * badge, markers hidden), interior lines as the code body, the
     * closing marker as the block's bottom padding.
     *
     * ACTIVATION IS COMMIT-ONLY: a fence with no closing ``` renders
     * NOTHING — every line stays plain text. The box materializes only
     * when the pair completes: the Shift+Enter commit gesture on the
     * marker line (skeleton, or the fence-commit tail split) or a
     * closing ``` landing on any line below (typed, pasted, restored).
     * So typing ``` at the head of a line — even mid-draft with content
     * below — never swallows that content into a box; content below an
     * uncommitted marker keeps its ordinary behavior everywhere, and
     * the markers themselves never show inside a rendered box.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{role: 'open'|'body'|'close'|null, lang: string|null}[]}
     *   one entry per visual line, in order.
     */
    function fenceRolesOf(model) {
      const roles = model.lines.map(() => ({ role: null, lang: null }));
      for (const { open, close } of model.intervals) {
        if (close === Infinity) continue; // uncommitted fence: plain text
        roles[open] = { role: 'open', lang: fenceLangOf(model.lines[open].text) };
        for (let i = open + 1; i < close; i += 1) {
          roles[i] = { role: 'body', lang: null };
        }
        roles[close] = { role: 'close', lang: null };
      }
      return roles;
    }

    /**
     * Per-BLOCK fence roles for the DOM styling pass: which PARAGRAPH
     * elements form each fenced code block. The DOM pass classes
     * paragraph elements, so the per-line roles fold onto blocks one
     * line per block — a block that carries a role must be exactly its
     * line. A multi-line block folds to null: the normalize stage
     * promotes every fence-adjacent soft boundary to a paragraph break
     * first (the "never style a mixed paragraph for a frame" rule), so
     * by the time this projection is read, a block mixing lines never
     * takes marker styling.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{role: 'open'|'body'|'close'|null, lang: string|null}[]}
     *   one entry per block, in order.
     */
    function blockRolesOf(model) {
      const lineRoles = fenceRolesOf(model);
      const roles = Array.from({ length: model.texts.length }, () => null);
      const linesPerBlock = Array.from({ length: model.texts.length }, () => 0);
      model.lines.forEach((line, v) => {
        const count = linesPerBlock[line.block] + 1;
        linesPerBlock[line.block] = count;
        roles[line.block] = count === 1 ? lineRoles[v] : null;
      });
      return roles;
    }

    /**
     * Soft line boundaries that must become paragraph breaks so the
     * fence grammar recognizes markers typed at the head of ANY line,
     * not just paragraph heads: ``` after a soft break (Shift+Enter)
     * or inside a pasted block. A boundary between visual lines v-1
     * and v is promoted when either side is covered by a fence region
     * (the committed-coverage rule of ./grammar): a CLOSED fence
     * isolates the open marker, the close marker, and every interior
     * line, each as its own paragraph (a mixed paragraph like ```…\ncode
     * would otherwise take the marker's zero-height/close styling and
     * hide the other line's text); an UNCOMMITTED fence isolates only
     * its marker line — enough for the commit gesture to reach it —
     * while the plain lines below keep their soft representation.
     * Lines outside fences keep their soft representation — only
     * fence-context boundaries are touched. The promotion is
     * text-identical: the removed '\n' leaf serializes exactly like
     * the '\n' gap between blocks, so the draft/send text stays
     * byte-for-byte.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {number[][]} per block, ascending flat char offsets where a
     * soft line begins and the paragraph must split.
     */
    function softSplitsOf(model) {
      const splits = Array.from({ length: model.texts.length }, () => []);
      for (let v = 1; v <= model.last; v += 1) {
        const line = model.lines[v];
        if (line.start === 0) continue; // paragraph head: already a hard boundary
        if (model.inFence(v - 1) || model.inFence(v)) {
          splits[line.block].push(line.start);
        }
      }
      return splits;
    }

    /**
     * A bare closing fence line: exactly ``` (≤3 leading spaces,
     * nothing else). Only such verbatim lines are eligible for orphan
     * cleanup.
     * @param {string} text - the flattened line text.
     * @returns {boolean}
     */
    function isBareCloseMarker(text) {
      return FENCE_MARKER_RE.test(text) && text.trim() === '```';
    }

    /**
     * Orphan-close cleanup: when a closed fence's OPENING marker
     * paragraph is fully deleted — the paragraph is gone, or its text
     * is emptied because the user removed the ``` symbols — while its
     * closing ``` paragraph still sits there verbatim, that close is
     * scaffold the pair no longer supports: plan its removal (plus the
     * emptied open line) so nothing lingers in the composer. Pairing
     * rides on paragraph node keys tracked across restyle passes, so
     * index shifts never confuse it; a line the user is mid-edit on
     * (still has content) stays watched, never nuked, and a bare
     * trailing ``` with no pair history (the user just typing one) is
     * never touched.
     * @param {{openKey: string, closeKey: string}[]} prevPairs - pairs
     *   tracked by the previous pass.
     * @param {{openKey: string, closeKey: string}[]} pairs - closed-fence
     *   pairs in the current draft.
     * @param {{key: string, text: string}[]} current - current blocks as
     *   {key, text}, in document order.
     * @param {string[]} caretKeys - block keys under anchor/focus.
     * @returns {{removeKeys: string[], reselectKey: string|null,
     *   keepPairs: {openKey: string, closeKey: string}[]}}
     */
    function planOrphanCleanup(prevPairs, pairs, current, caretKeys) {
      const byKey = new Map(current.map((block) => [block.key, block.text]));
      const order = new Map(current.map((block, i) => [block.key, i]));
      const liveCloses = new Set(pairs.map((pair) => pair.closeKey));
      const caret = new Set(caretKeys);
      const keep = pairs.slice();
      const remove = [];
      for (const prev of prevPairs) {
        const intact = pairs.some(
          (pair) => pair.openKey === prev.openKey && pair.closeKey === prev.closeKey,
        );
        if (intact) continue;
        const closeText = byKey.get(prev.closeKey);
        // Close gone or repurposed by the user → nothing to clean.
        if (closeText === undefined || !isBareCloseMarker(closeText)) continue;
        // The close now pairs with a different open → leave it alone.
        if (liveCloses.has(prev.closeKey)) continue;
        const openText = byKey.get(prev.openKey);
        const openEmpty = openText !== undefined && openText.trim() === '';
        if (openText !== undefined && !openEmpty) {
          keep.push(prev); // mid-edit line: keep watching, never delete content
          continue;
        }
        // Open paragraph gone entirely, or its marker fully deleted.
        remove.push(prev.closeKey);
        if (openEmpty) remove.push(prev.openKey);
      }
      let reselectKey = null;
      if (remove.length > 0 && remove.some((key) => caret.has(key))) {
        // The caret sits in a block being removed — hand it to the nearest
        // surviving neighbour (prefer the block after, for edit flow).
        const doomed = new Set(remove);
        const indexes = remove
          .map((key) => order.get(key))
          .filter((i) => i !== undefined)
          .sort((a, b) => a - b);
        const after = indexes
          .map((i) => current[i + 1])
          .find((block) => block !== undefined && !doomed.has(block.key));
        const before = indexes
          .map((i) => current[i - 1])
          .filter((block) => block !== undefined && !doomed.has(block.key))
          .pop();
        reselectKey = (after ?? before)?.key ?? null;
      }
      return { removeKeys: remove, reselectKey, keepPairs: keep };
    }

    /**
     * Closed-fence pairs of the current draft, keyed by paragraph node
     * keys (identity survives line insertions/deletions around them).
     * The fence grammar speaks visual lines while pairs speak
     * paragraphs, so each marker line maps through wholeBlockOf — in
     * the promoted world (the normalize stage guarantees it before
     * anything acts) the two vocabularies coincide; an unpromoted
     * transient simply yields no pair this pass.
     * @param {Block[]} blocks - the read blocks.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{openKey: string, closeKey: string}[]}
     */
    function closedFencePairs(blocks, model) {
      const pairs = [];
      for (const { open, close } of model.intervals) {
        if (close === Infinity) continue;
        const openBlock = wholeBlockOf(model, open);
        const closeBlock = wholeBlockOf(model, close);
        if (openBlock === -1 || closeBlock === -1) continue;
        const openNode = blocks[openBlock];
        const closeNode = blocks[closeBlock];
        if (openNode === undefined || closeNode === undefined) continue;
        pairs.push({ openKey: openNode.node.getKey(), closeKey: closeNode.node.getKey() });
      }
      return pairs;
    }

    /**
     * The caret point of a fence key plan: which block a collapsed caret
     * sits in and whether it rests on the block's first/last character.
     * @typedef {{index: number, atStart: boolean, atEnd: boolean}} CaretPoint
     */

    /**
     * Atomic fence key plan: Backspace / Delete / ArrowUp / ArrowDown at a
     * boundary of a COMMITTED fenced block treat the ```…``` region as
     * one object. Deleting into the box from any side UNWRAPS it — both
     * marker lines go, every body line survives as a plain paragraph
     * (one undo step restores the markers), and the caret stays where
     * it is: all four gesture positions sit in surviving blocks. The
     * vertical arrows skip over the marker lines instead of landing the
     * caret inside them, so the user never perceives the ``` glyphs at
     * all. Uncommitted (unclosed) fences are plain text and never
     * matched, and so is a fence still awaiting soft-line promotion —
     * the marker lines must BE paragraphs for the unwrap to remove.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {CaretPoint|null} point - the collapsed caret, or null.
     * @param {'Backspace'|'Delete'|'ArrowUp'|'ArrowDown'} key - the key.
     * @returns {null | {kind: 'fence-unwrap', open: number, close: number,
     *   caret: number} |
     *   {kind: 'fence-skip-up', open: number} |
     *   {kind: 'fence-skip-down', close: number}}
     *   null → not ours; the native key behavior proceeds. The unwrap
     *   plan carries the caret's block index so the applier can home
     *   it only in the empty-fence edge (caret on a marker line).
     */
    function planFenceKey(model, point, key) {
      if (point === null) return null;
      const { index, atStart, atEnd } = point;
      for (const { open, close } of model.intervals) {
        if (close === Infinity) continue; // uncommitted fence: plain text
        const openBlock = wholeBlockOf(model, open);
        const closeBlock = wholeBlockOf(model, close);
        if (openBlock === -1 || closeBlock === -1) continue; // unpromoted yet
        if (key === 'Backspace' && atStart) {
          if (index === openBlock + 1 || index === closeBlock + 1) {
            return { kind: 'fence-unwrap', open: openBlock, close: closeBlock, caret: index };
          }
        }
        if (key === 'Delete' && atEnd) {
          if (index === openBlock - 1 || index === closeBlock - 1) {
            return { kind: 'fence-unwrap', open: openBlock, close: closeBlock, caret: index };
          }
        }
        if (key === 'ArrowUp' && atStart && index === openBlock + 1) {
          return { kind: 'fence-skip-up', open: openBlock };
        }
        if (key === 'ArrowDown' && atEnd && index === closeBlock - 1) {
          return { kind: 'fence-skip-down', close: closeBlock };
        }
      }
      return null;
    }

    /**
     * Caret homing plan: a collapsed caret that somehow landed on a
     * zero-height marker paragraph of a COMMITTED fence (click on the
     * box edges, programmatic moves) moves to the adjacent content
     * line — the markers stay completely imperceptible, with no
     * invisible-caret dead zone. Uncommitted (unclosed) fences never
     * nudge: their marker line is plain text the user may well be
     * typing on. When no content line sits between the markers (an
     * empty ```/``` pair) the caret hops OUT of the box entirely, so
     * successive passes converge instead of bouncing a caret between
     * the two marker lines forever.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {CaretPoint|null} point - the collapsed caret, or null.
     * @returns {{index: number, where: 'start'|'end'}|null} the block
     *   index to home into, or null when the caret is already fine
     *   (or has nowhere better to go).
     */
    function planMarkerNudge(model, point) {
      if (point === null) return null;
      const last = model.texts.length - 1;
      let role = null;
      let interval = null;
      for (const iv of model.intervals) {
        if (iv.close === Infinity) continue; // uncommitted fence: plain text
        const openBlock = wholeBlockOf(model, iv.open);
        const closeBlock = wholeBlockOf(model, iv.close);
        if (openBlock === -1 || closeBlock === -1) continue; // unpromoted yet
        if (point.index === openBlock) {
          role = 'open';
          interval = { open: openBlock, close: closeBlock };
          break;
        }
        if (point.index === closeBlock) {
          role = 'close';
          interval = { open: openBlock, close: closeBlock };
          break;
        }
      }
      if (role === null) return null;
      const { open, close } = interval;
      if (role === 'open' && close - 1 > open) return { index: open + 1, where: 'start' };
      if (role === 'close' && close - 1 > open) return { index: close - 1, where: 'end' };
      // No content line to home into: hop out of the box (prefer the
      // paragraph after it); nowhere to go → leave the caret alone.
      const after = close + 1 <= last ? close + 1 : null;
      const before = open - 1 >= 0 ? open - 1 : null;
      const index = after ?? before;
      return index === null ? null : { index, where: 'start' };
    }

    module.exports = {
      fenceLangOf,
      fenceRolesOf,
      blockRolesOf,
      softSplitsOf,
      isBareCloseMarker,
      wholeBlockOf,
      planOrphanCleanup,
      closedFencePairs,
      planFenceKey,
      planMarkerNudge,
    };
    },

    './code-plan': function (module, exports, require) {
    /**
     * Inline-code grammar and its per-block projections (unit-tested
     * through __internals). The pairing kernel is a pure string
     * function; the projections consume the shared line model
     * (./grammar) — fence coverage arrives pre-computed instead of
     * being re-derived here.
     */
    const { BACKTICK } = require('./constants');
    const { selectionCoversRange } = require('./grammar');

    /**
     * Whether a char may not sit DIRECTLY inside a backtick delimiter:
     * spaces/tabs, line breaks (a span must not cross lines), and the
     * full-width siblings (NBSP, ideographic space) CJK IMEs produce.
     * @param {number} code - the char code to test.
     * @returns {boolean} true when the char is blank.
     */
    function isBlankEdge(code) {
      return code === 32 || code === 9 || code === 10 || code === 13
        || code === 0xa0 || code === 0x3000;
    }

    /**
     * Inline-code spans for one line: backticks pair left-to-right, and a
     * pair renders ONLY when its content is a non-empty, single-line run
     * that does not start or end with a blank char — the char right after
     * the opening backtick and the char right before the closing backtick
     * must both be non-blank (so `` ` x` ``, `` `x ` `` and pairs glued
     * across a soft newline never light up). An invalid pair's backticks
     * are inert: neither re-opens a later span, and a trailing unpaired
     * backtick affects nothing.
     * @param {string} text - the line's flattened text.
     * @returns {{start: number, end: number}[]} spans in line coordinates.
     */
    function computeInlineCodeSpans(text) {
      const spans = [];
      let open = -1;
      for (let i = 0; i < text.length; i += 1) {
        if (text.charCodeAt(i) !== BACKTICK) continue;
        if (open === -1) {
          if (i + 1 < text.length && !isBlankEdge(text.charCodeAt(i + 1))) open = i;
          continue;
        }
        const nonEmpty = i > open + 1;
        // No '\n' may sit inside [open+1, i) — spans never cross lines.
        const nl = text.indexOf('\n', open + 1);
        if (nonEmpty && !isBlankEdge(text.charCodeAt(i - 1)) && (nl === -1 || nl >= i)) {
          spans.push({ start: open + 1, end: i });
          open = -1;
        } else {
          // Broken pair (empty / blank inner edge / line crossing): both
          // backticks are consumed as inert literals.
          open = -1;
        }
      }
      return spans;
    }

    /**
     * The desired code spans of the whole draft, per block, in flat
     * block coordinates (pure projection over the shared line model).
     * Committed fence regions carry NO inline spans at all — their code
     * look comes from the DOM fence pass (block classes on the
     * paragraph elements), and the diff→write convergence clears any
     * stale IS_CODE bits that predate a fence growing around them. An
     * uncommitted fence's marker line is excluded too (its backticks
     * are markers-in-waiting), while the plain lines BELOW it pair
     * normally. Outside fences: inline pairing per visual line — a
     * pair may never cross a line, so line-scoped pairing IS the
     * grammar (and a newline can no longer silently glue two ticks of
     * different lines into an inert pair).
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{start: number, end: number}[][]} spans per block index.
     */
    function codeSpansOf(model) {
      const spans = Array.from({ length: model.texts.length }, () => []);
      model.lines.forEach((line, v) => {
        if (model.inFence(v)) return;
        for (const span of computeInlineCodeSpans(line.text)) {
          spans[line.block].push({ start: line.start + span.start, end: line.start + span.end });
        }
      });
      return spans;
    }

    /**
     * Flat positions of the BACKTICK delimiters of every valid span in
     * one line (span {start, end} → its opening tick at start-1 and its
     * closing tick at end). Inert backticks — unpaired ones, and both
     * ticks of an invalid pair — are absent: they stay visible. The
     * styling pass isolates each of these chars into its own text leaf
     * so the DOM pass can hide exactly these glyphs.
     * @param {string} text - the line's flattened text.
     * @returns {number[]} ascending delimiter positions.
     */
    function computeCodeDelims(text) {
      const delims = [];
      for (const { start, end } of computeInlineCodeSpans(text)) {
        delims.push(start - 1, end);
      }
      delims.sort((a, b) => a - b);
      return delims;
    }

    /**
     * The desired delimiter positions of the whole draft, per block —
     * same fence exclusion as the spans (a committed fence's backticks
     * are markers, not inline delimiters). Pure projection over the
     * shared line model.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {number[][]} delimiter positions per block index.
     */
    function codeDelimsOf(model) {
      const delims = Array.from({ length: model.texts.length }, () => []);
      model.lines.forEach((line, v) => {
        if (model.inFence(v)) return;
        for (const at of computeCodeDelims(line.text)) {
          delims[line.block].push(line.start + at);
        }
      });
      return delims;
    }

    /**
     * Whether one pair's backticks must momentarily SHOW (escape the
     * hiding class) — the shared reveal rule (./grammar selectionCovers
     * Range): the flat caret range must genuinely cover at least one
     * character of a tick run. A COLLAPSED caret (lo === hi) covers
     * nothing: the ticks hide the instant the pair closes (caret sits
     * right after the closing tick) and stay hidden while the caret
     * travels inside the span or brushes past either side. They
     * surface again only while a range selection genuinely sweeps over
     * one of the two tick glyphs — opening at start-1, closing at end
     * — so any edit that selects a tick shows the honest markdown
     * (select-what-you-see). A broken pair's ticks are never hidden in
     * the first place.
     * @param {{start: number, end: number}} span - the code span.
     * @param {number} lo - the selection's low flat caret offset.
     * @param {number} hi - the selection's high flat caret offset.
     * @returns {boolean} true when the pair's ticks must be shown.
     */
    function shouldRevealCodeDelims(span, lo, hi) {
      return selectionCoversRange(span.start - 1, span.start, lo, hi)
        || selectionCoversRange(span.end, span.end + 1, lo, hi);
    }

    module.exports = {
      isBlankEdge,
      computeInlineCodeSpans,
      computeCodeDelims,
      shouldRevealCodeDelims,
      codeSpansOf,
      codeDelimsOf,
    };
    },

    './enter-plan': function (module, exports, require) {
    /**
     * Pure Shift+Enter arbitration (unit-tested through __internals).
     *
     * ONE decision tree over the shared line model (./grammar): the
     * caret resolves to its visual line once, the fence branch reads
     * the model's pre-computed intervals, and the list branch reads
     * the model's pre-computed lines and coverage. Plain Enter is
     * never routed here — it always keeps its native submit.
     */
    const {
      BULLET_RE,
      NUMBER_RE,
      EMPTY_BULLET_RE,
      EMPTY_NUMBER_RE,
      FENCE_MARKER_RE,
      FENCE_OPEN_RE,
    } = require('./constants');
    const { wholeBlockOf } = require('./fence-plan');

    /**
     * The fence-arbitration verdict for a caret on (or inside) a fence
     * region — the commit-vs-break decision tree.
     * @typedef {{kind: 'fence-close'}}
     *   | {kind: 'fence-commit', offset: number}
     *   | {kind: 'fence-newline', offset: number}
     *   | {kind: 'fence-exit'} FencePlan
     */

    /**
     * The UNCOMMITTED-open verdict: the caret sits on the opening
     * marker line of an unclosed fence (a ``` typed anywhere — draft
     * end, mid-draft line head, even a line with trailing content) and
     * Shift+Enter is the commit gesture. Two flavors, told apart by
     * where the caret rests on the line:
     *
     *   fence-close — the line is exactly a marker (```/```lang, per
     * FENCE_OPEN_RE) AND the caret sits at the line end, past the
     * ticks into the language id, or anywhere inside the ticks of a
     * bare marker: the classic three-line skeleton (``` / empty /
     * ```), the language id kept as the badge. Lines below the marker
     * stay below the close, never inside the box.
     *
     *   fence-commit — the ticks were just typed at a content line's
     * head (the caret is at/inside the tick run, or the tail is not a
     * bare language id): split the line AT THE MARKER'S END, insert
     * the skeleton between the halves, and move the whole tail below
     * the closing marker. The tail is the user's content, not a
     * language id, so it must survive verbatim outside the box.
     *
     * A caret before the ticks (offset 0) is plain text: native break
     * — on a bare marker line too (v2.7; the caret was moved to the
     * line head deliberately, so the gesture stays out of the way).
     * @param {string} text - the marker line's text.
     * @param {number} at - the caret's offset on that line.
     * @returns {FencePlan|null}
     */
    function commitPlanForOpenLine(text, at) {
      const marker = FENCE_MARKER_RE.exec(text);
      if (marker === null) return null;
      const markerEnd = marker[0].length;
      const clean = FENCE_OPEN_RE.test(text);
      if (clean && at > 0 && (markerEnd === text.length || at > markerEnd)) {
        return { kind: 'fence-close' };
      }
      if (at > 0) return { kind: 'fence-commit', offset: markerEnd };
      return null; // caret before the ticks: plain text, native break
    }

    /**
     * Decide what one markdown-editing Shift+Enter should do at the
     * caret. The caret is (caret, offset) in BLOCK coordinates; the
     * shared model resolves it to a visual line and every branch —
     * fences first, then lists — speaks that line.
     *
     * Fence arbitration runs first, COMMITTED fences only for the
     * interior (open < line < close): a body line breaks AT THE CARET
     * — everything after it moves to the new line/paragraph — the open
     * marker line of a completed pair appends a body line below itself
     * (never splits the marker), and the close marker line breaks
     * after the block. An uncommitted fence's marker line takes the
     * commit gesture (see commitPlanForOpenLine); every line BELOW an
     * uncommitted marker is ordinary text and falls through to the
     * list grammar.
     *
     * Lists read the caret's VISUAL line from the shared model — the
     * slice of the paragraph between the '\n' boundaries around the
     * caret offset — so `- ` / `1. ` typed at the head of a soft line
     * (native Shift+Enter break, multi-line paste) continues the list
     * too, not just at a paragraph head.
     *
     * A paragraph that holds no soft lines makes the caret's visual
     * line the whole block, and the plan is the paragraph-level one (a
     * new paragraph below); inside a soft paragraph the continuation
     * rides a soft line break at the split point (text projection:
     * the inserted '\n' + prefix is exactly what the paragraph path
     * writes across blocks).
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {number} caret - the caret's block index.
     * @param {number} [offset] - the caret's flat char offset inside that
     *   block (default: the block's end).
     * @returns {FencePlan |
     *   {kind: 'list-continue', indent: string, marker: string} |
     *   {kind: 'list-continue-soft', indent: string, marker: string, offset: number} |
     *   {kind: 'list-exit', prefix: string} |
     *   {kind: 'list-exit-soft', prefix: string, offset: number}}
     *   null → not ours; let DSH's native Shift+Enter (soft break) run.
     */
    function computeEnterPlan(model, caret, offset) {
      const blockText = model.texts[caret] ?? '';
      const flat = typeof offset === 'number'
        ? Math.max(0, Math.min(offset, blockText.length))
        : blockText.length;
      const v = model.lineIndexAt(caret, flat);
      if (v < 0) return null;
      const line = model.lines[v];
      // Fence branch: the caret's visual line against the model's
      // intervals (line-local caret offset for the commit flavors).
      // Paragraph-level fence plans apply only when the caret's line
      // IS a paragraph (wholeBlockOf): a marker or body line still
      // living inside a soft-lined paragraph falls through to the
      // native soft break — the restyle normalize stage promotes it
      // to a real paragraph and the gesture reaches the branch then.
      const at = flat - line.start;
      if (wholeBlockOf(model, v) !== -1) {
        for (const { open, close } of model.intervals) {
          if (v === open) {
            // Uncommitted marker line: the commit gesture. Completed
            // pair's open marker: append a body line below it — never
            // split the marker itself.
            if (close === Infinity) return commitPlanForOpenLine(line.text, at);
            return { kind: 'fence-newline', offset: line.end };
          }
          if (v === close) return { kind: 'fence-exit' };
          // Body line of a committed fence: break AT THE CARET — the
          // tail after it moves to the new line (uncommitted interiors
          // are plain text and fall through to the list grammar below).
          if (close !== Infinity && v > open && v < close) {
            return { kind: 'fence-newline', offset: flat };
          }
        }
      }
      // Fence guard at the visual level: a list prefix on a soft line
      // that lives inside a (yet unpromoted) visual fence interval is
      // fence content, not a list (R4-ac3 semantics).
      if (model.inFence(v)) return null;
      // Paragraph-level plans when the caret line is the whole block;
      // soft plans (flat offset) when soft lines surround it.
      const firstOfBlock = v === 0 || model.lines[v - 1].block !== line.block;
      const lastOfBlock = v === model.last || model.lines[v + 1].block !== line.block;
      const soft = !(firstOfBlock && lastOfBlock);
      // The continuation SPLIT point: with the caret inside the content
      // (past the line's own prefix, before the line end) the line is
      // cut AT THE CARET — everything after it moves down and becomes
      // the new item's content; anywhere else (line start, inside the
      // marker, line end) the classic append-below applies and the
      // line keeps its bytes.
      const splitOffset = (prefixEnd) => (prefixEnd <= flat && flat < line.end ? flat : line.end);
      let m = BULLET_RE.exec(line.text);
      if (m !== null) {
        const cut = splitOffset(line.start + m[1].length + m[2].length + 1);
        return soft
          ? { kind: 'list-continue-soft', indent: m[1], marker: `${m[2]} `, offset: cut }
          : { kind: 'list-continue', indent: m[1], marker: `${m[2]} `, offset: cut };
      }
      m = NUMBER_RE.exec(line.text);
      if (m !== null) {
        const next = Number.parseInt(m[2], 10) + 1;
        const cut = splitOffset(line.start + m[1].length + m[2].length + 2);
        return soft
          ? { kind: 'list-continue-soft', indent: m[1], marker: `${next}. `, offset: cut }
          : { kind: 'list-continue', indent: m[1], marker: `${next}. `, offset: cut };
      }
      m = EMPTY_BULLET_RE.exec(line.text);
      if (m !== null) {
        return soft
          ? { kind: 'list-exit-soft', prefix: `${m[1]}${m[2]} `, offset: line.start }
          : { kind: 'list-exit', prefix: `${m[1]}${m[2]} ` };
      }
      m = EMPTY_NUMBER_RE.exec(line.text);
      if (m !== null) {
        return soft
          ? { kind: 'list-exit-soft', prefix: `${m[1]}${m[2]}. `, offset: line.start }
          : { kind: 'list-exit', prefix: `${m[1]}${m[2]}. ` };
      }
      return null;
    }

    module.exports = { commitPlanForOpenLine, computeEnterPlan };
    },

    './list-plan': function (module, exports, require) {
    /**
     * Pure ordered-list planning (unit-tested through __internals).
     *
     * THE RENUMBER INVARIANT (v2.6, nesting-aware v2.7): every ordered
     * RUN — ordered-item lines of one indent, outside fences,
     * spanning paragraph and soft-line breaks alike, with deeper
     * lines (a nested list, wrapped item text) merely SUSPENDING it —
     * is numbered 1..n from its first member, ALWAYS. The planner is
     * STATE-DRIVEN: it reads the draft as it stands and rewrites only
     * the members whose digits differ — no memory of previous passes,
     * no event to catch. Whatever the arrival path, the next restyle
     * pass converges on the invariant:
     *
     *   · a member line deleted → the gap closes below it;
     *   · a run SPLIT by a plain/bullet/fence line or a blank (an
     *     empty item exited with Shift+Enter, a paragraph typed or
     *     pasted into the middle) → the tail run RESTARTS at 1;
     *   · two runs MERGED by deleting the line between them → one
     *     continuous count fuses them (1. 2. + 1. 2. → 1. 2. 3. 4.);
     *   · a NESTED stretch (deeper indent) between members → the
     *     run resumes past it: `1. / ␣␣1. / 2.` keeps its `2.` —
     *     the nested block is content of the item above it, never a
     *     split (v2.7; a shallower indent or a line at the run's own
     *     level still ends the run);
     *   · a paste or an undo/redo → whatever state it restores is
     *     normalized as it stands.
     *
     * Deliberate trade: a run cannot HOLD a non-1 start or a manual
     * gap — typed digits snap continuous, because continuity IS the
     * feature's contract (the same rule the gesture cascade
     * planListShiftDown always enforced for the runs it touches;
     * v2.6 extends it to every run, every path).
     *
     * The marker itself is ONE ATOM throughout the surface (v2.2):
     * Backspace/Delete already remove it whole, the horizontal arrows
     * travel over it whole (planListMarkerHop), and its glyphs restyle
     * as one visual unit (markerGlyphsOf) — digits in the code font,
     * the bullet dash rendered as a "•" dot — while every byte stays
     * literal in draft, clipboard and send text. Since v2.3 no
     * collapsed caret ever RESTS inside it either, whichever way it
     * arrived (planListMarkerCaretHome, run by the restyle engine's
     * caret-home stage). Since v2.8 the atom is the WHOLE line head —
     * the indent joins it (grammar now nests at any depth): arrows
     * hop over indent+marker as one unit, a caret never rests inside
     * the indent, and Delete at the line head removes the whole
     * thing. The LEVEL LADDER rides the same atom: Tab indents an
     * item (and its whole subtree) one LEVEL_STEP of spaces,
     * Shift+Tab / Backspace-at-the-atom-end lifts it — a top-level
     * item leaving the list keeps its content as plain text
     * (planListLevelShift).
     *
     * Every planner here consumes the SHARED line model (./grammar)
     * through the same caret-line preamble — the run grouping and the
     * fence guard arrive pre-computed instead of being re-derived per
     * function (v3 collapsed six hand-copied preambles into
     * editableLineOf). Because the plan is a pure function of the
     * current draft, it needs no cross-pass memory at all.
     */
    const { ORDERED_ITEM_RE, BULLET_ITEM_RE, LEVEL_STEP } = require('./constants');
    const { caretLineOf, editableLineOf } = require('./grammar');

    /**
     * Parse one line's ordered-item descriptor.
     * @param {string} text - the visual line's text.
     * @returns {{indent: string, digits: string}|null}
     */
    function orderedItemOf(text) {
      const m = ORDERED_ITEM_RE.exec(text);
      return m === null ? null : { indent: m[1], digits: m[2] };
    }

    /**
     * The ordered-item descriptor of the line a collapsed caret sits
     * on (outside every fence), or null — the shared preamble of the
     * caret-driven marker planners.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset.
     * @returns {{v: number, line: object, m: RegExpExecArray}|null}
     */
    function editableItemOf(model, caret) {
      const hit = editableLineOf(model, caret);
      if (hit === null) return null;
      const m = BULLET_ITEM_RE.exec(hit.line.text) ?? ORDERED_ITEM_RE.exec(hit.line.text);
      return m === null ? null : { ...hit, m };
    }

    /**
     * The LIST-ITEM ATOM the caret's line carries: indent + marker as
     * ONE unit (v2.8 — the indent joined the marker atom the day the
     * grammar started nesting). start is the LINE head, end the
     * content head; both are legal caret rest points, the open range
     * between them is not (arrows hop it, the caret-home stage
     * evicts strays, Backspace at end / Delete at start treat it as
     * one deletion unit). Outside fences only — a marker-looking
     * prefix inside a fence is code, not a list.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset.
     * @returns {{v: number, line: object, indent: string, marker: string,
     *   start: number, end: number}|null}
     */
    function listItemAtomOf(model, caret) {
      const hit = editableItemOf(model, caret);
      if (hit === null) return null;
      const { line, m } = hit;
      return {
        v: hit.v,
        line,
        indent: m[1],
        marker: m[0].slice(m[1].length),
        start: line.start,
        end: line.start + m[0].length,
      };
    }

    /**
     * The indent width of the PARENT CONTEXT of visual line v: the
     * nearest ITEM line strictly above it, skipping plain lines of any
     * width (wrapped item text is content, not structure), stopping at
     * a blank/whitespace-only line or any fence-covered line — the
     * same block boundaries the subtree walk below uses (the renumber
     * walk is near-identical: it treats only the strictly EMPTY line
     * as its blank; a whitespace-only line additionally ends the
     * ladder's blocks so a stray-spaces separator never rides a move).
     * null when no item sits above inside the block: the line is
     * its list's first member and has nothing to nest under.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {number} v - the item's visual line index.
     * @returns {number|null} the parent item's indent width, or null.
     */
    function parentItemWidthOf(model, v) {
      for (let w = v - 1; w >= 0; w -= 1) {
        if (model.inFence(w)) return null; // a fence region ends the block
        const text = model.lines[w].text;
        if (/^\s*$/.test(text)) return null; // a blank ends the block
        const m = ORDERED_ITEM_RE.exec(text) ?? BULLET_ITEM_RE.exec(text);
        if (m !== null) return m[1].length;
      }
      return null;
    }

    /**
     * The renumber edits for the whole draft (pure, state-driven
     * v2.6, nesting-aware v2.7). Walks the model's visual lines over
     * a STACK of ordered runs (shallow → deep): a member line joins
     * the top run of its own indent — RESUMING a run that a nested
     * stretch merely suspended — a deeper member opens a child run,
     * and a blank line, a fence region, or a plain/bullet line at or
     * above a run's indent level ends it (a paragraph boundary does
     * NOT break a run: it is just another line break, exactly like a
     * soft one). Every run rewrites each member whose digits differ
     * from its 1-based position, keeping every other character
     * (indent, ". ", content) byte-identical. Members already at
     * their target emit no edit, so a settled draft costs nothing and
     * the pass converges.
     *
     * Nesting (v2.7): a line DEEPER than a run's indent — a nested
     * ordered/bullet list, wrapped item text — is content of the item
     * above it: it suspends the run instead of ending it, and the
     * outer count resumes where it left off when its own indent
     * returns (`1. a / ␣␣1. b / 2. c` keeps `2. c`; CommonMark: a
     * nested block never interrupts the enclosing list). Nested runs
     * still normalize 1..n on their own indent, exactly like every
     * other run.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{index: number, start: number, end: number,
     *   digits: string}[]} edits reference current block indexes with
     *   flat [start, end) digit ranges to replace (a soft-lined block
     *   can carry several edits; the applier walks them right-to-left
     *   so earlier splices never shift later ranges).
     */
    function renumberEditsOf(model) {
      // One walk over a STACK of runs, shallow → deep (v2.7): a
      // member line joins the top run of its own indent (resuming a
      // run a nested stretch merely SUSPENDED), a deeper line opens a
      // child run, and anything at or above a run's own indent level
      // retires it. The member's target is its 1-based position in
      // its run — the run's continuity contract.
      const edits = [];
      const runs = [];
      model.lines.forEach((line, v) => {
        const m = model.inFence(v) ? null : orderedItemOf(line.text);
        if (m === null) {
          // A blank line or a fence region ends every run outright;
          // a plain/bullet line retires every run at or above its own
          // indent — but a DEEPER line (a nested list, wrapped item
          // text) is content of the item above it: it suspends the
          // runs instead of ending them, so the outer count resumes
          // when its own indent returns (CommonMark: a nested block
          // never interrupts the enclosing list).
          if (line.text === '' || model.inFence(v)) {
            runs.length = 0;
            return;
          }
          const width = /^\s*/.exec(line.text)[0].length;
          while (runs.length > 0 && runs[runs.length - 1].indent.length >= width) runs.pop();
          return;
        }
        // A shallower member closes the nested runs above it; its own
        // indent's run — possibly suspended since a nested stretch —
        // resumes its count where it left off.
        while (runs.length > 0 && runs[runs.length - 1].indent.length > m.indent.length) runs.pop();
        let run = runs[runs.length - 1];
        if (run === undefined || run.indent !== m.indent) {
          run = { indent: m.indent, size: 0 };
          runs.push(run);
        }
        run.size += 1;
        const target = String(run.size);
        if (target === m.digits) return;
        const start = line.start + m.indent.length;
        edits.push({ index: line.block, start, end: start + m.digits.length, digits: target });
      });
      return edits;
    }

    /**
     * Plan an ATOMIC list-atom deletion (pure). The atom — indent,
     * digits, dot, space for `␣␣1. `; indent, dash, space for
     * `␣␣- ` — is one unit (v2.8 folded the indent in): a plain
     * Delete with the collapsed caret right BEFORE it (at the line
     * head) removes the whole atom in one stroke, so the indent can
     * never be eaten character by character. Backspace at the atom's
     * END is no longer this planner's — the LEVEL ladder owns that
     * gesture (planListLevelShift lifts a nested item one level and
     * unlists a top-level one). Works on ANY visual line (soft-line
     * lists included); a marker-looking prefix inside a fence is
     * code, not a list. Anything else is not ours: the native
     * per-character delete proceeds untouched.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset (null when unusable).
     * @param {'Backspace'|'Delete'} key - the deletion direction.
     * @returns {{index: number, start: number, prefix: string}|null}
     *   start is the atom's flat offset (the line head), prefix its
     *   literal chars (indent + marker); null → not ours.
     */
    function planListMarkerDelete(model, caret, key) {
      if (key !== 'Delete') return null; // Backspace at the atom end: the level ladder's
      const atom = listItemAtomOf(model, caret);
      if (atom === null) return null;
      if (caret.offset !== atom.start) return null;
      return { index: caret.index, start: atom.start, prefix: atom.indent + atom.marker };
    }

    /**
     * Plan an ATOMIC list-atom HOP for the horizontal arrows (pure,
     * v2.2; indent-inclusive since v2.8): the atom that deletes as
     * one unit also TRAVELS as one unit. A plain ArrowLeft/ArrowRight
     * never steps the caret into the atom's interior — indent and
     * marker alike —
     *
     *   ArrowRight with the caret in [start, end)  → land at END
     *   (right after the atom, the content's head);
     *   ArrowLeft  with the caret in (start, end]  → land at START
     *   (the line head, before the whole indent).
     *
     * So pressing → at the line head jumps clear over `␣␣1. `/`␣␣- `
     * in one stroke, ← at the content head jumps back over it, and a
     * caret that landed INSIDE the atom by other means (a click, a
     * collapsed selection — including one in the INDENT, which v2.7
     * still let the arrows walk through) exits to the far edge in its
     * direction of travel instead of walking the glyphs one by one.
     * The atom edges are the boundaries: a caret at START moving
     * left, or at END moving right, keeps the native key. Modifier
     * arrows (Shift+arrows build selections) are guarded off before
     * this planner: a selection may still cover the atom characters —
     * select-what-you-see keeps manual digit editing reachable. Works
     * on ANY visual line; a marker-looking prefix inside a fence is
     * code, never a list.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset (null when unusable).
     * @param {'ArrowLeft'|'ArrowRight'} key - the horizontal direction.
     * @returns {{index: number, offset: number}|null} the flat point to
     *   move the caret to; null → not ours, the native move proceeds.
     */
    function planListMarkerHop(model, caret, key) {
      const atom = listItemAtomOf(model, caret);
      if (atom === null) return null;
      if (key === 'ArrowLeft' && caret.offset > atom.start && caret.offset <= atom.end) {
        return { index: caret.index, offset: atom.start };
      }
      if (key === 'ArrowRight' && caret.offset >= atom.start && caret.offset < atom.end) {
        return { index: caret.index, offset: atom.end };
      }
      return null;
    }

    /**
     * Plan the CARET HOME for a collapsed caret resting strictly INSIDE
     * a list atom (pure, v2.3; the indent joined the interior in
     * v2.8): the atom is one unit throughout the surface, and an atom
     * has no interior for a caret to rest in — yet arrows that are
     * not ours to arbitrate (↑/↓ keep their native column-preserving
     * move) and clicks CAN land the caret between the glyphs,
     * including inside the leading indent spaces. The restyle
     * caret-home stage runs this every pass and moves such a caret to
     * the NEAREST atom edge (a tie snaps to the start, matching the
     * ArrowLeft exit), so the invariant "a collapsed caret never
     * rests inside a list atom" holds no matter how the caret
     * arrived. Edges themselves are legal rest points (the line head
     * before the whole indent, the content head after the marker) and
     * so do not move; only a range SELECTION may span the interior
     * (select-what-you-see keeps manual digit editing reachable). The
     * trigger range is OPEN on both sides — exactly the
     * planListMarkerHop geometry, resolved through the same
     * visual-line + fence guards as every other marker planner.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset (null when unusable).
     * @returns {{index: number, offset: number}|null} the flat point to
     *   home the caret to; null → the caret is already legal.
     */
    function planListMarkerCaretHome(model, caret) {
      const atom = listItemAtomOf(model, caret);
      if (atom === null) return null;
      if (caret.offset > atom.start && caret.offset < atom.end) {
        const offset = caret.offset - atom.start <= atom.end - caret.offset
          ? atom.start
          : atom.end;
        return { index: caret.index, offset };
      }
      return null;
    }

    /**
     * List-marker glyph positions per block for the styling passes
     * (pure, v2.2): every visual line the atomic grammar recognizes as
     * a list item — outside fences, indent excluded, bare prefixes
     * included — contributes the SINGLE-CHAR glyph runs that render
     * DIFFERENTLY from body text: each digit of an ordered marker
     * (`12. ` → the `1` and the `2`) and, since v2.4, BOTH chars of a
     * bullet marker (`- `/`* ` → the dash AND the trailing space), so
     * the whole atom renders as one "• " unit — the dot in place of
     * the hidden dash, the gap in the marker's own code font. One char
     * per entry, exactly the delimiter geometry of ./code-plan: the
     * shape stage isolates each of these chars into its own
     * unmergeable text leaf (single-char isolation is what converges —
     * a leaf boundary can never end up stranded INSIDE a styled run),
     * and the DOM pass classes exactly those leaves. Ordered digits
     * take the code font; a bullet dash hides its ink at zero advance
     * while a "•" dot renders in place and the trailing space joins
     * the code font. The marker bytes themselves never change: the
     * styling is edit-state only, and a selection genuinely covering a
     * glyph reveals the raw character (the shared reveal rule).
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{at: number, kind: 'num'|'bullet'|'bullet-space'}[][]}
     *   per block, the ascending flat char positions of the marker
     *   glyphs to style, each with its kind.
     */
    function markerGlyphsOf(model) {
      const perBlock = Array.from({ length: model.texts.length }, () => []);
      model.lines.forEach((line, v) => {
        if (model.inFence(v)) return;
        const ordered = ORDERED_ITEM_RE.exec(line.text);
        const bullet = ordered === null ? BULLET_ITEM_RE.exec(line.text) : null;
        const m = ordered ?? bullet;
        if (m === null) return;
        const at = line.start + m[1].length;
        if (ordered !== null) {
          for (let i = 0; i < ordered[2].length; i += 1) {
            perBlock[line.block].push({ at: at + i, kind: 'num' });
          }
        } else {
          // The bullet atom is dash + space: the dash hides its ink (a
          // "•" renders in place) and the space — m[0] always ends with
          // the grammar's literal space — joins the marker's code font,
          // so "• " reads as one styled unit before any body text.
          perBlock[line.block].push({ at, kind: 'bullet' }, { at: at + 1, kind: 'bullet-space' });
        }
      });
      return perBlock;
    }

    /**
     * Plan the renumber cascade for an ordered-list INSERTION (pure).
     * Called right after a continuation gesture placed the caret on the
     * NEW item line (marker `{n+1}. `, caret right after it): every
     * ordered member BELOW, in the same indent run, is reassigned
     * sequentially — first below := n+2, then +1 each — so the whole
     * list stays continuous and duplicate-free (`1. 2. 3.` splitting
     * between 1 and 2 becomes `1. 2. 3. 4.`, the old 2./3. shifted).
     * Members whose digits already equal the target emit no edit; a
     * manual jump below the split is pulled continuous (`1. … / 5. x`
     * with a new `2. ` becomes `1. … / 3. x`) — the feature's contract
     * is a continuous, duplicate-free run. The walk stops at the first
     * non-member line, an indent change, or a fence; bullet
     * continuations return nothing.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model, as it reads AFTER the insertion.
     * @param {{index: number, offset: number}|null} caret - the
     *   collapsed caret right after the new item's marker.
     * @returns {{index: number, start: number, end: number, digits: string}[]}
     *   splices for the members below (block index + flat digit range).
     */
    function planListShiftDown(model, caret) {
      const hit = caretLineOf(model, caret);
      if (hit === null) return [];
      const own = ORDERED_ITEM_RE.exec(hit.line.text);
      if (own === null) return []; // bullet/plain line: no cascade
      const indent = own[1];
      let expected = Number.parseInt(own[2], 10);
      const edits = [];
      for (let w = hit.v + 1; w <= model.last; w += 1) {
        // Fence content (even a yet-unpromoted soft line) stops the run.
        if (model.inFence(w)) break;
        const line = model.lines[w];
        const m = ORDERED_ITEM_RE.exec(line.text);
        if (m === null || m[1] !== indent) break; // run ends here
        expected += 1;
        const target = String(expected);
        if (target !== m[2]) {
          const start = line.start + indent.length;
          edits.push({ index: line.block, start, end: start + m[2].length, digits: target });
        }
      }
      return edits;
    }

    /**
     * Plan one rung of the list LEVEL LADDER (pure, v2.8): Tab sinks
     * the caret's item one level (indent +LEVEL_STEP spaces),
     * Shift+Tab / Backspace-at-the-atom-end lifts it — and the move
     * carries the item's WHOLE SUBTREE, recursively:
     *
     *   deeper    — the item and every line below it whose indent is
     *               strictly deeper each gain one LEVEL_STEP of
     *               leading spaces;
     *   shallower — …each LOSE min(LEVEL_STEP, their own indent);
     *   unlist    — a TOP-LEVEL item lifting further leaves the list
     *               instead: its whole atom (indent — empty here —
     *               plus marker) dies and the content stays as plain
     *               text, while the subtree below still rises one
     *               level.
     *
     * SINKING IS CAPPED (v2.9): an item may sit at most ONE level
     * below its parent context — the nearest item line above, plain
     * lines skipped, blanks/fences ending the block (parentItemWidthOf
     * — the same boundaries the subtree walk uses). A Tab that would
     * push the item deeper than parent+LEVEL_STEP — including any Tab
     * on a list's FIRST item, which has nothing above to nest under —
     * plans kind 'noop': the gesture still claims the key (Tab on a
     * list line is always the ladder's), but nothing moves. Lifting
     * is never capped; level 0 is its natural floor.
     *
     * The subtree walk stops at the first line that (a) lives in a
     * fence region — fence markers and fenced bytes are never ours to
     * shift — (b) is blank/whitespace-only, ending the visual block
     * (near the renumber run semantics; the ladder also ends on a
     * whitespace-only line), or (c) carries an
     * indent at or above the item's own width: a sibling, not a
     * child. The caret may sit ANYWHERE on the item line (content
     * included) — the plan maps it through the head delta: the line
     * head stays the line head, every other legal rest point rides
     * the shift (an atom-interior position cannot occur — v2.3/v2.8
     * see to that).
     *
     * The ordered runs the move reshuffles are NOT renumbered here:
     * the restyle repairs stage converges on the renumber invariant
     * (a nested run restarts 1..n on its own indent; a plain line
     * left behind by an unlist splits the run and the tail restarts
     * at 1 — the v2.6 contract) in the same undo neighbourhood.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset (null when unusable).
     * @param {'deeper'|'shallower'} mode - the ladder direction.
     * @returns {{
     *   kind: 'indent'|'dedent'|'unlist'|'noop',
     *   edits: {index: number, at: number, remove: number, insert: string}[],
     *   caret: {index: number, offset: number},
     * }|null} edits are per touched VISUAL line, at = the line's flat
     *   start inside its block ('noop' carries none); caret is the
     *   post-edit placement. null → not an item line (or the
     *   caret/fence guards failed) — the gesture is not ours at all.
     */
    function planListLevelShift(model, caret, mode) {
      const atom = listItemAtomOf(model, caret);
      if (atom === null) return null;
      const width = atom.indent.length;
      if (mode === 'deeper') {
        // The cap: one level below the parent context at most. The
        // item may sink iff its current width is at or above the
        // nearest item above (a sibling sinks under its predecessor;
        // an item already one level below — or deeper — may not).
        const parentWidth = parentItemWidthOf(model, atom.v);
        if (parentWidth === null || width > parentWidth) {
          return { kind: 'noop', edits: [], caret: { index: caret.index, offset: caret.offset } };
        }
      }
      // The subtree: strictly deeper lines below, until a fence, a
      // blank, or a line at/below the item's own indent width.
      const members = [atom.line];
      for (let v = atom.v + 1; v <= model.last; v += 1) {
        if (model.inFence(v)) break;
        const text = model.lines[v].text;
        if (/^\s*$/.test(text)) break; // blank: end of the visual block
        if (/^\s*/.exec(text)[0].length <= width) break; // sibling, not child
        members.push(model.lines[v]);
      }
      const dedent = (line) => ({
        index: line.block,
        at: line.start,
        remove: Math.min(LEVEL_STEP, /^\s*/.exec(line.text)[0].length),
        insert: '',
      });
      let kind;
      let itemDelta; // chars the item line's head gains (indent) or loses
      const edits = [];
      if (mode === 'deeper') {
        kind = 'indent';
        itemDelta = LEVEL_STEP;
        for (const line of members) {
          edits.push({ index: line.block, at: line.start, remove: 0, insert: '  ' });
        }
      } else if (width > 0) {
        kind = 'dedent';
        itemDelta = -Math.min(LEVEL_STEP, width);
        for (const line of members) edits.push(dedent(line));
      } else {
        // Top of the ladder: the item leaves the list. The atom dies
        // whole (the indent is empty at this level), the content
        // stays; the subtree below still rises one level.
        kind = 'unlist';
        itemDelta = -atom.marker.length;
        edits.push({ index: atom.line.block, at: atom.line.start, remove: atom.marker.length, insert: '' });
        for (const line of members.slice(1)) edits.push(dedent(line));
      }
      // Caret mapping: the line head stays the line head; anything
      // else (atom end or mid-content) rides the head delta. The
      // arithmetic is line-relative, then re-based to BLOCK-flat
      // coordinates (a soft-line item's line.start is not 0).
      const at = caret.offset - atom.line.start;
      const mapped = at <= 0 ? 0 : Math.max(0, at + itemDelta);
      return {
        kind,
        edits,
        caret: { index: atom.line.block, offset: atom.line.start + mapped },
      };
    }

    module.exports = {
      orderedItemOf,
      renumberEditsOf,
      listItemAtomOf,
      parentItemWidthOf,
      planListLevelShift,
      planListMarkerDelete,
      planListMarkerHop,
      planListMarkerCaretHome,
      markerGlyphsOf,
      planListShiftDown,
    };
    },

    './analysis': function (module, exports, require) {
    /**
     * The draft analysis: ONE read of the composer's texts, assembled
     * into every pure projection the drivers consult — fence roles,
     * soft-line promotion, code spans/delimiters, list marker glyphs,
     * the renumber invariant. Each projection is computed by its
     * domain module over the shared line model (./grammar); this
     * module only composes them, so a pass costs exactly one
     * derivation of each (the pre-v3 code re-derived fences and
     * visual lines seven times per scan, once per feature).
     *
     * Eager on purpose: composer drafts are small, every restyle pass
     * needs almost every projection anyway, and one shared object is
     * what keeps the projections from ever drifting apart (they see
     * the same lines and the same fence coverage by construction).
     */
    const { visualModelOf } = require('./grammar');
    const { blockRolesOf, softSplitsOf } = require('./fence-plan');
    const { codeSpansOf, codeDelimsOf } = require('./code-plan');
    const { renumberEditsOf, markerGlyphsOf } = require('./list-plan');

    /**
     * Assemble the full analysis of one draft.
     * @param {readonly string[]} texts - one flattened text per block.
     * @returns {ReturnType<visualModelOf> & {
     *   blockRoles: ({role: 'open'|'body'|'close'|null, lang: string|null}|null)[],
     *   softSplits: number[][],
     *   spans: {start: number, end: number}[][],
     *   delims: number[][],
     *   markers: {at: number, kind: 'num'|'bullet'|'bullet-space'}[][],
     *   renumber: {index: number, start: number, end: number, digits: string}[],
     * }} the model fields (texts, lines, intervals, last, lineIndexAt,
     * inFence) plus the assembled projections.
     */
    function analyzeDraft(texts) {
      const model = visualModelOf(texts);
      return {
        ...model,
        blockRoles: blockRolesOf(model),
        softSplits: softSplitsOf(model),
        spans: codeSpansOf(model),
        delims: codeDelimsOf(model),
        markers: markerGlyphsOf(model),
        renumber: renumberEditsOf(model),
      };
    }

    module.exports = { analyzeDraft };
    },

    './edits': function (module, exports, require) {
    /**
     * The edit algebra: every mutation the plugin performs, expressed
     * as one small set of primitives over the block/leaf model.
     *
     * This is the load-bearing seam of the architecture: planners are
     * pure (plan data, unit-tested through __internals), THIS module
     * is the only code that mutates live nodes, and its callers —
     * gestures (key policy) and restyle (the convergence engine) —
     * never touch nodes directly. Every primitive runs inside
     * editor.update(), walks leaves exactly once, and treats reference
     * chips as atomic: a non-text leaf inside a touched range stops
     * the walk safely instead of corrupting it.
     */
    const { IS_CODE, HISTORY_MERGE_TAG } = require('./constants');
    const {
      warnContract,
      klassOf,
      nodeMapOf,
      liveSelectionOf,
      rootBlocksOf,
      selectionOf,
    } = require('./editor');
    const { makeBlock, readBlocks } = require('./doc');

    // ── flat-range text surgery ────────────────────────────────────────

    /**
     * Erase the flat char range [start, end) from one block, splicing
     * across whatever text leaves carry it. Returns the first touched
     * text leaf and the local offset where the range began (for caret
     * placement), or null when nothing was erased.
     * @param {Block} block - the block view.
     * @param {number} start - flat range start.
     * @param {number} end - flat range end (exclusive).
     * @returns {{node: object, at: number}|null}
     */
    function eraseFlatRange(block, start, end) {
      let flat = 0;
      let hit = null;
      for (const leaf of block.leaves) {
        const s = flat;
        const e = flat + leaf.text.length;
        flat = e;
        if (e <= start) continue; // before the range
        if (s >= end) break; // past the range
        if (leaf.kind !== 'text' || leaf.text === '') return hit; // chip/br: stay safe
        const from = Math.max(start, s) - s;
        const to = Math.min(end, e) - s;
        if (hit === null) hit = { node: leaf.node, at: from };
        leaf.node.spliceText(from, to - from, '', false);
      }
      return hit;
    }

    /**
     * Erase the flat range [start, end) and park the collapsed caret
     * where the range began — the atomic marker delete, the ordered
     * detach, and the soft empty-item exit all land the caret there.
     * The caret NEVER rests on an emptied text leaf: a text selection
     * anchored in a zero-length leaf cannot reach the DOM (the leaf's
     * element holds no text node, so Lexical's DOM-selection apply
     * bails) and the composer goes caret-less and dead. Two guards:
     * the erase emptied the WHOLE block (a marker-only line — the
     * unmergeable glyph husks would strand there forever) → strip the
     * leftover leaves and reset the paragraph to the pristine
     * empty-paragraph shape (no children, an element selection —
     * exactly a fresh composer, typeable and DOM-selectable); anything
     * less → placeFlatCaret re-reads the block and picks the first
     * NON-empty leaf at/after the range start.
     * @param {object} editor - the live editor.
     * @param {Block} block - the block view.
     * @param {number} start - flat range start.
     * @param {number} end - flat range end (exclusive).
     */
    function consumeFlatRange(editor, block, start, end) {
      const hit = eraseFlatRange(block, start, end);
      if (hit === null) return; // nothing erased: leave the caret alone
      const fresh = makeBlock(block.node);
      if (fresh.text === '') {
        for (const leaf of fresh.leaves) leaf.node.remove?.();
        if (typeof block.node.selectStart === 'function') block.node.selectStart();
        return;
      }
      placeFlatCaret(block.node, start);
    }

    /**
     * Place the collapsed caret at a flat char offset of one block, on
     * the first NON-EMPTY text leaf the offset reaches — the walk
     * selects a leaf while `offset < leafEnd`, so a position exactly
     * AT a leaf boundary lands on the NEXT non-empty text leaf's
     * start (the right leaf's start wins over the left leaf's end
     * when both touch), and a position past every leaf falls back to
     * the last non-empty text leaf's end. A fresh flatten walks the
     * CURRENT children, so callers may mutate first and pass
     * post-edit offsets. Chips cannot hold a caret; a boundary
     * against a chip falls to the adjacent text leaf.
     * @param {object} blockNode - the paragraph node.
     * @param {number} offset - flat char offset into its flattened text.
     */
    function placeFlatCaret(blockNode, offset) {
      let lastText = null;
      let flat = 0;
      for (const leaf of makeBlock(blockNode).leaves) {
        const start = flat;
        const end = flat + leaf.text.length;
        flat = end;
        if (leaf.kind !== 'text' || leaf.text === '') continue;
        if (offset < end) {
          const at = Math.max(0, offset - start);
          if (typeof leaf.node.select === 'function') leaf.node.select(at, at);
          return;
        }
        lastText = { node: leaf.node, len: leaf.text.length };
      }
      if (lastText !== null && typeof lastText.node.select === 'function') {
        lastText.node.select(lastText.len, lastText.len);
      } else if (typeof blockNode.selectEnd === 'function') blockNode.selectEnd();
      else if (typeof blockNode.selectStart === 'function') blockNode.selectStart();
    }

    // ── selection riding ───────────────────────────────────────────────

    /**
     * Shift one selection point across a text splice it follows. A point
     * inside the replaced range lands at the end of the insertion; a point
     * after it slides by the length delta; a point at or before the start
     * stays. Points are {key, offset, type} — Point.set is the host
     * editor's own mutation path (TextNode.spliceText uses it too).
     * @param {{key: string, offset: number, type: string}|undefined} point
     *   the anchor or focus of the live selection.
     * @param {string} key - the spliced text node's key.
     * @param {number} from - local splice start.
     * @param {number} to - local splice end.
     * @param {number} inserted - the replacement length.
     */
    function shiftPointOverSplice(point, key, from, to, inserted) {
      if (point == null || point.key !== key || point.type !== 'text') return;
      const delta = inserted - (to - from);
      if (delta === 0) return; // same width: every offset stays valid
      if (point.offset >= to) point.set(key, point.offset + delta, point.type);
      else if (point.offset > from) point.set(key, from + inserted, point.type);
    }

    /**
     * Apply planned digit renames inside editor.update(): splice each
     * member's digit run to its target number. Only the digit
     * characters change — indent, ". " and content stay byte-identical —
     * and any caret/selection riding a rewritten node is shifted across
     * the splice (multi-digit renumbers like 10. → 9. change the width).
     * The selection read is the LIVE one (liveSelectionOf): Lexical
     * re-derives a fresh, writable selection object for every update
     * (from the DOM), while the committed state's points are frozen
     * history — mutating those throws in dev builds and silently
     * corrupts undo history in production. Chips can never sit inside
     * a digit run; an edit whose range crosses a non-text leaf is
     * skipped rather than corrupted. A soft-lined block carries
     * SEVERAL edits: they are applied right-to-left, so a splice never
     * shifts the flat range of an edit still to come (each splice only
     * moves content to its right, and the caret shifts ride each
     * splice independently).
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the blocks read at plan time.
     * @param {{index: number, start: number, end: number, digits: string}[]} edits
     *   planned digit replacements.
     */
    function applyDigitRenames(editor, blocks, edits) {
      const selection = liveSelectionOf(editor);
      // Unique by identity: a stubbed (or aliased) collapsed caret must
      // shift once, not once per endpoint.
      const points = selection != null && selection.anchor != null && selection.focus != null
        ? [...new Set([selection.anchor, selection.focus])]
        : [];
      // Right-to-left: several members of one soft-lined paragraph
      // renumber in a single pass, and their flat ranges were computed
      // against the same read.
      const ordered = [...edits].sort((a, b) => (b.index - a.index) || (b.start - a.start));
      for (const edit of ordered) {
        const block = blocks[edit.index];
        if (block === undefined) continue;
        // Map the flat digit range onto the block's text leaves; the
        // replacement text goes into the FIRST overlapping leaf only.
        let offset = 0;
        const overlapping = [];
        let safe = true;
        for (const leaf of makeBlock(block.node).leaves) {
          const start = offset;
          const end = offset + leaf.text.length;
          offset = end;
          if (end <= edit.start || start >= edit.end) continue;
          if (leaf.kind !== 'text' || leaf.text === '') {
            safe = false; // a chip/br inside the digits: do not touch
            break;
          }
          overlapping.push({
            node: leaf.node,
            from: Math.max(start, edit.start) - start,
            to: Math.min(end, edit.end) - start,
            piece: overlapping.length === 0 ? edit.digits : '',
          });
        }
        if (!safe || overlapping.length === 0) continue;
        for (const { node, from, to, piece } of overlapping) {
          const key = node.getKey();
          node.spliceText(from, to - from, piece, false);
          for (const point of points) {
            shiftPointOverSplice(point, key, from, to, piece.length);
          }
        }
      }
    }

    // ── structural primitives ──────────────────────────────────────────

    /**
     * Append one empty paragraph after a block; null (warned) when the
     * host registry lacks the paragraph class.
     * @param {object} editor - the live editor.
     * @param {object} blockNode - the paragraph to append after.
     * @returns {object|null} the inserted paragraph node.
     */
    function newParagraphAfter(editor, blockNode) {
      const Paragraph = klassOf(editor, 'paragraph');
      if (Paragraph === null) {
        warnContract('paragraph class not registered');
        return null;
      }
      const para = new Paragraph();
      blockNode.insertAfter(para);
      return para;
    }

    /**
     * Split one paragraph at a flat char offset and grow the next
     * paragraph from the tail: everything from the split point on
     * moves into the fresh paragraph, behind its pre-seeded
     * `{prefix}` text — so a mid-line caret cuts the line there and
     * the tail becomes the new line's content. An EMPTY prefix (the
     * fence paths) skips the seed text entirely. A straddling text
     * leaf is split first (left part keeps the node key); chips/
     * line-breaks move whole. The caret rests at the start of the new
     * line — right after the prefix when there is one.
     * @param {object} editor - the live editor.
     * @param {Block} block - the caret block.
     * @param {number} offset - flat char split point.
     * @param {string} prefix - indent + list marker to pre-seed ('' for
     *   the plain fence break).
     */
    function splitTailToNewParagraph(editor, block, offset, prefix) {
      const Paragraph = klassOf(editor, 'paragraph');
      const Text = klassOf(editor, 'text');
      if (Paragraph === null || Text === null) {
        warnContract('paragraph/text node classes not registered (list split)');
        return;
      }
      const para = new Paragraph();
      const text = prefix.length > 0 ? new Text(prefix) : null;
      if (text !== null) para.append(text);
      // Find the node that starts the tail (the first node at/after the
      // split point).
      let tail = null;
      let flat = 0;
      for (const leaf of block.leaves) {
        const start = flat;
        const end = flat + leaf.text.length;
        flat = end;
        if (leaf.kind === 'text' && offset > start && offset < end) {
          try {
            leaf.node.splitText(offset - start);
          } catch {
            // stale/foreign node: leave the tail where it is
          }
          tail = leaf.node.getNextSibling();
          break;
        }
        if (offset <= start) {
          tail = leaf.node;
          break;
        }
      }
      block.node.insertAfter(para);
      while (tail != null) {
        const next = tail.getNextSibling();
        para.append(tail);
        tail = next;
      }
      if (text !== null) text.select(); // caret right after the new prefix
      else para.selectStart(); // plain break: caret at the new line's head
    }

    /**
     * Insert a soft line break + the list marker at a flat char offset
     * inside the caret block (list continuation on a SOFT line). The
     * break lands AT THE OFFSET the plan chose — the caret's own
     * position when the line is split mid-content (the tail after the
     * caret becomes the new item's content, right after the marker),
     * or the caret line's END for the classic append (any text on the
     * next soft line stays where it is). A text leaf straddling the
     * offset is split first (the left part keeps the node key); the
     * caret rests right after the marker.
     * @param {object} editor - the live editor.
     * @param {Block} block - the caret block.
     * @param {number} offset - flat char offset (the split point).
     * @param {string} marker - indent + list marker to pre-seed.
     */
    function insertSoftContinuation(editor, block, offset, marker) {
      const Break = klassOf(editor, 'linebreak');
      const Text = klassOf(editor, 'text');
      if (Break === null || Text === null) {
        warnContract('linebreak/text node classes not registered (soft list continue)');
        return;
      }
      const br = new Break();
      const text = new Text(marker);
      let flat = 0;
      let placed = false;
      for (const leaf of block.leaves) {
        const len = leaf.text.length;
        if (len === 0) continue;
        const start = flat;
        const end = flat + len;
        flat = end;
        if (offset > start && offset < end && leaf.kind === 'text') {
          // Mid-leaf: split it, then the new line follows the left part.
          let left = leaf.node;
          try {
            left = leaf.node.splitText(offset - start)[0] ?? leaf.node;
          } catch {
            // stale/foreign node: fall through to the boundary cases
          }
          left.insertAfter(br);
          placed = true;
          break;
        }
        if (offset <= start) {
          leaf.node.insertBefore(br);
          placed = true;
          break;
        }
      }
      if (!placed) block.node.append(br);
      br.insertAfter(text);
      text.select(); // caret right after the prefix
    }

    /**
     * Apply one planListLevelShift plan (the level ladder, v2.8):
     * per touched visual line, insert or remove the LEVEL_STEP run at
     * the line's flat head — the item line AND its whole subtree, in
     * ONE update (one Ctrl+Z reverts the ladder move as a whole).
     *
     * Edits are applied RIGHT-TO-LEFT over (block index, flat offset)
     * so a splice never shifts the range of an edit still to come;
     * each edit re-reads its block's leaves, so any leaf
     * fragmentation (the shape stage isolates marker glyphs into
     * single-char leaves) is walked as it stands. A removal splices
     * every text leaf its span touches (a chip/br inside the span —
     * impossible for a line's leading spaces, but guarded against
     * anyway — aborts just that edit); an insertion goes into the first
     * non-empty text leaf the offset reaches, falling back to the
     * last non-empty leaf's end. Every splice shifts the LIVE
     * selection points across it (same riding rule as
     * applyDigitRenames).
     *
     * The caret then parks at the plan's mapped offset on the item's
     * block — with the consumeFlatRange safety net: an unlisted BARE
     * marker empties its whole block, and empty husk leaves cannot
     * carry a DOM-reachable selection, so the block resets to the
     * pristine childless paragraph instead.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the blocks read at plan time.
     * @param {{kind: string, edits: {index: number, at: number,
     *   remove: number, insert: string}[], caret: {index: number,
     *   offset: number}}} plan - the planListLevelShift plan.
     */
    function applyLevelEdits(editor, blocks, plan) {
      if (plan.edits.length === 0) return; // a capped/noop plan: nothing to touch
      const selection = liveSelectionOf(editor);
      // Unique by identity: a stubbed (or aliased) collapsed caret must
      // shift once, not once per endpoint.
      const points = selection != null && selection.anchor != null && selection.focus != null
        ? [...new Set([selection.anchor, selection.focus])]
        : [];
      const ordered = [...plan.edits].sort((a, b) => (b.index - a.index) || (b.at - a.at));
      for (const edit of ordered) {
        const block = blocks[edit.index];
        if (block === undefined) continue;
        if (edit.remove > 0) {
          let offset = 0;
          const overlapping = [];
          let safe = true;
          for (const leaf of makeBlock(block.node).leaves) {
            const start = offset;
            const end = offset + leaf.text.length;
            offset = end;
            if (end <= edit.at || start >= edit.at + edit.remove) continue;
            if (leaf.kind !== 'text' || leaf.text === '') {
              safe = false; // a chip/br inside the span: do not touch
              break;
            }
            overlapping.push({
              node: leaf.node,
              from: Math.max(start, edit.at) - start,
              to: Math.min(end, edit.at + edit.remove) - start,
            });
          }
          if (!safe || overlapping.length === 0) continue;
          for (const { node, from, to } of overlapping) {
            const key = node.getKey();
            node.spliceText(from, to - from, '', false);
            for (const point of points) {
              shiftPointOverSplice(point, key, from, to, 0);
            }
          }
        } else if (edit.insert.length > 0) {
          let lastText = null;
          let target = null;
          let flat = 0;
          for (const leaf of makeBlock(block.node).leaves) {
            const start = flat;
            const end = flat + leaf.text.length;
            flat = end;
            if (leaf.kind !== 'text' || leaf.text === '') continue;
            lastText = { node: leaf.node, len: leaf.text.length };
            if (target === null && end >= edit.at) {
              target = { node: leaf.node, from: Math.max(0, edit.at - start) };
            }
          }
          const pick = target ?? (lastText !== null
            ? { node: lastText.node, from: lastText.len }
            : null);
          if (pick === null) continue; // nothing text-ish to splice into
          const key = pick.node.getKey();
          pick.node.spliceText(pick.from, 0, edit.insert, false);
          for (const point of points) {
            shiftPointOverSplice(point, key, pick.from, pick.from, edit.insert.length);
          }
        }
      }
      const block = blocks[plan.caret.index];
      if (block === undefined) return;
      if (makeBlock(block.node).text === '') {
        // The reset rule of consumeFlatRange: a bare marker unlisted
        // leaves only husk leaves — strip them, element-select.
        for (const leaf of makeBlock(block.node).leaves) leaf.node.remove?.();
        if (typeof block.node.selectStart === 'function') block.node.selectStart();
        return;
      }
      placeFlatCaret(block.node, plan.caret.offset);
    }

    /**
     * Remove blocks by node key (returns the set actually removed —
     * stale keys simply resolve to nothing).
     * @param {object} editor - the live editor.
     * @param {readonly string[]} keys - block node keys to remove.
     * @returns {Set<string>} the keys that were removed.
     */
    function removeBlockKeys(editor, keys) {
      const nodeMap = nodeMapOf(editor);
      const removed = new Set();
      for (const key of keys) {
        const node = nodeMap?.get?.(key);
        if (node != null && typeof node.remove === 'function') {
          node.remove();
          removed.add(key);
        }
      }
      return removed;
    }

    // ── plan appliers ──────────────────────────────────────────────────

    /**
     * Apply one Shift+Enter plan at the caret block. Node classes come
     * from the editor registry; caret placement rides the host's own
     * select() methods.
     * @param {object} editor - the live editor.
     * @param {ReturnType<computeEnterPlan>} plan - the plan to apply.
     * @param {Block[]} blocks - the blocks read at plan time.
     * @param {number} index - the caret's block index.
     */
    function applyEnterPlan(editor, plan, blocks, index) {
      const Paragraph = klassOf(editor, 'paragraph');
      const Text = klassOf(editor, 'text');
      if (Paragraph === null || Text === null) {
        warnContract('paragraph/text node classes not registered');
        return;
      }
      const block = blocks[index];
      if (block === undefined) return;
      switch (plan.kind) {
        case 'list-continue': {
          splitTailToNewParagraph(editor, block, plan.offset, plan.indent + plan.marker);
          return;
        }
        case 'list-continue-soft': {
          insertSoftContinuation(editor, block, plan.offset, plan.indent + plan.marker);
          return;
        }
        case 'list-exit': {
          consumeFlatRange(editor, block, 0, plan.prefix.length);
          placeFlatCaret(block.node, 0);
          return;
        }
        case 'list-exit-soft': {
          consumeFlatRange(editor, block, plan.offset, plan.offset + plan.prefix.length);
          return;
        }
        case 'fence-close': {
          const content = new Paragraph();
          const close = new Paragraph();
          close.append(new Text('```'));
          block.node.insertAfter(content);
          content.insertAfter(close);
          content.selectStart(); // caret at the empty content line
          return;
        }
        case 'fence-commit': {
          // ``` just typed at a content line's head: keep the tick run
          // as the marker line, move the whole tail (the user's
          // content) below the closing skeleton. Split first — the
          // tail paragraph lands right after the head — then squeeze
          // the empty body + close between the two halves.
          splitTailToNewParagraph(editor, block, plan.offset, '');
          const content = new Paragraph();
          const close = new Paragraph();
          close.append(new Text('```'));
          block.node.insertAfter(content);
          content.insertAfter(close);
          content.selectStart(); // caret at the empty content line
          return;
        }
        case 'fence-newline':
          // Break AT THE CARET: the tail after it becomes the new
          // line (a caret at the line end degenerates to the classic
          // append-below — the new paragraph is empty).
          splitTailToNewParagraph(editor, block, plan.offset, '');
          return;
        case 'fence-exit': {
          const para = new Paragraph();
          block.node.insertAfter(para);
          para.selectStart();
          return;
        }
        default:
          return;
      }
    }

    /**
     * Apply an atomic fence key plan inside editor.update(). A
     * committed fenced block is one object: a boundary delete UNWRAPS
     * it — both ``` marker paragraphs go, every body line survives as
     * a plain paragraph (its own undo step) — and the arrow skips
     * move the caret past the marker lines, growing an exit paragraph
     * when the box ends the draft.
     * @param {object} editor - the live editor.
     * @param {ReturnType<planFenceKey>} plan - the plan to apply.
     * @param {Block[]} blocks - the blocks read at plan time.
     */
    function applyFenceKeyPlan(editor, plan, blocks) {
      if (plan.kind === 'fence-skip-up') {
        const before = blocks[plan.open - 1];
        const first = blocks[plan.open + 1];
        if (before !== undefined && typeof before.node.selectEnd === 'function') before.node.selectEnd();
        else if (first !== undefined) first.node.selectStart(); // box opens the draft: clamp
        return;
      }
      if (plan.kind === 'fence-skip-down') {
        const after = blocks[plan.close + 1];
        if (after !== undefined) {
          after.node.selectStart();
          return;
        }
        // The box ends the draft: grow one paragraph after it so the
        // caret has somewhere to go (this is the box's exit flow).
        const para = newParagraphAfter(editor, blocks[plan.close].node);
        if (para !== null) para.selectStart();
        return;
      }
      // fence-unwrap: remove ONLY the two marker paragraphs — the body
      // lines stay, byte-identical, as plain paragraphs. All four
      // gesture positions keep the caret in a surviving block, so it
      // does not move; only the empty-fence edge (caret resting on a
      // marker line) needs homing.
      const doomed = [];
      for (const i of [plan.open, plan.close]) {
        const key = blocks[i]?.node.getKey();
        if (typeof key === 'string') doomed.push(key);
      }
      const body = blocks[plan.open + 1];
      const before = blocks[plan.open - 1];
      const after = blocks[plan.close + 1];
      removeBlockKeys(editor, doomed);
      if (plan.caret === plan.open || plan.caret === plan.close) {
        const home = body !== undefined && plan.open + 1 !== plan.close ? body : after;
        if (home !== undefined) {
          home.node.selectStart();
        } else if (before !== undefined) {
          if (typeof before.node.selectEnd === 'function') before.node.selectEnd();
          else before.node.selectStart();
        }
      }
      // The fence WAS the whole draft (empty body, no neighbours): keep
      // the composer alive with one empty paragraph.
      const root = nodeMapOf(editor)?.get?.('root');
      if (root !== null && root !== undefined && rootBlocksOf(editor).length === 0) {
        const Paragraph = klassOf(editor, 'paragraph');
        if (Paragraph === null) {
          warnContract('paragraph class missing after fence unwrap');
          return;
        }
        const para = new Paragraph();
        root.append(para);
        para.selectStart();
      }
    }

    // ── restyle-driven primitives ──────────────────────────────────────

    /**
     * Promote soft line boundaries to real paragraph breaks, inside
     * editor.update(): for one block, each planned flat-offset boundary —
     * a '\n' from a LineBreakNode leaf or a literal newline inside a text
     * leaf — splits the paragraph there. The head stays in the original
     * paragraph, the separator newline is dropped, and the tail moves into
     * a fresh paragraph after it. The clipboard projection is byte
     * identical either way (the '\n' gap between blocks serializes exactly
     * like the removed '\n' leaf), so draft, persistence, and send text
     * never change — only the paragraph structure the fence grammar reads.
     * Selections ride along: moved nodes keep their keys, so a caret in
     * the tail stays where the user put it.
     * @param {object} editor - the live editor.
     * @param {object} blockNode - the paragraph node to split.
     * @param {readonly number[]} offsets - ascending flat char offsets
     *   (into the block's flattened text) where a soft line begins.
     */
    function promoteSoftBoundaries(editor, blockNode, offsets) {
      const Paragraph = klassOf(editor, 'paragraph');
      if (Paragraph === null) {
        warnContract('paragraph class not registered (soft-line normalize)');
        return;
      }
      let current = blockNode;
      let base = 0; // flat offset of `current`'s head within the block text
      for (const offset of offsets) {
        let seek = offset - base - 1; // char index of the '\n' inside `current`
        let separator = null;
        for (const leaf of makeBlock(current).leaves) {
          if (seek < 0 || seek >= leaf.text.length) {
            seek -= leaf.text.length;
            continue;
          }
          if (leaf.kind === 'br') {
            separator = leaf.node;
          } else if (leaf.kind === 'text' && leaf.text.charCodeAt(seek) === 10) {
            // Split the leaf around the newline: [before]['\n'][after];
            // the middle part becomes the separator to drop.
            try {
              const parts = leaf.node.splitText(seek, seek + 1);
              separator = parts[1] ?? null;
            } catch {
              separator = null; // stale/foreign node: skip this boundary
            }
          } else {
            return; // '\n' inside a chip's clipboard text: atomic, unsplittable
          }
          break;
        }
        if (separator == null || typeof separator.remove !== 'function') continue;
        const para = new Paragraph();
        current.insertAfter(para);
        let mover = separator.getNextSibling();
        while (mover != null) {
          const next = mover.getNextSibling();
          para.append(mover);
          mover = next;
        }
        separator.remove();
        current = para;
        base = offset;
      }
    }

    /**
     * Whether one block's current code formatting already matches the
     * desired spans (read-side diff; no mutation). Three desired
     * shapes: the IS_CODE coverage of the span interiors, the LEAF
     * ISOLATION of the delimiter backticks, and the LEAF ISOLATION of
     * the list-marker glyphs (each styled digit / bullet dash) — each
     * rendered glyph char must sit in its own single-char text leaf
     * (marked unmergeable, or Lexical's text normalization merges it
     * straight back into its plain neighbors) so the DOM pass can
     * address (and restyle) exactly that glyph.
     * @param {Block} block - the block view.
     * @param {{start: number, end: number}[]} spans - desired code spans.
     * @param {number[]} delims - flat positions of delimiter backticks.
     * @param {number[]} [glyphs] - flat positions of list-marker glyphs.
     * @returns {boolean} true when a write is needed.
     */
    function shapeMismatch(block, spans, delims, glyphs = []) {
      let offset = 0;
      for (const leaf of block.leaves) {
        const start = offset;
        const end = offset + leaf.text.length;
        offset = end;
        if (leaf.kind !== 'text' || leaf.text === '') continue;
        const coded = (leaf.node.getFormat() & IS_CODE) !== 0;
        const covering = spans.some((span) => span.start <= start && end <= span.end);
        const overlapping = spans.some((span) => span.start < end && start < span.end);
        if (overlapping && !covering) return true; // a boundary cuts this node
        if (covering !== coded) return true; // format flip needed
        // Single-char isolation: delimiters and marker glyphs share the
        // same geometry — the leaf must be exactly the char, and it must
        // be pinned unmergeable so normalization cannot merge it back.
        const isolated = (p) => start === p && end === p + 1;
        const touched = (p) => start < p + 1 && p < end;
        for (const p of [...delims, ...glyphs]) {
          if (touched(p) && !isolated(p)) return true; // glyph not isolated
        }
        if ([...delims, ...glyphs].some(isolated)
          && typeof leaf.node.isUnmergeable === 'function'
          && !leaf.node.isUnmergeable()) return true; // isolation must stick
      }
      return false;
    }

    /**
     * Apply the desired spans to one block inside editor.update(): split
     * text nodes at span AND single-char-glyph boundaries, then set/clear
     * IS_CODE per part and pin every isolated glyph leaf unmergeable.
     * Chips are skipped (atomic); their text keeps the span geometry. The
     * delimiter and marker glyphs themselves stay UNformatted leaves —
     * their styling is a DOM-layer concern (the restyle passes), not a
     * format bit.
     * @param {Block} block - the block view.
     * @param {{start: number, end: number}[]} spans - desired code spans.
     * @param {number[]} delims - flat positions of delimiter backticks.
     * @param {number[]} [glyphs] - flat positions of list-marker glyphs.
     */
    function applyShape(block, spans, delims, glyphs = []) {
      // Split phase: collect local boundaries per text node, split once.
      const singles = [...delims, ...glyphs];
      const splits = new Map();
      let offset = 0;
      for (const leaf of makeBlock(block.node).leaves) {
        const start = offset;
        const end = offset + leaf.text.length;
        offset = end;
        if (leaf.kind !== 'text' || leaf.text === '') continue;
        const local = [];
        for (const span of spans) {
          if (span.start > start && span.start < end) local.push(span.start - start);
          if (span.end > start && span.end < end) local.push(span.end - start);
        }
        for (const p of singles) {
          if (p > start && p < end) local.push(p - start);
          if (p + 1 > start && p + 1 < end) local.push(p + 1 - start);
        }
        if (local.length > 0) {
          splits.set(leaf.node, [...new Set(local)].sort((a, b) => a - b));
        }
      }
      for (const [node, local] of splits) {
        try {
          node.splitText(...local);
        } catch {
          // A stale/foreign node simply stays unstyled this round.
        }
      }
      // Set phase: after splitting, every part is fully in or fully out.
      // A part that IS exactly a delimiter or marker glyph gets the
      // unmergeable detail bit — Lexical's text normalization merges
      // adjacent same-format simple-text leaves, and only that bit keeps
      // the one-char leaf (and the styling mark riding its element)
      // alive. Stale bits on leaves that are no longer glyphs are left
      // alone: a slightly fragmented paragraph is projection-identical
      // and harmless.
      offset = 0;
      for (const leaf of makeBlock(block.node).leaves) {
        const start = offset;
        const end = offset + leaf.text.length;
        offset = end;
        if (leaf.kind !== 'text' || leaf.text === '') continue;
        const covering = spans.some((span) => span.start <= start && end <= span.end);
        const format = leaf.node.getFormat();
        const coded = (format & IS_CODE) !== 0;
        if (covering && !coded) leaf.node.setFormat(format | IS_CODE);
        else if (!covering && coded) leaf.node.setFormat(format & ~IS_CODE);
        if (singles.some((p) => start === p && end === p + 1)
          && typeof leaf.node.isUnmergeable === 'function'
          && !leaf.node.isUnmergeable()) {
          leaf.node.toggleUnmergeable();
        }
      }
    }

    /**
     * Clear every IS_CODE bit (uninstall path) — text content untouched.
     * @param {object} editor - the live editor.
     */
    function clearCodeBits(editor) {
      try {
        editor.update(() => {
          for (const block of readBlocks(editor)) {
            for (const leaf of makeBlock(block.node).leaves) {
              if (leaf.kind !== 'text' || leaf.text === '') continue;
              const format = leaf.node.getFormat();
              if ((format & IS_CODE) !== 0) leaf.node.setFormat(format & ~IS_CODE);
            }
          }
        }, { discrete: true, tag: HISTORY_MERGE_TAG });
      } catch (error) {
        warnContract(error);
      }
    }

    module.exports = {
      eraseFlatRange,
      consumeFlatRange,
      placeFlatCaret,
      shiftPointOverSplice,
      applyDigitRenames,
      applyLevelEdits,
      newParagraphAfter,
      splitTailToNewParagraph,
      insertSoftContinuation,
      removeBlockKeys,
      applyEnterPlan,
      applyFenceKeyPlan,
      promoteSoftBoundaries,
      shapeMismatch,
      applyShape,
      clearCodeBits,
    };
    },

    './style-sheet': function (module, exports, require) {
    /**
     * Style injector: the plugin stylesheet, scoped to the composer and
     * themed by the same DSH tokens the rendered message's inline code
     * and CodeBlock use (ui-primitives markdown css: radius 12, pre
     * padding 16, code font --dsw-font-markdown-code-block).
     *
     * Every selector is composed from the class/attribute constants in
     * ./constants — the CSS and the code that toggles the classes can
     * never drift apart.
     */
    const {
      CODE_DELIM_CLASS,
      FENCE_CLASS_OPEN,
      FENCE_CLASS_BODY,
      FENCE_CLASS_CLOSE,
      FENCE_LANG_ATTR,
      LIST_NUM_CLASS,
      LIST_BULLET_CLASS,
      LIST_BULLET_SPACE_CLASS,
    } = require('./constants');

    const CODE_FONT = 'var(--ds-font-family-code, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace)';

    const CSS_TEXT = [
      '/* R3 — inline code outside fences */',
      '[data-composer-input] code {',
      '  font-family: ' + CODE_FONT + ';',
      '  font-size: 0.875em;',
      '  background-color: var(--dsw-alias-markdown-inline-code, color-mix(in oklab, currentColor 8%, transparent));',
      '  border-radius: 6px;',
      '  padding: 0 5px;',
      '}',
      '/* R3 — inline-code delimiters: the backticks of a rendered pair',
      '   are hidden glyphs with REAL font metrics. The caret derives its',
      '   height from the text node it anchors in, so font-size:0 leaves',
      '   an invisible zero-height caret the moment a pair closes (the',
      '   caret sits right after the closing tick). Instead the leaf',
      '   keeps a normal font and the glyph collapses to zero advance:',
      '   monospace + letter-spacing -1ch cancels the tick advance',
      '   exactly (ch is the monospace advance), color transparent hides',
      '   the ink. Every caret position around the glyph stays placeable',
      '   and visible. The ticks stay in the draft text and in the send',
      '   projection byte-for-byte; the DOM pass drops the class (glyph',
      '   back at normal size/color) only while a selection genuinely',
      '   covers one of the ticks. */',
      `[data-composer-input] .${CODE_DELIM_CLASS} {`,
      '  font-family: ' + CODE_FONT + ';',
      '  font-size: 0.875em;',
      '  line-height: normal;',
      '  color: transparent;',
      '  letter-spacing: -1ch;',
      '}',
      '/* LS — list markers (v2.2): the grammar\'s atomic units render',
      '   distinct from body text while every byte stays literal. The',
      '   ordered digits take the code font (monospace numbers, same',
      '   token as inline code). The bullet dash/star hides its ink at',
      '   zero advance — the delimiter trick again, real font metrics',
      '   kept so a caret anchored at the leaf keeps its height — while',
      '   an in-flow ::after dot renders in its place: `- x` and `* x`',
      '   both read as "• x". v2.5: the dot rides an ::AFTER (not',
      '   ::before) so the LEAF\'s caret geometry reads honestly — a',
      '   pseudo BEFORE the text puts the leaf\'s offset-0 caret (the',
      '   legal line head, before the dash) to the RIGHT of the dot,',
      '   i.e. visually BETWEEN the dot and the marker space, and every',
      '   hop/eviction landing at the line head looked like the caret',
      '   had entered the marker. With the dot after the zero-advance',
      '   dash, offset 0 renders at the dot\'s LEFT edge — "before the',
      '   whole marker", exactly like the ordered digits\' line head.',
      '   The dot mutes to the secondary label color (marker chrome,',
      '   not content); the digits keep the body color (they are the',
      '   number that gets sent). The DOM pass drops these classes',
      '   (raw characters back, the dot with them) only while a',
      '   selection genuinely covers one of the glyph chars.',
      '   v2.4: the bullet atom\'s trailing SPACE joins the unit — the',
      '   gap after the dot takes the marker\'s code font too, so',
      '   "• " reads as one styled whole before any body text (a space',
      '   has no ink; only its advance changes, and the reveal rule',
      '   covers it like any other glyph). */',
      `[data-composer-input] .${LIST_NUM_CLASS} {`,
      '  font-family: ' + CODE_FONT + ';',
      '}',
      `[data-composer-input] .${LIST_BULLET_CLASS} {`,
      '  font-family: ' + CODE_FONT + ';',
      '  letter-spacing: -1ch;',
      '  color: transparent;',
      '}',
      `[data-composer-input] .${LIST_BULLET_CLASS}::after {`,
      '  content: "•";',
      '  letter-spacing: normal;',
      '  color: var(--dsw-alias-label-secondary, inherit);',
      '}',
      `[data-composer-input] .${LIST_BULLET_SPACE_CLASS} {`,
      '  font-family: ' + CODE_FONT + ';',
      '}',
      '/* R5 — fenced code blocks: one visual block over consecutive',
      '   paragraphs. The ``` markers stay in the text but render at',
      '   font-size 0 (the language id rides in as the badge). */',
      `[data-composer-input] p.${FENCE_CLASS_OPEN},`,
      `[data-composer-input] p.${FENCE_CLASS_BODY},`,
      `[data-composer-input] p.${FENCE_CLASS_CLOSE} {`,
      '  margin: 0;',
      '}',
      '/* opening marker → zero-height anchor: the hidden ``` line takes no',
      '   vertical space, so the box top starts directly at the first',
      '   content line. The language id rides as an overlay badge pinned',
      "   into that line's top padding band — no banner line at all. */",
      `[data-composer-input] p.${FENCE_CLASS_OPEN} {`,
      '  position: relative;',
      '  margin-top: 8px;',
      '  font-size: 0px;',
      '  line-height: 0px;',
      '  caret-color: transparent;',
      '  padding: 0;',
      '  background: transparent;',
      '}',
      `[data-composer-input] p.${FENCE_CLASS_OPEN}::after {`,
      `  content: attr(${FENCE_LANG_ATTR});`,
      '  position: absolute;',
      '  top: 5px;',
      '  right: 16px;',
      '  font-size: 11px;',
      '  line-height: 16px;',
      '  font-family: ' + CODE_FONT + ';',
      '  color: var(--dsw-alias-label-secondary, inherit);',
      '  user-select: none;',
      '}',
      '/* interior lines → the <pre> body */',
      `[data-composer-input] p.${FENCE_CLASS_BODY} {`,
      '  font: var(--dsw-font-markdown-code-block, 0.875em/1.7 ' + CODE_FONT + ');',
      '  padding: 1px 16px;',
      '  color: var(--dsw-alias-label-primary, inherit);',
      '  background: var(--dsw-alias-markdown-code-block, color-mix(in oklab, currentColor 5%, transparent));',
      '  white-space: pre-wrap;',
      '}',
      `[data-composer-input] p.${FENCE_CLASS_OPEN} + p.${FENCE_CLASS_BODY} {`,
      '  border-radius: 12px 12px 0 0;',
      '  padding-top: 15px;',
      '}',
      '/* a language id gets a clean band for the overlay badge */',
      `[data-composer-input] p.${FENCE_CLASS_OPEN}:not([${FENCE_LANG_ATTR}=""]) + p.${FENCE_CLASS_BODY} {`,
      '  padding-top: 28px;',
      '}',
      '/* closing marker → the pre bottom padding, bottom radii */',
      `[data-composer-input] p.${FENCE_CLASS_CLOSE} {`,
      '  font-size: 0px;',
      '  line-height: 0px;',
      '  caret-color: transparent;',
      '  padding: 0 16px 16px;',
      '  margin-bottom: 8px;',
      '  background: var(--dsw-alias-markdown-code-block, color-mix(in oklab, currentColor 5%, transparent));',
      '  border-radius: 0 0 12px 12px;',
      '}',
    ].join('\n');

    /** The style tag we appended, for teardown. */
    let styleTag = null;

    /** Append the plugin stylesheet once (adopt any HMR leftover). */
    function injectStyle() {
      if (styleTag !== null) return;
      const existing = document.querySelector('style[data-plugin="dsh-composer-markdown"]');
      if (existing !== null) {
        styleTag = existing;
        return;
      }
      const tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-composer-markdown';
      tag.textContent = CSS_TEXT;
      document.head.appendChild(tag);
      styleTag = tag;
    }

    /** Remove the plugin stylesheet. */
    function removeStyle() {
      styleTag?.remove();
      styleTag = null;
      document.querySelectorAll('style[data-plugin="dsh-composer-markdown"]').forEach((tag) => tag.remove());
    }

    module.exports = { injectStyle, removeStyle };
    },

    './present': function (module, exports, require) {
    /**
     * The presentation layer: the desired DOM state of the composer
     * derived from one draft analysis, plus its appliers. Pure DOM
     * state (classList/attributes) — Lexical reuses paragraph elements
     * across commits and never resets these, so the diff is idempotent
     * and touches the editor state not at all.
     *
     * TWO mark shapes cover every edit-state visual the plugin has:
     *
     *   BLOCK marks — fence paragraph classes + the language-badge
     *   attribute (one class set per paragraph element);
     *
     *   GLYPH marks — a single-char text leaf carrying one class
     *   (hidden inline-code ticks, styled list-marker digits, hidden
     *   bullet dashes and their styled spaces). The pre-v3 code had
     *   three near-identical appliers for these; v3 has ONE engine and
     *   a table of {at, class, reveal} entries — adding a glyph kind
     *   is a row, not a pass.
     */
    const {
      COMPOSER_INPUT,
      FENCE_CLASS_OPEN,
      FENCE_CLASS_BODY,
      FENCE_CLASS_CLOSE,
      FENCE_CLASS_RAW,
      FENCE_LANG_ATTR,
      CODE_DELIM_CLASS,
      LIST_NUM_CLASS,
      LIST_BULLET_CLASS,
      LIST_BULLET_SPACE_CLASS,
    } = require('./constants');
    const { warnContract } = require('./editor');
    const { selectionCoversRange } = require('./grammar');
    const { shouldRevealCodeDelims } = require('./code-plan');

    /** The class of each marker-glyph kind. */
    const MARKER_CLASS = {
      num: LIST_NUM_CLASS,
      bullet: LIST_BULLET_CLASS,
      'bullet-space': LIST_BULLET_SPACE_CLASS,
    };

    /** Every class a glyph mark can carry (the sweep set). */
    const GLYPH_CLASSES = [
      CODE_DELIM_CLASS,
      LIST_NUM_CLASS,
      LIST_BULLET_CLASS,
      LIST_BULLET_SPACE_CLASS,
    ];

    /** One sweep selector for every glyph class (cheap, run once). */
    const GLYPH_SWEEP = `${COMPOSER_INPUT} .${GLYPH_CLASSES.join(`, ${COMPOSER_INPUT} .`)}`;

    /**
     * The fence half of the DOM marks: toggle the fence classes and
     * the language attribute on every composer paragraph, per the pure
     * blockRolesOf classification. Runs after the update listener's
     * commit, so the reconciled paragraph elements are already in the
     * DOM. The markers are NEVER revealed: no caret ever rests on a
     * marker line (the arrow-skip keys and the caret-home stage see to
     * that) — stale reveal classes from older plugin versions are
     * scrubbed.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the blocks read this pass.
     * @param {({role: string|null, lang: string|null}|null)[]} roles -
     *   blockRolesOf output (one entry per block).
     */
    function applyBlockMarks(editor, blocks, roles) {
      if (typeof editor.getElementByKey !== 'function') {
        warnContract('editor.getElementByKey missing (fence styling inert)');
        return;
      }
      blocks.forEach((block, i) => {
        const el = editor.getElementByKey(block.node.getKey());
        if (!(el instanceof HTMLElement)) return;
        const role = roles[i]?.role ?? null;
        el.classList.toggle(FENCE_CLASS_OPEN, role === 'open');
        el.classList.toggle(FENCE_CLASS_BODY, role === 'body');
        el.classList.toggle(FENCE_CLASS_CLOSE, role === 'close');
        el.classList.remove(FENCE_CLASS_RAW);
        if (role === 'open') el.setAttribute(FENCE_LANG_ATTR, roles[i].lang ?? '');
        else el.removeAttribute(FENCE_LANG_ATTR);
      });
    }

    /**
     * The glyph marks of one analysis: every single-char leaf the
     * presentation must class, as a flat {at, cls, reveal} table per
     * block. Hidden backtick pairs contribute their two ticks with the
     * pair-level reveal rule (either tick covered reveals BOTH);
     * list-marker glyphs contribute each digit/dash/space with the
     * per-char reveal rule. reveal(lo, hi) answers against the flat
     * selection range at mark time.
     * @param {ReturnType<import('./analysis').analyzeDraft>} analysis -
     *   the assembled draft analysis.
     * @returns {{at: number, cls: string, reveal: (lo: number, hi: number) => boolean}[][]}
     */
    function glyphMarksOf(analysis) {
      const marks = Array.from({ length: analysis.texts.length }, () => []);
      analysis.spans.forEach((spans, i) => {
        for (const span of spans) {
          // Both ticks of a pair reveal together (select-what-you-see
          // shows the honest markdown delimiters, never half a pair).
          const reveal = (lo, hi) => shouldRevealCodeDelims(span, lo, hi);
          marks[i].push({ at: span.start - 1, cls: CODE_DELIM_CLASS, reveal });
          marks[i].push({ at: span.end, cls: CODE_DELIM_CLASS, reveal });
        }
      });
      analysis.markers.forEach((glyphs, i) => {
        for (const glyph of glyphs) {
          marks[i].push({
            at: glyph.at,
            cls: MARKER_CLASS[glyph.kind],
            reveal: (lo, hi) => selectionCoversRange(glyph.at, glyph.at + 1, lo, hi),
          });
        }
      });
      return marks;
    }

    /**
     * Apply the glyph marks: sweep every glyph class inside the
     * composer, then walk each block's leaves and class exactly the
     * single-char text leaves a mark addresses — unless the selection
     * genuinely covers the char (the shared reveal rule: a collapsed
     * caret covers nothing, so hidden glyphs stay hidden under and
     * beside the caret; only a range sweeping over the char surfaces
     * the honest markdown — per block, so a cross-block selection
     * (Ctrl+A over several paragraphs) reveals in every block it
     * touches, v2.7). The shape stage (restyle) guarantees the
     * addressed chars sit in their own leaves; a pass before that
     * write finds none and the next pass marks them.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the blocks read this pass.
     * @param {ReturnType<glyphMarksOf>} marksPerBlock - glyph marks per
     *   block index.
     * @param {{index: number, lo: number, hi: number}[]|null} ranges -
     *   the per-block flat ranges the selection covers, or null.
     */
    function applyGlyphMarks(editor, blocks, marksPerBlock, ranges) {
      if (typeof editor.getElementByKey !== 'function') {
        warnContract('editor.getElementByKey missing (glyph styling inert)');
        return;
      }
      document.querySelectorAll(GLYPH_SWEEP)
        .forEach((el) => el.classList.remove(...GLYPH_CLASSES));
      blocks.forEach((block, i) => {
        const marks = marksPerBlock[i];
        if (marks === undefined || marks.length === 0) return;
        const range = ranges != null
          ? ranges.find((r) => r.index === i) ?? null
          : null;
        let offset = 0;
        for (const leaf of block.leaves) {
          const start = offset;
          const end = offset + leaf.text.length;
          offset = end;
          if (leaf.kind !== 'text' || end !== start + 1) continue;
          const mark = marks.find((m) => m.at === start);
          if (mark === undefined) continue;
          if (range !== null && mark.reveal(range.lo, range.hi)) {
            continue; // the selection covers this glyph: reveal the raw char
          }
          const el = editor.getElementByKey(leaf.node.getKey());
          if (el instanceof HTMLElement) el.classList.add(mark.cls);
        }
      });
    }

    /**
     * Strip every DOM mark we toggled (uninstall path). Works from the
     * DOM alone, so it also cleans up after a disposed editor.
     */
    function stripDom() {
      const scope = document.querySelectorAll(
        `${COMPOSER_INPUT} p, ${COMPOSER_INPUT} div`,
      );
      for (const el of scope) {
        if (!(el instanceof HTMLElement)) continue;
        el.classList.remove(FENCE_CLASS_OPEN, FENCE_CLASS_BODY, FENCE_CLASS_CLOSE, FENCE_CLASS_RAW);
        el.removeAttribute(FENCE_LANG_ATTR);
      }
      document.querySelectorAll(GLYPH_SWEEP)
        .forEach((el) => el.classList.remove(...GLYPH_CLASSES));
    }

    module.exports = {
      MARKER_CLASS,
      applyBlockMarks,
      glyphMarksOf,
      applyGlyphMarks,
      stripDom,
    };
    },

    './gestures': function (module, exports, require) {
    /**
     * The key surface: document-capture keydown POLICY. Guards (IME,
     * trigger menus, composer scope, modifiers, repeats), then a table
     * of gesture policies — one per key family — where each policy is
     * three pure steps: prepare (plan inside editor.read, over ONE
     * shared line model), apply (inside editor.update, through the
     * edit algebra), and history (how the update tags the undo stack).
     * ONE claim path (preventDefault + stopImmediatePropagation) serves
     * every gesture. Arrivals the policies cannot intercept (↑/↓
     * column moves, clicks into a marker interior) are homed by the
     * restyle engine's caret-home stage instead.
     */
    const {
      IME_KEYCODE,
      RECENT_COMPOSITION_MS,
      HISTORY_MERGE_TAG,
      COMPOSER_INPUT,
      ORDERED_MARKER_RE,
    } = require('./constants');
    const { warnContract, resolveEditor, isTriggerMenuVisible } = require('./editor');
    const { readBlocks, caretBlockPoint, caretPoint } = require('./doc');
    const { visualModelOf } = require('./grammar');
    const { computeEnterPlan } = require('./enter-plan');
    const { planFenceKey } = require('./fence-plan');
    const {
      listItemAtomOf,
      planListLevelShift,
      planListMarkerDelete,
      planListMarkerHop,
      planListShiftDown,
    } = require('./list-plan');
    const {
      applyEnterPlan,
      applyFenceKeyPlan,
      applyDigitRenames,
      applyLevelEdits,
      consumeFlatRange,
      placeFlatCaret,
    } = require('./edits');

    /** True while an IME composition is active (or just ended — Safari). */
    let composing = false;
    let composingUntil = 0;

    /** document-capture compositionstart. */
    function onCompositionStart() {
      composing = true;
    }

    /** document-capture compositionend: hold the guard one extra tick. */
    function onCompositionEnd() {
      composing = false;
      composingUntil = Date.now() + RECENT_COMPOSITION_MS;
    }

    /**
     * The three IME signals the DSH keymap itself trusts: isComposing,
     * keyCode 229, and the post-compositionend window.
     * @param {KeyboardEvent} event - the keydown under judgment.
     * @returns {boolean} true when an IME owns this key.
     */
    function isComposingEvent(event) {
      return (
        event.isComposing === true ||
        event.keyCode === IME_KEYCODE ||
        composing ||
        Date.now() < composingUntil
      );
    }

    /**
     * The one claim path: prepare a plan payload inside
     * editor.read(), and when it is ours consume the key and apply the
     * payload inside one editor.update(). history picks the update
     * tag: structural edits the user undoes as one step get discrete;
     * selection-only moves merge into the adjacent history entry.
     * @param {KeyboardEvent} event - the keydown.
     * @param {object} editor - the live editor.
     * @param {object} gesture - the policy {prepare, apply, history}.
     * @returns {boolean} whether the key was claimed.
     */
    function claim(event, editor, gesture) {
      let payload = null;
      try {
        editor.getEditorState().read(() => {
          payload = gesture.prepare(event, editor);
        });
      } catch (error) {
        warnContract(error);
        return false;
      }
      if (payload === null) return false; // not ours: native behavior proceeds
      // Keep the key from Lexical's root keydown and apply our own edit.
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        editor.update(() => {
          gesture.apply(payload, editor);
        }, gesture.history(payload));
      } catch (error) {
        warnContract(error);
      }
      return true;
    }

    /**
     * Shift+Enter: the markdown editing gesture. The fence arbitration
     * inside computeEnterPlan runs first; an ordered continuation
     * INSERTS a member, so the run below shifts +1 in the same update
     * (one Ctrl+Z reverts insertion and renumber together). Plain
     * Enter keeps DSH's native submit, untouched; Ctrl/Cmd/Alt
     * variants and held repeats are never ours.
     */
    const enterGesture = {
      keys: new Set(['Enter']),
      guard(event) {
        return event.shiftKey
          && !event.ctrlKey && !event.metaKey && !event.altKey
          && !event.repeat;
      },
      prepare(event, editor) {
        const blocks = readBlocks(editor);
        const point = caretBlockPoint(editor, blocks);
        if (point === null) return null;
        const model = visualModelOf(blocks.map((b) => b.text));
        const plan = computeEnterPlan(model, point.index, point.offset);
        return plan === null ? null : { plan, blocks, index: point.index };
      },
      apply({ plan, blocks, index }, editor) {
        applyEnterPlan(editor, plan, blocks, index);
        // Ordered continuation INSERTS a member: every member below
        // in the same run shifts +1, so the list stays continuous
        // and duplicate-free. Same update — one Ctrl+Z reverts
        // insertion and renumber together.
        if ((plan.kind === 'list-continue' || plan.kind === 'list-continue-soft')
          && ORDERED_MARKER_RE.test(plan.marker)) {
          const fresh = readBlocks(editor);
          const point = caretBlockPoint(editor, fresh);
          const edits = point === null
            ? []
            : planListShiftDown(visualModelOf(fresh.map((b) => b.text)), point);
          if (edits.length > 0) applyDigitRenames(editor, fresh, edits);
        }
      },
      history() {
        return { discrete: true };
      },
    };

    /**
     * Backspace / Delete / arrows with a plain collapsed caret: the
     * atomic gestures. The chain is ordered — fence box first, then
     * (delete keys only) the LEVEL LADDER lift (Backspace right after
     * a list atom: a nested item rises one level, a top-level one
     * leaves the list), then the atomic atom delete, and (horizontal
     * arrows only) the atomic atom hop — and the first non-null plan
     * wins; everything else keeps the native key.
     */
    const atomicGesture = {
      keys: new Set([
        'Backspace',
        'Delete',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ]),
      guard(event) {
        return !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
      },
      prepare(event, editor) {
        const key = event.key;
        const blocks = readBlocks(editor);
        const point = caretPoint(editor, blocks); // non-null only collapsed
        if (point === null) return null;
        const model = visualModelOf(blocks.map((b) => b.text));
        const fence = planFenceKey(model, point, key);
        if (fence !== null) return { kind: 'fence', plan: fence, blocks };
        if (key === 'Backspace' || key === 'Delete') {
          const caret = caretBlockPoint(editor, blocks);
          if (key === 'Backspace' && caret !== null) {
            // Backspace right AFTER the list atom (the content head):
            // one rung up the level ladder — a nested item sheds a
            // LEVEL_STEP of indent (subtree riding along), a
            // top-level item leaves the list (the atom dies, the
            // content stays as plain text).
            const atom = listItemAtomOf(model, caret);
            if (atom !== null && caret.offset === atom.end) {
              const lift = planListLevelShift(model, caret, 'shallower');
              if (lift !== null) return { kind: 'level', plan: lift, blocks };
            }
          }
          const marker = planListMarkerDelete(model, caret, key);
          if (marker !== null) return { kind: 'marker', plan: marker, blocks };
        }
        if (key === 'ArrowLeft' || key === 'ArrowRight') {
          // The atom that deletes as one unit travels as one unit:
          // ←/→ hop over it instead of stepping through its interior.
          const hop = planListMarkerHop(model, caretBlockPoint(editor, blocks), key);
          if (hop !== null) return { kind: 'hop', plan: hop, blocks };
        }
        return null;
      },
      apply({ kind, plan, blocks }, editor) {
        if (kind === 'fence') {
          applyFenceKeyPlan(editor, plan, blocks);
          return;
        }
        if (kind === 'hop') {
          const block = blocks[plan.index];
          if (block !== undefined) placeFlatCaret(block.node, plan.offset);
          return;
        }
        if (kind === 'level') {
          // The ladder move is ONE update (subtree + caret); the
          // ordered-run renumbering it reshuffles converges on the
          // next restyle pass, history-merged into this undo step's
          // neighbourhood.
          applyLevelEdits(editor, blocks, plan);
          return;
        }
        const block = blocks[plan.index];
        if (block !== undefined) {
          consumeFlatRange(editor, block, plan.start, plan.start + plan.prefix.length);
        }
      },
      history({ kind, plan }) {
        // Whole-box unwraps / atoms / ladder moves get their own undo
        // step (one Ctrl+Z restores the markers or the level); arrow
        // moves (fence skips, atom hops) are selection-only and merge
        // into adjacent history.
        return (kind === 'fence' && plan.kind !== 'fence-unwrap') || kind === 'hop'
          ? { tag: HISTORY_MERGE_TAG }
          : { discrete: true };
      },
    };

    /**
     * Tab / Shift+Tab: the list LEVEL LADDER (v2.8). With the
     * collapsed caret anywhere on an ordered/bullet item line —
     * content included — Tab sinks the item one level (indent
     * +LEVEL_STEP) and Shift+Tab or Backspace-at-the-atom-end lifts
     * it — and the move carries the item's WHOLE SUBTREE (every
     * deeper line below, recursion included) in ONE discrete update.
     * A top-level item lifting further UNLISTS: the atom dies, the
     * content stays as plain text, the subtree still rises one level.
     *
     * Sinking is CAPPED (v2.9): an item may sit at most one level
     * below its parent context (the nearest item above; blanks and
     * fences end the block), so a Tab that would exceed that —
     * including any Tab on a list's first item — still CLAIMS the key
     * (Tab on a list line is always the ladder's) but moves nothing:
     * focus never jumps away mid-list-editing. That holds for HELD
     * keys too: repeats re-plan like any press (a held Tab sinks once
     * and then holds at the cap, claimed and inert; a held Shift+Tab
     * climbs one rung per repeat until the unlist) — were repeats
     * passed through instead, the native default would move focus out
     * of the composer mid-edit. Anywhere else (plain lines, fence
     * interiors, range selections, modifier chords) is not ours: Tab
     * keeps DSH's native behavior (trigger-menu completion while a
     * menu is open — guarded earlier — and browser focus traversal
     * otherwise), untouched.
     */
    const indentGesture = {
      keys: new Set(['Tab']),
      guard(event) {
        return !event.ctrlKey && !event.metaKey && !event.altKey;
      },
      prepare(event, editor) {
        const blocks = readBlocks(editor);
        if (caretPoint(editor, blocks) === null) return null; // collapsed only
        const caret = caretBlockPoint(editor, blocks);
        if (caret === null) return null;
        const model = visualModelOf(blocks.map((b) => b.text));
        const plan = planListLevelShift(model, caret, event.shiftKey ? 'shallower' : 'deeper');
        return plan === null ? null : { kind: 'level', plan, blocks };
      },
      apply({ plan, blocks }, editor) {
        if (plan.kind === 'noop') return; // capped: claimed, nothing moves
        applyLevelEdits(editor, blocks, plan);
      },
      history() {
        return { discrete: true };
      },
    };

    /** The gesture policy table, in arbitration order. */
    const GESTURES = [enterGesture, atomicGesture, indentGesture];

    /**
     * Bind the key surface to a wiring hook (the restyle engine's
     * wireAttempt, so a keydown into a fresh composer wires it).
     * @param {{wireAttempt: () => void}} hooks
     * @returns {{onKeydown: Function, onCompositionStart: Function, onCompositionEnd: Function}}
     */
    function createGestures(hooks) {
      const wireAttempt = hooks.wireAttempt;
      /** document-capture keydown: the markdown-editing key surface. */
      function onKeydown(event) {
        // Yield to any capture listener that already consumed the key.
        if (event.defaultPrevented) return;
        // The keys this surface arbitrates; everything else passes.
        const gesture = GESTURES.find((g) => g.keys.has(event.key));
        if (gesture === undefined || !gesture.guard(event)) return;
        // An open trigger menu owns the keys; stay out entirely.
        if (isTriggerMenuVisible()) return;
        if (isComposingEvent(event)) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (target.closest?.(COMPOSER_INPUT) == null) return; // composer only
        wireAttempt();
        const editor = resolveEditor();
        if (editor === null) return;
        claim(event, editor, gesture);
      }
      return { onKeydown, onCompositionStart, onCompositionEnd };
    }

    module.exports = { createGestures };
    },

    './restyle': function (module, exports, require) {
    /**
     * The restyle engine: a convergent stage pipeline driven by the
     * editor's update listener. Each pass reads the document model
     * once (ONE analysis — ./analysis), runs the stages in order, and
     * commits AT MOST ONE structural update; the commit re-fires the
     * listener and the next pass finds that stage settled (plans are
     * idempotent — write only on difference), so the loop converges. A
     * rate limiter backs off for a second if a bug ever prevents
     * convergence.
     *
     * The stages are DATA — an ordered table of pure plan functions,
     * each returning either a DOM-pass thunk or a structural action:
     *
     *   1 normalize    promote fence-adjacent soft lines to paragraph
     *                 breaks (structure only, text identical) so
     *                 fences typed at the head of ANY line become
     *                 paragraph heads the grammar can see;
     *   2 dom marks    fence paragraph classes + language badge attrs
     *                 + every glyph mark (hidden inline-code delims,
     *                 styled list markers) — idempotent class toggles
     *                 over the reconciled DOM, no editor state, no
     *                 history, no loop;
     *   3 repairs      ordered-list run normalization (every run
     *                 1..n — state-driven) + orphan fence-close
     *                 cleanup + barren-husk strips, in ONE
     *                 history-merged update (the orphan cleanup
     *                 spends cross-pass memory in this pass;
     *                 deferring it would lose it forever);
     *   4 caret home   a caret that landed on a zero-height marker
     *                 line moves to the adjacent content line, and a
     *                 collapsed caret resting inside a list marker
     *                 homes to the nearest marker edge
     *                 (selection-only);
     *   5 code shapes  isolate delimiter + list-marker glyph leaves
     *                 and set/clear IS_CODE so inline pairs render
     *                 (and their ticks hide, the markers style).
     *
     * A stage that plans a structural action WINS and ends the pass
     * (the commit re-fires the listener); the marks stage never plans
     * structure, it just collects the DOM pass — except that the
     * normalize stage ends the pass BEFORE it, mirroring the "never
     * style a mixed paragraph for a frame" rule.
     *
     * The cross-pass memory (fence pairs), the wiring and the rate
     * limiter are state of the ENGINE INSTANCE, not module globals —
     * teardown clears them, and a fresh apply() builds a fresh engine.
     */
    const {
      HISTORY_MERGE_TAG,
      MAX_WRITES_PER_SECOND,
      COMPOSER_INPUT,
    } = require('./constants');
    const {
      warnContract,
      resolveEditor,
      nodeMapOf,
      liveNodeMapOf,
      liveSelectionOf,
      compositionKeyOf,
    } = require('./editor');
    const {
      readBlocks,
      selectionCoveredRanges,
      caretPoint,
      caretPointLive,
      caretBlockPoint,
      caretBlockPointLive,
      huskBlocksOf,
    } = require('./doc');
    const { visualModelOf } = require('./grammar');
    const { analyzeDraft } = require('./analysis');
    const { planMarkerNudge, planOrphanCleanup, closedFencePairs } = require('./fence-plan');
    const { planListMarkerCaretHome } = require('./list-plan');
    const {
      promoteSoftBoundaries,
      applyDigitRenames,
      removeBlockKeys,
      shapeMismatch,
      applyShape,
      placeFlatCaret,
    } = require('./edits');
    const { applyBlockMarks, glyphMarksOf, applyGlyphMarks } = require('./present');

    /**
     * Stage 1 — normalize: fences typed/pasted at the head of a soft
     * line live inside one paragraph, invisible to the per-paragraph
     * fence grammar. Promoting the fence-adjacent '\n' boundaries to
     * paragraph breaks re-exposes them; the commit re-fires the
     * listener and the NEXT pass styles the now-paragraph lines. The
     * fence DOM pass deliberately waits a round: a mixed paragraph
     * (```…\ncode) must never take the marker's zero-height/close
     * classes, which would hide the other line's text for a frame.
     * @param {object} ctx - the pass context (editor, blocks, analysis).
     * @returns {object|null} a structural action, or null.
     */
    function stageNormalize(ctx) {
      const { editor, blocks, analysis } = ctx;
      if (!analysis.softSplits.some((offsets) => offsets.length > 0)) return null;
      return {
        guarded: false,
        apply: () => {
          blocks.forEach((block, i) => {
            if (analysis.softSplits[i].length > 0) {
              promoteSoftBoundaries(editor, block.node, analysis.softSplits[i]);
            }
          });
        },
      };
    }

    /**
     * Stage 2 — DOM marks: the desired presentation of the pass —
     * paragraph roles + every glyph mark — collected as one thunk.
     * Never structural; runs after the read even when a later stage
     * plans structure (the classes describe the committed state).
     * @param {object} ctx - the pass context (mutated: domPass).
     * @returns {null} always (the marks ride along on ctx).
     */
    function stageMarks(ctx) {
      const { editor, blocks, analysis } = ctx;
      const covered = selectionCoveredRanges(editor, blocks);
      const marks = glyphMarksOf(analysis);
      ctx.domPass = () => {
        applyBlockMarks(editor, blocks, analysis.blockRoles);
        applyGlyphMarks(editor, blocks, marks, covered);
      };
      return null;
    }

    /**
     * Stage 3 — repairs: the ordered-list renumber invariant (v2.6 —
     * every run numbered 1..n, STATE-DRIVEN: a run split by a plain
     * line restarts at 1 past the break, two runs merged by deleting
     * the line between them fuse into one continuous count, and no
     * cross-pass memory is read or spent), the orphan fence-close
     * cleanup, and the barren-husk strips — in ONE history-merged
     * update (the orphan cleanup DOES spend its cross-pass memory in
     * this pass; deferring it would lose it forever). Digit rewrites
     * ride history-merged into the user's edit (one Ctrl+Z undoes
     * delete + renumber together). The commit re-fires the listener;
     * the next pass finds everything settled and moves on.
     *
     * Husk strips: a block whose whole text was spliced away can
     * strand zero-length text leaves (the atomic marker delete on a
     * marker-only line — the unmergeable glyph husks never normalize
     * out). A text selection in such a leaf cannot reach the DOM, so
     * the block strips back to the pristine childless paragraph; a
     * caret resting on a stripped leaf re-homes to the paragraph
     * start (element selection). The gesture path already resets, so
     * this is the safety net for any other route — convergent (a
     * childless block never re-triggers), loop-guarded, and
     * re-checked at apply time.
     * @param {object} ctx - the pass context (editor, blocks, analysis,
     *   point, memory).
     * @returns {object|null} a structural action, or null.
     */
    function stageRepairs(ctx) {
      const { editor, blocks, analysis, point, memory } = ctx;
      const renumber = analysis.renumber;
      const pairs = closedFencePairs(blocks, analysis);
      const current = blocks.map((block) => ({ key: block.node.getKey(), text: block.text }));
      const caretKeys = point !== null && blocks[point.index] !== undefined
        ? [blocks[point.index].node.getKey()]
        : [];
      const orphan = planOrphanCleanup(memory.pairs, pairs, current, caretKeys);
      memory.pairs = orphan.keepPairs;
      const husks = huskBlocksOf(blocks);
      if (renumber.length === 0 && orphan.removeKeys.length === 0 && husks.length === 0) {
        return null;
      }
      return {
        guarded: renumber.length > 0 || husks.length > 0,
        apply: () => {
          const removed = removeBlockKeys(editor, orphan.removeKeys);
          if (orphan.reselectKey != null) {
            const home = nodeMapOf(editor)?.get?.(orphan.reselectKey);
            if (home != null && typeof home.selectStart === 'function') home.selectStart();
          }
          for (const strip of husks) {
            // Staleness guard (same class as the caret-home re-plan):
            // a newer update may have typed text into a husk — remove
            // only leaves that are provably STILL empty (live node
            // map), and home the caret only when the live anchor
            // really rides one of them.
            const anchorKey = liveSelectionOf(editor)?.anchor?.key;
            let homed = false;
            for (const key of strip.keys) {
              const leaf = liveNodeMapOf(editor)?.get?.(key);
              if (leaf == null || typeof leaf.getTextContent !== 'function') continue;
              if (leaf.getTextContent() !== '') continue;
              if (anchorKey === key) homed = true;
              leaf.remove?.();
            }
            if (homed && typeof strip.node.selectStart === 'function') {
              strip.node.selectStart();
            }
          }
          // Never splice a paragraph the cleanup just removed (removed
          // fence lines can't be list members, but stay safe rather
          // than splice a detached node).
          const edits = renumber.filter((edit) => {
            const block = blocks[edit.index];
            return block !== undefined && !removed.has(block.node.getKey());
          });
          if (edits.length > 0) applyDigitRenames(editor, blocks, edits);
        },
      };
    }

    /**
     * Wrap a caret move so it RE-PLANS at commit time: a newer update
     * queued in between (a marker hop, a native move) may already
     * have carried the caret out of the trigger state, and a stale
     * plan-time offset would yank it right back. The fresh plan reads
     * the LIVE pending selection (earlier same-batch callbacks may
     * already have moved it).
     * @param {object} editor - the live editor.
     * @param {(texts: string[], livePoint: object|null, liveCaret: object|null)
     *   => ({index: number}|null)} planOf - re-plan against fresh blocks.
     * @param {(node: object, plan: {index: number}) => void} move - place
     *   the caret per the fresh plan.
     * @returns {() => void} the apply thunk.
     */
    function replannedCaret(editor, planOf, move) {
      return () => {
        const fresh = readBlocks(editor);
        const freshTexts = fresh.map((block) => block.text);
        const plan = planOf(freshTexts, caretPointLive(editor, fresh), caretBlockPointLive(editor, fresh));
        if (plan === null) return;
        const node = liveNodeMapOf(editor)?.get?.(fresh[plan.index]?.node.getKey());
        if (node == null) return;
        move(node, plan);
      };
    }

    /**
     * Stage 4 — caret home: a collapsed caret that landed on a marker
     * paragraph (click on the box edges, programmatic moves) moves to
     * the adjacent content line; a collapsed caret resting strictly
     * INSIDE a list marker (↑/↓ column moves, clicks, scripts — every
     * arrival the horizontal hop cannot intercept) homes to the
     * nearest marker edge: the marker is one atom, it has no interior
     * to rest in. Selection-only; the listener re-fires and finds the
     * caret already homed — converges. History-merge keeps it off the
     * undo stack.
     * @param {object} ctx - the pass context (editor, blocks, analysis,
     *   point).
     * @returns {object|null} a structural action, or null.
     */
    function stageCaretHome(ctx) {
      const { editor, blocks, analysis, point } = ctx;
      if (point !== null) {
        const nudge = planMarkerNudge(analysis, point);
        if (nudge !== null && blocks[nudge.index] !== undefined) {
          return {
            guarded: false,
            apply: replannedCaret(
              editor,
              (freshTexts, livePoint) => (livePoint === null
                ? null
                : planMarkerNudge(visualModelOf(freshTexts), livePoint)),
              (node, plan) => {
                if (plan.where === 'end' && typeof node.selectEnd === 'function') node.selectEnd();
                else if (typeof node.selectStart === 'function') node.selectStart();
              },
            ),
          };
        }
      }
      if (point === null) return null;
      const markerHome = planListMarkerCaretHome(analysis, caretBlockPoint(editor, blocks));
      if (markerHome === null || blocks[markerHome.index] === undefined) return null;
      return {
        guarded: false,
        apply: replannedCaret(
          editor,
          (freshTexts, livePoint, liveCaret) => ((livePoint === null || liveCaret === null)
            ? null
            : planListMarkerCaretHome(visualModelOf(freshTexts), liveCaret)),
          (node, plan) => placeFlatCaret(node, plan.offset),
        ),
      };
    }

    /**
     * Stage 5 — code + marker shapes: isolate the delimiter and
     * marker-glyph leaves and set/clear IS_CODE per the planned spans
     * (the DOM marks ride one commit behind these writes). The write
     * is history-merged so formatting joins the adjacent undo step
     * instead of polluting the stack.
     * @param {object} ctx - the pass context (blocks, analysis).
     * @returns {object|null} a structural action, or null.
     */
    function stageShapes(ctx) {
      const { blocks, analysis } = ctx;
      const targets = [];
      blocks.forEach((block, i) => {
        const glyphs = analysis.markers[i].map((g) => g.at);
        if (shapeMismatch(block, analysis.spans[i], analysis.delims[i], glyphs)) {
          targets.push({ block, spans: analysis.spans[i], delims: analysis.delims[i], glyphs });
        }
      });
      if (targets.length === 0) return null;
      return {
        guarded: true,
        apply: () => {
          for (const target of targets) {
            applyShape(target.block, target.spans, target.delims, target.glyphs);
          }
        },
      };
    }

    /** The ordered stage table — first structural plan wins. */
    const STAGES = [
      stageNormalize,
      stageMarks,
      stageRepairs,
      stageCaretHome,
      stageShapes,
    ];

    /**
     * Build one restyle engine. All mutable state (wiring, memories,
     * rate limiter) lives on the instance; the dispose halves block
     * further scans (beginDispose) and rearm for a fresh apply
     * (endDispose).
     * @returns {{wireAttempt: () => void, onFocusIn: (event: Event) => void,
     *   beginDispose: () => void, endDispose: () => void}}
     */
    function createRestyler() {
      /** Editors already carrying our update listener. */
      const wired = new WeakSet();
      /** Disposers for every wired listener (unload walks this). */
      const unwires = new Set();
      /** A restyle scan is scheduled for this editor. */
      let scanPendingFor = null;
      /** Timestamps of self-triggered restyle writes (loop guard window). */
      let recentWrites = [];
      let loopGuardWarned = false;
      /** Cross-pass memory: fence pairs seen by the previous pass. */
      const memory = { pairs: [] };
      /** Engine torn down. */
      let disposed = false;

      /**
       * One restyle pass: read → run the stages in order → apply the
       * DOM marks, then (at most) one structural update.
       * @param {object} editor - the live editor.
       */
      function restyle(editor) {
        if (disposed) return;
        // Never fight an in-flight IME composition; the update after
        // compositionend re-triggers this pass.
        const compositionKey = compositionKeyOf(editor);
        if (compositionKey !== null && compositionKey !== undefined) return;
        let domPass = null;
        let structural = null; // { apply: () => void, guarded?: boolean }
        try {
          editor.getEditorState().read(() => {
            const blocks = readBlocks(editor);
            const texts = blocks.map((block) => block.text);
            const analysis = analyzeDraft(texts);
            const point = caretPoint(editor, blocks);
            const ctx = { editor, blocks, texts, analysis, point, memory, domPass: null };
            for (const stage of STAGES) {
              structural = stage(ctx);
              if (structural !== null) break;
            }
            domPass = ctx.domPass;
          });
        } catch (error) {
          warnContract(error);
          return;
        }
        try {
          domPass?.();
        } catch (error) {
          warnContract(error);
        }
        if (structural === null) {
          recentWrites = []; // settled: reset the rate limiter window
          return;
        }
        if (structural.guarded === true) {
          // Loop guard: self-triggered writes are rate-limited so a
          // non-converging diff pauses styling instead of spinning.
          const now = Date.now();
          recentWrites = recentWrites.filter((t) => now - t < 1000);
          if (recentWrites.length >= MAX_WRITES_PER_SECOND) {
            if (!loopGuardWarned) {
              loopGuardWarned = true;
              console.warn('[dsh-composer-markdown] restyle not converging; pausing styling for a second');
            }
            return;
          }
          recentWrites.push(now);
        }
        try {
          editor.update(structural.apply, { discrete: true, tag: HISTORY_MERGE_TAG });
        } catch (error) {
          warnContract(error);
        }
      }

      /**
       * Schedule one restyle on a microtask (batch bursts of updates).
       * @param {object} editor - the live editor.
       */
      function scheduleRestyle(editor) {
        if (disposed || scanPendingFor !== null) return;
        scanPendingFor = editor;
        queueMicrotask(() => {
          scanPendingFor = null;
          restyle(editor);
        });
      }

      /**
       * Attach the update listener to a new editor instance (idempotent)
       * and run an initial restyle — this is also the draft-restore path:
       * restored drafts rebuild unformatted nodes, and the listener plus
       * this initial pass re-derive the styling.
       * @param {object} editor - the live editor.
       */
      function wireEditor(editor) {
        if (disposed || wired.has(editor)) return;
        let off = null;
        try {
          off = editor.registerUpdateListener(() => {
            scheduleRestyle(editor);
          });
        } catch (error) {
          warnContract(error);
          return;
        }
        wired.add(editor);
        unwires.add(off);
        scheduleRestyle(editor);
      }

      /** Try to wire whatever composer editor is live right now. */
      function wireAttempt() {
        const editor = resolveEditor();
        if (editor !== null) wireEditor(editor);
      }

      /** document-capture focusin: wiring trigger for fresh editors. */
      function onFocusIn(event) {
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (target.closest?.(COMPOSER_INPUT) == null) return;
        wireAttempt();
      }

      /**
       * Teardown, half one: block further restyle scans and unwire
       * every editor update listener. Runs FIRST in the plugin's
       * dispose path — the update listener that clearCodeBits re-fires
       * must find `disposed` already set, or it would restyle back
       * what we are tearing down.
       */
      function beginDispose() {
        disposed = true;
        for (const off of unwires) {
          try {
            off();
          } catch {
            // a disposed editor's disposer may already be gone
          }
        }
        unwires.clear();
        memory.pairs = [];
      }

      /**
       * Teardown, half two: rearm the wiring state once the dispose
       * path is done, so the same factory closure could apply again
       * cleanly (HMR reloads re-run the factory fresh; this reset
       * keeps a re-apply on the current closure correct too).
       */
      function endDispose() {
        disposed = false;
      }

      return { wireAttempt, onFocusIn, beginDispose, endDispose };
    }

    module.exports = { createRestyler };
    },

    './index': function (module, exports, require) {
    /**
     * Bundle entry: composition root + lifecycle.
     *
     * The only module that knows how the pieces meet: build the restyle
     * engine, bind the key surface to it (dependency injection — no
     * module globals), own the document listeners and the style tag,
     * and tear the whole graph down on dispose (plugin toggle / HMR /
     * uninstall). The pure logic surface for the zero-browser test
     * runner rides along as __internals, assembled HERE — the tests'
     * lines-based entry points are one-line adapters over the
     * model-consuming cores, so the surface can never drift from the
     * modules again.
     */
    const CONSTANTS = require('./constants');
    const GRAMMAR = require('./grammar');
    const DOC = require('./doc');
    const FENCE_PLAN = require('./fence-plan');
    const CODE_PLAN = require('./code-plan');
    const ENTER_PLAN = require('./enter-plan');
    const LIST_PLAN = require('./list-plan');
    const EDITS = require('./edits');
    const { resolveEditor } = require('./editor');
    const { createGestures } = require('./gestures');
    const { createRestyler } = require('./restyle');
    const { stripDom } = require('./present');
    const { injectStyle, removeStyle } = require('./style-sheet');

    /**
     * Adapt a model-consuming core into the lines-based entry point
     * the test surface exposes: build the shared line model from raw
     * block texts, then plan.
     * @param {(model: object, ...rest: unknown[]) => unknown} core
     * @returns {(lines: string[], ...rest: unknown[]) => unknown}
     */
    const onLines = (core) => (lines, ...rest) => core(GRAMMAR.visualModelOf(lines), ...rest);

    /** Plugin name — matches the cordis.patch.yml entry id. */
    const name = 'composer-markdown';

    /**
     * The pure logic surface for the zero-browser test runner
     * (tests/run-tests.mjs): every grammar kernel and planner, named
     * exactly as the tests call them.
     */
    const __internals = {
      // line grammars + constants
      ...CONSTANTS,
      // the string substrate + caret-line resolution
      ...GRAMMAR,
      // the document read (block/leaf views, caret mapping, husk query)
      ...DOC,
      // inline code: string kernels + per-block projections
      computeInlineCodeSpans: CODE_PLAN.computeInlineCodeSpans,
      computeCodeDelims: CODE_PLAN.computeCodeDelims,
      shouldRevealCodeDelims: CODE_PLAN.shouldRevealCodeDelims,
      planCodeSpansForBlocks: onLines(CODE_PLAN.codeSpansOf),
      planCodeDelimsForBlocks: onLines(CODE_PLAN.codeDelimsOf),
      // fence planning
      fenceLangOf: FENCE_PLAN.fenceLangOf,
      isBareCloseMarker: FENCE_PLAN.isBareCloseMarker,
      planOrphanCleanup: FENCE_PLAN.planOrphanCleanup,
      planFenceDom: onLines(FENCE_PLAN.blockRolesOf),
      planSoftLineSplits: onLines(FENCE_PLAN.softSplitsOf),
      planFenceKey: onLines(FENCE_PLAN.planFenceKey),
      planMarkerNudge: onLines(FENCE_PLAN.planMarkerNudge),
      // Shift+Enter arbitration
      computeEnterPlan: onLines(ENTER_PLAN.computeEnterPlan),
      // list planning
      planListRenumber: onLines((model) => ({ edits: LIST_PLAN.renumberEditsOf(model) })),
      planListMarkerStyleForBlocks: onLines(LIST_PLAN.markerGlyphsOf),
      listItemAtomOf: onLines(LIST_PLAN.listItemAtomOf),
      parentItemWidthOf: onLines(LIST_PLAN.parentItemWidthOf),
      planListLevelShift: onLines(LIST_PLAN.planListLevelShift),
      planListMarkerDelete: onLines(LIST_PLAN.planListMarkerDelete),
      planListMarkerHop: onLines(LIST_PLAN.planListMarkerHop),
      planListMarkerCaretHome: onLines(LIST_PLAN.planListMarkerCaretHome),
      planListShiftDown: onLines(LIST_PLAN.planListShiftDown),
      // edit algebra (works on stub nodes)
      ...EDITS,
    };

    /** Double-apply guard (HMR reloads re-run the factory fresh). */
    let registered = false;

    /**
     * Cordis client entry.
     * @param {object} ctx - the client context (effect-based cleanup).
     */
    function apply(ctx) {
      if (registered) return;
      registered = true;
      injectStyle();
      const restyler = createRestyler();
      const gestures = createGestures({ wireAttempt: restyler.wireAttempt });
      document.addEventListener('keydown', gestures.onKeydown, true);
      document.addEventListener('compositionstart', gestures.onCompositionStart, true);
      document.addEventListener('compositionend', gestures.onCompositionEnd, true);
      document.addEventListener('focusin', restyler.onFocusIn, true);
      restyler.wireAttempt(); // the composer may already be up (plugin installed mid-session)
      ctx.effect(() => {
        return () => {
          // beginDispose blocks the restyle pass BEFORE clearCodeBits
          // re-fires the update listeners below; endDispose rearms the
          // wiring so the closure could apply again.
          restyler.beginDispose();
          document.removeEventListener('keydown', gestures.onKeydown, true);
          document.removeEventListener('compositionstart', gestures.onCompositionStart, true);
          document.removeEventListener('compositionend', gestures.onCompositionEnd, true);
          document.removeEventListener('focusin', restyler.onFocusIn, true);
          removeStyle();
          stripDom();
          const editor = resolveEditor();
          if (editor !== null) EDITS.clearCodeBits(editor);
          restyler.endDispose();
          registered = false;
        };
      }, 'dsh-composer-markdown: composer markdown aids');
    }

    module.exports = {
      name,
      apply,
      __internals,
    };
    },
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
