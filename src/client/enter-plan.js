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
