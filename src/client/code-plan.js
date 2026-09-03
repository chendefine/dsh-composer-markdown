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
