    /**
     * The key surface: document-capture keydown POLICY. Guards (IME,
     * trigger menus, composer scope, modifiers, repeats), then a table
     * of gesture policies — one per key family — where each policy is
     * three pure steps: prepare (plan inside editor.read, over ONE
     * shared line model), apply (inside editor.update, through the
     * edit algebra), and history (how the update tags the undo stack).
     * ONE claim path (preventDefault + stopImmediatePropagation) serves
     * every gesture. Arrivals the policies cannot intercept (↑/↓
     * column moves, clicks into a marker interior) are homed by the
     * restyle engine's caret-home stage instead.
     */
    const {
      IME_KEYCODE,
      RECENT_COMPOSITION_MS,
      HISTORY_MERGE_TAG,
      COMPOSER_INPUT,
      ORDERED_MARKER_RE,
    } = require('./constants');
    const { warnContract, resolveEditor, isTriggerMenuVisible } = require('./editor');
    const { readBlocks, caretBlockPoint, caretPoint } = require('./doc');
    const { visualModelOf } = require('./grammar');
    const { computeEnterPlan } = require('./enter-plan');
    const { planFenceKey } = require('./fence-plan');
    const {
      planListMarkerDelete,
      planListMarkerHop,
      planListShiftDown,
      planListBackspace,
      planListReanchor,
    } = require('./list-plan');
    const {
      applyEnterPlan,
      applyFenceKeyPlan,
      applyDigitRenames,
      consumeFlatRange,
      joinSoftLineAbove,
      joinParagraphAbove,
      placeFlatCaret,
    } = require('./edits');

    /** True while an IME composition is active (or just ended — Safari). */
    let composing = false;
    let composingUntil = 0;

    /** document-capture compositionstart. */
    function onCompositionStart() {
      composing = true;
    }

    /** document-capture compositionend: hold the guard one extra tick. */
    function onCompositionEnd() {
      composing = false;
      composingUntil = Date.now() + RECENT_COMPOSITION_MS;
    }

    /**
     * The three IME signals the DSH keymap itself trusts: isComposing,
     * keyCode 229, and the post-compositionend window.
     * @param {KeyboardEvent} event - the keydown under judgment.
     * @returns {boolean} true when an IME owns this key.
     */
    function isComposingEvent(event) {
      return (
        event.isComposing === true ||
        event.keyCode === IME_KEYCODE ||
        composing ||
        Date.now() < composingUntil
      );
    }

    /**
     * The one claim path: prepare a plan payload inside
     * editor.read(), and when it is ours consume the key and apply the
     * payload inside one editor.update(). history picks the update
     * tag: structural edits the user undoes as one step get discrete;
     * selection-only moves merge into the adjacent history entry.
     * @param {KeyboardEvent} event - the keydown.
     * @param {object} editor - the live editor.
     * @param {object} gesture - the policy {prepare, apply, history}.
     * @returns {boolean} whether the key was claimed.
     */
    function claim(event, editor, gesture) {
      let payload = null;
      try {
        editor.getEditorState().read(() => {
          payload = gesture.prepare(event, editor);
        });
      } catch (error) {
        warnContract(error);
        return false;
      }
      if (payload === null) return false; // not ours: native behavior proceeds
      // Keep the key from Lexical's root keydown and apply our own edit.
      event.preventDefault();
      event.stopImmediatePropagation();
      try {
        editor.update(() => {
          gesture.apply(payload, editor);
        }, gesture.history(payload));
      } catch (error) {
        warnContract(error);
      }
      return true;
    }

    /**
     * Shift+Enter: the markdown editing gesture. The fence arbitration
     * inside computeEnterPlan runs first; an ordered continuation
     * INSERTS a member, so the run below shifts +1 in the same update
     * (one Ctrl+Z reverts insertion and renumber together). Plain
     * Enter keeps DSH's native submit, untouched; Ctrl/Cmd/Alt
     * variants and held repeats are never ours.
     */
    const enterGesture = {
      keys: new Set(['Enter']),
      guard(event) {
        return event.shiftKey
          && !event.ctrlKey && !event.metaKey && !event.altKey
          && !event.repeat;
      },
      prepare(event, editor) {
        const blocks = readBlocks(editor);
        const point = caretBlockPoint(editor, blocks);
        if (point === null) return null;
        const model = visualModelOf(blocks.map((b) => b.text));
        const plan = computeEnterPlan(model, point.index, point.offset);
        return plan === null ? null : { plan, blocks, index: point.index };
      },
      apply({ plan, blocks, index }, editor) {
        applyEnterPlan(editor, plan, blocks, index);
        // Ordered continuation INSERTS a member: every member below
        // in the same run shifts +1, so the list stays continuous
        // and duplicate-free. Same update — one Ctrl+Z reverts
        // insertion and renumber together.
        if ((plan.kind === 'list-continue' || plan.kind === 'list-continue-soft')
          && ORDERED_MARKER_RE.test(plan.marker)) {
          const fresh = readBlocks(editor);
          const point = caretBlockPoint(editor, fresh);
          const edits = point === null
            ? []
            : planListShiftDown(visualModelOf(fresh.map((b) => b.text)), point);
          if (edits.length > 0) applyDigitRenames(editor, fresh, edits);
        }
      },
      history() {
        return { discrete: true };
      },
    };

    /**
     * Backspace / Delete / arrows with a plain collapsed caret: the
     * atomic gestures. The chain is ordered — fence box first, then
     * (delete keys only) the ordered marker Backspace (join/detach),
     * then the atomic marker delete, and (horizontal arrows only) the
     * atomic marker hop — and the first non-null plan wins; everything
     * else keeps the native key.
     */
    const atomicGesture = {
      keys: new Set([
        'Backspace',
        'Delete',
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
      ]),
      guard(event) {
        return !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey;
      },
      prepare(event, editor) {
        const key = event.key;
        const blocks = readBlocks(editor);
        const point = caretPoint(editor, blocks); // non-null only collapsed
        if (point === null) return null;
        const model = visualModelOf(blocks.map((b) => b.text));
        const fence = planFenceKey(model, point, key);
        if (fence !== null) return { kind: 'fence', plan: fence, blocks };
        if (key === 'Backspace' || key === 'Delete') {
          const caret = caretBlockPoint(editor, blocks);
          if (key === 'Backspace') {
            const join = planListBackspace(model, caret);
            if (join !== null) return { kind: 'join', plan: join, blocks };
          }
          const marker = planListMarkerDelete(model, caret, key);
          if (marker !== null) return { kind: 'marker', plan: marker, blocks };
        }
        if (key === 'ArrowLeft' || key === 'ArrowRight') {
          // The marker that deletes as one unit travels as one unit:
          // ←/→ hop over it instead of stepping through its interior.
          const hop = planListMarkerHop(model, caretBlockPoint(editor, blocks), key);
          if (hop !== null) return { kind: 'hop', plan: hop, blocks };
        }
        return null;
      },
      apply({ kind, plan, blocks }, editor) {
        if (kind === 'fence') {
          applyFenceKeyPlan(editor, plan, blocks);
          return;
        }
        if (kind === 'hop') {
          const block = blocks[plan.index];
          if (block !== undefined) placeFlatCaret(block.node, plan.offset);
          return;
        }
        const block = blocks[plan.index];
        if (kind === 'marker') {
          if (block !== undefined) {
            consumeFlatRange(editor, block, plan.start, plan.start + plan.prefix.length);
          }
          return;
        }
        // Ordered marker Backspace: JOIN the item into the line
        // above (non-first member) or DETACH the marker (first
        // member, the line turns plain).
        if (plan.kind === 'join') {
          if (plan.sameBlock) {
            if (block !== undefined) joinSoftLineAbove(block, plan);
          } else {
            joinParagraphAbove(blocks, plan.index, plan);
          }
        } else if (block !== undefined) {
          consumeFlatRange(editor, block, plan.start, plan.start + plan.prefix.length);
        }
        // The retired item's number frees up: re-anchor every member
        // below in the same run (join → previous number + 1; detach
        // → the freed number). Same update — one Ctrl+Z reverts the
        // join/detach and the renumber together.
        const fresh = readBlocks(editor);
        const point = caretBlockPoint(editor, fresh);
        const edits = point === null
          ? []
          : planListReanchor(visualModelOf(fresh.map((b) => b.text)), point, plan.indent, plan.seed);
        if (edits.length > 0) applyDigitRenames(editor, fresh, edits);
      },
      history({ kind, plan }) {
        // Whole-box unwraps / joins / markers get their own undo step
        // (one Ctrl+Z restores the markers); arrow moves (fence skips,
        // marker hops) are selection-only and merge into adjacent
        // history.
        return (kind === 'fence' && plan.kind !== 'fence-unwrap') || kind === 'hop'
          ? { tag: HISTORY_MERGE_TAG }
          : { discrete: true };
      },
    };

    /** The gesture policy table, in arbitration order. */
    const GESTURES = [enterGesture, atomicGesture];

    /**
     * Bind the key surface to a wiring hook (the restyle engine's
     * wireAttempt, so a keydown into a fresh composer wires it).
     * @param {{wireAttempt: () => void}} hooks
     * @returns {{onKeydown: Function, onCompositionStart: Function, onCompositionEnd: Function}}
     */
    function createGestures(hooks) {
      const wireAttempt = hooks.wireAttempt;
      /** document-capture keydown: the markdown-editing key surface. */
      function onKeydown(event) {
        // Yield to any capture listener that already consumed the key.
        if (event.defaultPrevented) return;
        // The keys this surface arbitrates; everything else passes.
        const gesture = GESTURES.find((g) => g.keys.has(event.key));
        if (gesture === undefined || !gesture.guard(event)) return;
        // An open trigger menu owns the keys; stay out entirely.
        if (isTriggerMenuVisible()) return;
        if (isComposingEvent(event)) return;
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (target.closest?.(COMPOSER_INPUT) == null) return; // composer only
        wireAttempt();
        const editor = resolveEditor();
        if (editor === null) return;
        claim(event, editor, gesture);
      }
      return { onKeydown, onCompositionStart, onCompositionEnd };
    }

    module.exports = { createGestures };
