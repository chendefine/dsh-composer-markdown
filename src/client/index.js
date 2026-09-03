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
      planListMarkerDelete: onLines(LIST_PLAN.planListMarkerDelete),
      planListMarkerHop: onLines(LIST_PLAN.planListMarkerHop),
      planListMarkerCaretHome: onLines(LIST_PLAN.planListMarkerCaretHome),
      planListShiftDown: onLines(LIST_PLAN.planListShiftDown),
      planListBackspace: onLines(LIST_PLAN.planListBackspace),
      planListReanchor: onLines(LIST_PLAN.planListReanchor),
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
