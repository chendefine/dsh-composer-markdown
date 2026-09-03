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
