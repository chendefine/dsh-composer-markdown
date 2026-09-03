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
