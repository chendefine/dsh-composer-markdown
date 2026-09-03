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

    /** Non-empty bullet item line: `- x` / `* x`, indent ≤ 3 spaces. */
    const BULLET_RE = /^(\s{0,3})([-*]) \S/;
    /** Non-empty ordered item line: `1. x` … `999999999. x`. */
    const NUMBER_RE = /^(\s{0,3})(\d{1,9})\. \S/;
    /** Bullet prefix with no content (Enter here exits the list). */
    const EMPTY_BULLET_RE = /^(\s{0,3})([-*]) $/;
    /** Ordered prefix with no content (Enter here exits the list). */
    const EMPTY_NUMBER_RE = /^(\s{0,3})(\d{1,9})\. $/;
    /** Any ordered item line — with content or a bare prefix — used to
     *  group a list for renumbering (content may also be empty). */
    const ORDERED_ITEM_RE = /^(\s{0,3})(\d{1,9})\. (?=\S|$)/;
    /** Any bullet item line — with content or a bare prefix — used for
     *  the atomic marker delete (the marker dies as one unit). */
    const BULLET_ITEM_RE = /^(\s{0,3})([-*]) (?=\S|$)/;
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
