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
