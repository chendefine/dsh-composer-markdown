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
