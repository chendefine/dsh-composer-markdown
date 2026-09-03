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
     * feature's contract (the same rule the gesture cascades
     * planListShiftDown / planListReanchor always enforced for the
     * runs they touch; v2.6 extends it to every run, every path).
     *
     * The marker itself is ONE ATOM throughout the surface (v2.2):
     * Backspace/Delete already remove it whole, the horizontal arrows
     * travel over it whole (planListMarkerHop), and its glyphs restyle
     * as one visual unit (markerGlyphsOf) — digits in the code font,
     * the bullet dash rendered as a "•" dot — while every byte stays
     * literal in draft, clipboard and send text. Since v2.3 no
     * collapsed caret ever RESTS inside it either, whichever way it
     * arrived (planListMarkerCaretHome, run by the restyle engine's
     * caret-home stage).
     *
     * Every planner here consumes the SHARED line model (./grammar)
     * through the same caret-line preamble — the run grouping and the
     * fence guard arrive pre-computed instead of being re-derived per
     * function (v3 collapsed six hand-copied preambles into
     * editableLineOf). Because the plan is a pure function of the
     * current draft, it needs no cross-pass memory at all.
     */
    const { ORDERED_ITEM_RE, BULLET_ITEM_RE } = require('./constants');
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
     * Plan an ATOMIC list-marker deletion (pure). The marker — digits,
     * dot, space for `1. `, dash, space for `- `; the indent excluded —
     * is one unit: a plain Backspace with the collapsed caret right
     * AFTER it (between the trailing space and the content), or a plain
     * Delete with the caret right BEFORE it (after the indent, at the
     * content's left edge), removes the whole marker in one stroke
     * instead of eating it character by character. Works on ANY visual
     * line (soft-line lists included); a marker-looking prefix inside a
     * fence — paragraph or yet-unpromoted soft line — is code, not a
     * list, and never matches. Anything else is not ours: the native
     * per-character delete proceeds untouched.
     *
     * Dispatch note (v1.13): an ORDERED line with Backspace right after
     * the marker never reaches this planner — planListBackspace claims
     * that gesture first (join into the line above / detach as the
     * run's first member). What survives here: bullets under Backspace,
     * and both markers under forward Delete.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset (null when unusable).
     * @param {'Backspace'|'Delete'} key - the deletion direction.
     * @returns {{index: number, start: number, prefix: string}|null}
     *   start is the marker's flat offset (indent excluded), prefix its
     *   literal chars; null → not ours.
     */
    function planListMarkerDelete(model, caret, key) {
      const hit = editableItemOf(model, caret);
      if (hit === null) return null;
      const { line, m } = hit;
      const start = line.start + m[1].length;
      const prefix = m[0].slice(m[1].length);
      const end = start + prefix.length;
      if (key === 'Backspace' && caret.offset === end) return { index: caret.index, start, prefix };
      if (key === 'Delete' && caret.offset === start) return { index: caret.index, start, prefix };
      return null;
    }

    /**
     * Plan an ATOMIC list-marker HOP for the horizontal arrows (pure,
     * v2.2): the marker that already deletes as one unit also TRAVELS
     * as one unit. A plain ArrowLeft/ArrowRight never steps the caret
     * into the marker's interior —
     *
     *   ArrowRight with the caret in [start, end)  → land at END
     *   (right after the marker, the content's head);
     *   ArrowLeft  with the caret in (start, end]  → land at START
     *   (right before the marker, after the indent).
     *
     * So pressing → at the line head jumps clear over `1. `/`- ` in
     * one stroke, ← at the content head jumps back over it, and a
     * caret that landed INSIDE the marker by other means (a click, a
     * collapsed selection) exits to the far edge in its direction of
     * travel instead of walking the glyphs one by one. The indent is
     * not part of the atom (same boundary the atomic delete uses), so
     * a caret at START moving left, or at END moving right, keeps the
     * native key. Modifier arrows (Shift+arrows build selections) are
     * guarded off before this planner: a selection may still cover
     * the marker characters — select-what-you-see keeps manual digit
     * editing reachable. Works on ANY visual line; a marker-looking
     * prefix inside a fence is code, never a list.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset (null when unusable).
     * @param {'ArrowLeft'|'ArrowRight'} key - the horizontal direction.
     * @returns {{index: number, offset: number}|null} the flat point to
     *   move the caret to; null → not ours, the native move proceeds.
     */
    function planListMarkerHop(model, caret, key) {
      const hit = editableItemOf(model, caret);
      if (hit === null) return null;
      const { line, m } = hit;
      const start = line.start + m[1].length;
      const end = start + (m[0].length - m[1].length);
      if (key === 'ArrowLeft' && caret.offset > start && caret.offset <= end) {
        return { index: caret.index, offset: start };
      }
      if (key === 'ArrowRight' && caret.offset >= start && caret.offset < end) {
        return { index: caret.index, offset: end };
      }
      return null;
    }

    /**
     * Plan the CARET HOME for a collapsed caret resting strictly INSIDE
     * a list marker (pure, v2.3): the marker is one atom throughout the
     * surface, and an atom has no interior for a caret to rest in —
     * yet arrows that are not ours to arbitrate (↑/↓ keep their native
     * column-preserving move) and clicks CAN land the caret between the
     * glyphs. The restyle caret-home stage runs this every pass and
     * moves such a caret to the NEAREST atom edge (a tie snaps to the
     * start, matching the ArrowLeft exit), so the invariant "a
     * collapsed caret never rests inside a list marker" holds no
     * matter how the caret arrived. Edges themselves are legal rest
     * points (before the marker = the line head, after it = the
     * content head) and so do not move; only a range SELECTION may
     * span the interior (select-what-you-see keeps manual digit
     * editing reachable). The trigger range is OPEN on both sides —
     * exactly the planListMarkerHop geometry, resolved through the
     * same visual-line + fence guards as every other marker planner.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset (null when unusable).
     * @returns {{index: number, offset: number}|null} the flat point to
     *   home the caret to; null → the caret is already legal.
     */
    function planListMarkerCaretHome(model, caret) {
      const hit = editableItemOf(model, caret);
      if (hit === null) return null;
      const { line, m } = hit;
      const start = line.start + m[1].length;
      const end = start + (m[0].length - m[1].length);
      if (caret.offset > start && caret.offset < end) {
        const offset = caret.offset - start <= end - caret.offset ? start : end;
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
     * Plan the ordered-list marker Backspace (pure, v1.13): a plain
     * Backspace with the collapsed caret right AFTER an ordered marker
     * `N. ` — the same trigger the atomic marker delete owns for
     * bullets — retires the ITEM, not just the glyphs, and how depends
     * on the line's place in its run:
     *
     *   · NOT the run's first member → JOIN: the marker dies and the
     *     line's whole content splices onto the END of the previous
     *     member line (`1. one / 2. two` → `1. onetwo`); the members
     *     below renumber to close the gap.
     *   · the run's FIRST member → DETACH: only the marker dies, the
     *     line turns plain, and the members below re-anchor at the
     *     freed number (`2.`→`1.`, `3.`→`2.` …).
     *
     * The run is the same visual-line, same-indent, fence-excluded
     * grouping the renumber pass uses: the line directly above — soft
     * or paragraph, either — being a same-indent ordered member is
     * what makes this line "not first"; a bullet, plain line, indent
     * change, or fence above detaches instead. Fences guard both the
     * caret line and the line above. Bullets and plain lines are not
     * ours (null) — the atomic marker delete decides them.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {{index: number, offset: number}|null} caret - the collapsed
     *   caret's block index and flat char offset (null when unusable).
     * @returns {{
     *   kind: 'join'|'detach',
     *   index: number, start: number, prefix: string,
     *   indent: string, seed: number,
     *   sameBlock?: boolean, nlOffset?: number,
     * }|null} start/prefix describe the marker range (indent excluded);
     *   indent+seed feed the reanchor cascade (join: the previous
     *   member's number + 1; detach: this line's own number);
     *   join adds sameBlock (previous line inside the SAME block) and,
     *   then, nlOffset (the flat '\n' right before this line). null →
     *   not ours.
     */
    function planListBackspace(model, caret) {
      const hit = editableLineOf(model, caret);
      if (hit === null) return null;
      const { v, line } = hit;
      const m = ORDERED_ITEM_RE.exec(line.text);
      if (m === null) return null; // bullet/plain line: marker delete's call
      const start = line.start + m[1].length;
      const prefix = m[0].slice(m[1].length);
      if (caret.offset !== start + prefix.length) return null; // only right after the marker
      // First-of-run test: the visual line directly above, when it is a
      // same-indent ordered member outside every fence.
      if (v > 0) {
        const above = ORDERED_ITEM_RE.exec(model.lines[v - 1].text);
        if (above !== null && above[1] === m[1] && !model.inFence(v - 1)) {
          const sameBlock = model.lines[v - 1].block === caret.index;
          const join = {
            kind: 'join',
            index: caret.index,
            start,
            prefix,
            indent: m[1],
            seed: Number.parseInt(above[2], 10) + 1,
            sameBlock,
          };
          if (sameBlock) join.nlOffset = line.start - 1;
          return join;
        }
      }
      return {
        kind: 'detach',
        index: caret.index,
        start,
        prefix,
        indent: m[1],
        seed: Number.parseInt(m[2], 10),
      };
    }

    /**
     * Plan the renumber reanchor below a retired ordered item (pure,
     * v1.13): after a marker Backspace joined this line into the one
     * above or detached it to plain text, every ordered member BELOW
     * the caret's visual line — same indent run, fences excluded — is
     * reassigned sequentially starting at startDigits (join: the
     * previous member's number + 1; detach: the freed number), so
     * `1. 2. 3.` losing its `2.` to a join reads `1. 2.` and a first
     * item detaching from `1. 2. 3.` reads `1. 2.` below the plain
     * line. Members already at their target emit no edit; a manual
     * jump is pulled continuous, exactly like the insertion cascade
     * (planListShiftDown) — the contract is a continuous, duplicate-
     * free run. The walk stops at the first non-member line, an indent
     * change, or a fence. The caret's OWN line is never rewritten.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model, as it reads AFTER the join/detach edit.
     * @param {{index: number, offset: number}|null} caret - the
     *   caret on the joined/plain line.
     * @param {string} indent - the retired run's indent.
     * @param {number} startDigits - the first below member's target.
     * @returns {{index: number, start: number, end: number, digits: string}[]}
     *   splices for the members below (block index + flat digit range).
     */
    function planListReanchor(model, caret, indent, startDigits) {
      const hit = caretLineOf(model, caret);
      if (hit === null) return [];
      const edits = [];
      let expected = startDigits;
      for (let w = hit.v + 1; w <= model.last; w += 1) {
        // Fence content (even a yet-unpromoted soft line) stops the run.
        if (model.inFence(w)) break;
        const line = model.lines[w];
        const m = ORDERED_ITEM_RE.exec(line.text);
        if (m === null || m[1] !== indent) break; // run ends here
        if (String(expected) !== m[2]) {
          const start = line.start + indent.length;
          edits.push({ index: line.block, start, end: start + m[2].length, digits: String(expected) });
        }
        expected += 1;
      }
      return edits;
    }

    module.exports = {
      orderedItemOf,
      renumberEditsOf,
      planListMarkerDelete,
      planListMarkerHop,
      planListMarkerCaretHome,
      markerGlyphsOf,
      planListShiftDown,
      planListBackspace,
      planListReanchor,
    };
