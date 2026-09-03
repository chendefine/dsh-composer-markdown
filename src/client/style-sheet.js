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
