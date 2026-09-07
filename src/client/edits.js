    /**
     * The edit algebra: every mutation the plugin performs, expressed
     * as one small set of primitives over the block/leaf model.
     *
     * This is the load-bearing seam of the architecture: planners are
     * pure (plan data, unit-tested through __internals), THIS module
     * is the only code that mutates live nodes, and its callers —
     * gestures (key policy) and restyle (the convergence engine) —
     * never touch nodes directly. Every primitive runs inside
     * editor.update(), walks leaves exactly once, and treats reference
     * chips as atomic: a non-text leaf inside a touched range stops
     * the walk safely instead of corrupting it.
     */
    const { IS_CODE, HISTORY_MERGE_TAG } = require('./constants');
    const {
      warnContract,
      klassOf,
      nodeMapOf,
      liveSelectionOf,
      rootBlocksOf,
      selectionOf,
    } = require('./editor');
    const { makeBlock, readBlocks } = require('./doc');

    // ── flat-range text surgery ────────────────────────────────────────

    /**
     * Erase the flat char range [start, end) from one block, splicing
     * across whatever text leaves carry it. Returns the first touched
     * text leaf and the local offset where the range began (for caret
     * placement), or null when nothing was erased.
     * @param {Block} block - the block view.
     * @param {number} start - flat range start.
     * @param {number} end - flat range end (exclusive).
     * @returns {{node: object, at: number}|null}
     */
    function eraseFlatRange(block, start, end) {
      let flat = 0;
      let hit = null;
      for (const leaf of block.leaves) {
        const s = flat;
        const e = flat + leaf.text.length;
        flat = e;
        if (e <= start) continue; // before the range
        if (s >= end) break; // past the range
        if (leaf.kind !== 'text' || leaf.text === '') return hit; // chip/br: stay safe
        const from = Math.max(start, s) - s;
        const to = Math.min(end, e) - s;
        if (hit === null) hit = { node: leaf.node, at: from };
        leaf.node.spliceText(from, to - from, '', false);
      }
      return hit;
    }

    /**
     * Erase the flat range [start, end) and park the collapsed caret
     * where the range began — the atomic marker delete, the ordered
     * detach, and the soft empty-item exit all land the caret there.
     * The caret NEVER rests on an emptied text leaf: a text selection
     * anchored in a zero-length leaf cannot reach the DOM (the leaf's
     * element holds no text node, so Lexical's DOM-selection apply
     * bails) and the composer goes caret-less and dead. Two guards:
     * the erase emptied the WHOLE block (a marker-only line — the
     * unmergeable glyph husks would strand there forever) → strip the
     * leftover leaves and reset the paragraph to the pristine
     * empty-paragraph shape (no children, an element selection —
     * exactly a fresh composer, typeable and DOM-selectable); anything
     * less → placeFlatCaret re-reads the block and picks the first
     * NON-empty leaf at/after the range start.
     * @param {object} editor - the live editor.
     * @param {Block} block - the block view.
     * @param {number} start - flat range start.
     * @param {number} end - flat range end (exclusive).
     */
    function consumeFlatRange(editor, block, start, end) {
      const hit = eraseFlatRange(block, start, end);
      if (hit === null) return; // nothing erased: leave the caret alone
      const fresh = makeBlock(block.node);
      if (fresh.text === '') {
        for (const leaf of fresh.leaves) leaf.node.remove?.();
        if (typeof block.node.selectStart === 'function') block.node.selectStart();
        return;
      }
      placeFlatCaret(block.node, start);
    }

    /**
     * Place the collapsed caret at a flat char offset of one block, on
     * the first NON-EMPTY text leaf the offset reaches — the walk
     * selects a leaf while `offset < leafEnd`, so a position exactly
     * AT a leaf boundary lands on the NEXT non-empty text leaf's
     * start (the right leaf's start wins over the left leaf's end
     * when both touch), and a position past every leaf falls back to
     * the last non-empty text leaf's end. A fresh flatten walks the
     * CURRENT children, so callers may mutate first and pass
     * post-edit offsets. Chips cannot hold a caret; a boundary
     * against a chip falls to the adjacent text leaf.
     * @param {object} blockNode - the paragraph node.
     * @param {number} offset - flat char offset into its flattened text.
     */
    function placeFlatCaret(blockNode, offset) {
      let lastText = null;
      let flat = 0;
      for (const leaf of makeBlock(blockNode).leaves) {
        const start = flat;
        const end = flat + leaf.text.length;
        flat = end;
        if (leaf.kind !== 'text' || leaf.text === '') continue;
        if (offset < end) {
          const at = Math.max(0, offset - start);
          if (typeof leaf.node.select === 'function') leaf.node.select(at, at);
          return;
        }
        lastText = { node: leaf.node, len: leaf.text.length };
      }
      if (lastText !== null && typeof lastText.node.select === 'function') {
        lastText.node.select(lastText.len, lastText.len);
      } else if (typeof blockNode.selectEnd === 'function') blockNode.selectEnd();
      else if (typeof blockNode.selectStart === 'function') blockNode.selectStart();
    }

    // ── selection riding ───────────────────────────────────────────────

    /**
     * Shift one selection point across a text splice it follows. A point
     * inside the replaced range lands at the end of the insertion; a point
     * after it slides by the length delta; a point at or before the start
     * stays. Points are {key, offset, type} — Point.set is the host
     * editor's own mutation path (TextNode.spliceText uses it too).
     * @param {{key: string, offset: number, type: string}|undefined} point
     *   the anchor or focus of the live selection.
     * @param {string} key - the spliced text node's key.
     * @param {number} from - local splice start.
     * @param {number} to - local splice end.
     * @param {number} inserted - the replacement length.
     */
    function shiftPointOverSplice(point, key, from, to, inserted) {
      if (point == null || point.key !== key || point.type !== 'text') return;
      const delta = inserted - (to - from);
      if (delta === 0) return; // same width: every offset stays valid
      if (point.offset >= to) point.set(key, point.offset + delta, point.type);
      else if (point.offset > from) point.set(key, from + inserted, point.type);
    }

    /**
     * Apply planned digit renames inside editor.update(): splice each
     * member's digit run to its target number. Only the digit
     * characters change — indent, ". " and content stay byte-identical —
     * and any caret/selection riding a rewritten node is shifted across
     * the splice (multi-digit renumbers like 10. → 9. change the width).
     * The selection read is the LIVE one (liveSelectionOf): Lexical
     * re-derives a fresh, writable selection object for every update
     * (from the DOM), while the committed state's points are frozen
     * history — mutating those throws in dev builds and silently
     * corrupts undo history in production. Chips can never sit inside
     * a digit run; an edit whose range crosses a non-text leaf is
     * skipped rather than corrupted. A soft-lined block carries
     * SEVERAL edits: they are applied right-to-left, so a splice never
     * shifts the flat range of an edit still to come (each splice only
     * moves content to its right, and the caret shifts ride each
     * splice independently).
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the blocks read at plan time.
     * @param {{index: number, start: number, end: number, digits: string}[]} edits
     *   planned digit replacements.
     */
    function applyDigitRenames(editor, blocks, edits) {
      const selection = liveSelectionOf(editor);
      // Unique by identity: a stubbed (or aliased) collapsed caret must
      // shift once, not once per endpoint.
      const points = selection != null && selection.anchor != null && selection.focus != null
        ? [...new Set([selection.anchor, selection.focus])]
        : [];
      // Right-to-left: several members of one soft-lined paragraph
      // renumber in a single pass, and their flat ranges were computed
      // against the same read.
      const ordered = [...edits].sort((a, b) => (b.index - a.index) || (b.start - a.start));
      for (const edit of ordered) {
        const block = blocks[edit.index];
        if (block === undefined) continue;
        // Map the flat digit range onto the block's text leaves; the
        // replacement text goes into the FIRST overlapping leaf only.
        let offset = 0;
        const overlapping = [];
        let safe = true;
        for (const leaf of makeBlock(block.node).leaves) {
          const start = offset;
          const end = offset + leaf.text.length;
          offset = end;
          if (end <= edit.start || start >= edit.end) continue;
          if (leaf.kind !== 'text' || leaf.text === '') {
            safe = false; // a chip/br inside the digits: do not touch
            break;
          }
          overlapping.push({
            node: leaf.node,
            from: Math.max(start, edit.start) - start,
            to: Math.min(end, edit.end) - start,
            piece: overlapping.length === 0 ? edit.digits : '',
          });
        }
        if (!safe || overlapping.length === 0) continue;
        for (const { node, from, to, piece } of overlapping) {
          const key = node.getKey();
          node.spliceText(from, to - from, piece, false);
          for (const point of points) {
            shiftPointOverSplice(point, key, from, to, piece.length);
          }
        }
      }
    }

    // ── structural primitives ──────────────────────────────────────────

    /**
     * Append one empty paragraph after a block; null (warned) when the
     * host registry lacks the paragraph class.
     * @param {object} editor - the live editor.
     * @param {object} blockNode - the paragraph to append after.
     * @returns {object|null} the inserted paragraph node.
     */
    function newParagraphAfter(editor, blockNode) {
      const Paragraph = klassOf(editor, 'paragraph');
      if (Paragraph === null) {
        warnContract('paragraph class not registered');
        return null;
      }
      const para = new Paragraph();
      blockNode.insertAfter(para);
      return para;
    }

    /**
     * Split one paragraph at a flat char offset and grow the next
     * paragraph from the tail: everything from the split point on
     * moves into the fresh paragraph, behind its pre-seeded
     * `{prefix}` text — so a mid-line caret cuts the line there and
     * the tail becomes the new line's content. An EMPTY prefix (the
     * fence paths) skips the seed text entirely. A straddling text
     * leaf is split first (left part keeps the node key); chips/
     * line-breaks move whole. The caret rests at the start of the new
     * line — right after the prefix when there is one.
     * @param {object} editor - the live editor.
     * @param {Block} block - the caret block.
     * @param {number} offset - flat char split point.
     * @param {string} prefix - indent + list marker to pre-seed ('' for
     *   the plain fence break).
     */
    function splitTailToNewParagraph(editor, block, offset, prefix) {
      const Paragraph = klassOf(editor, 'paragraph');
      const Text = klassOf(editor, 'text');
      if (Paragraph === null || Text === null) {
        warnContract('paragraph/text node classes not registered (list split)');
        return;
      }
      const para = new Paragraph();
      const text = prefix.length > 0 ? new Text(prefix) : null;
      if (text !== null) para.append(text);
      // Find the node that starts the tail (the first node at/after the
      // split point).
      let tail = null;
      let flat = 0;
      for (const leaf of block.leaves) {
        const start = flat;
        const end = flat + leaf.text.length;
        flat = end;
        if (leaf.kind === 'text' && offset > start && offset < end) {
          try {
            leaf.node.splitText(offset - start);
          } catch {
            // stale/foreign node: leave the tail where it is
          }
          tail = leaf.node.getNextSibling();
          break;
        }
        if (offset <= start) {
          tail = leaf.node;
          break;
        }
      }
      block.node.insertAfter(para);
      while (tail != null) {
        const next = tail.getNextSibling();
        para.append(tail);
        tail = next;
      }
      if (text !== null) text.select(); // caret right after the new prefix
      else para.selectStart(); // plain break: caret at the new line's head
    }

    /**
     * Insert a soft line break + the list marker at a flat char offset
     * inside the caret block (list continuation on a SOFT line). The
     * break lands AT THE OFFSET the plan chose — the caret's own
     * position when the line is split mid-content (the tail after the
     * caret becomes the new item's content, right after the marker),
     * or the caret line's END for the classic append (any text on the
     * next soft line stays where it is). A text leaf straddling the
     * offset is split first (the left part keeps the node key); the
     * caret rests right after the marker.
     * @param {object} editor - the live editor.
     * @param {Block} block - the caret block.
     * @param {number} offset - flat char offset (the split point).
     * @param {string} marker - indent + list marker to pre-seed.
     */
    function insertSoftContinuation(editor, block, offset, marker) {
      const Break = klassOf(editor, 'linebreak');
      const Text = klassOf(editor, 'text');
      if (Break === null || Text === null) {
        warnContract('linebreak/text node classes not registered (soft list continue)');
        return;
      }
      const br = new Break();
      const text = new Text(marker);
      let flat = 0;
      let placed = false;
      for (const leaf of block.leaves) {
        const len = leaf.text.length;
        if (len === 0) continue;
        const start = flat;
        const end = flat + len;
        flat = end;
        if (offset > start && offset < end && leaf.kind === 'text') {
          // Mid-leaf: split it, then the new line follows the left part.
          let left = leaf.node;
          try {
            left = leaf.node.splitText(offset - start)[0] ?? leaf.node;
          } catch {
            // stale/foreign node: fall through to the boundary cases
          }
          left.insertAfter(br);
          placed = true;
          break;
        }
        if (offset <= start) {
          leaf.node.insertBefore(br);
          placed = true;
          break;
        }
      }
      if (!placed) block.node.append(br);
      br.insertAfter(text);
      text.select(); // caret right after the prefix
    }

    /**
     * Apply one planListLevelShift plan (the level ladder, v2.8):
     * per touched visual line, insert or remove the LEVEL_STEP run at
     * the line's flat head — the item line AND its whole subtree, in
     * ONE update (one Ctrl+Z reverts the ladder move as a whole).
     *
     * Edits are applied RIGHT-TO-LEFT over (block index, flat offset)
     * so a splice never shifts the range of an edit still to come;
     * each edit re-reads its block's leaves, so any leaf
     * fragmentation (the shape stage isolates marker glyphs into
     * single-char leaves) is walked as it stands. A removal splices
     * every text leaf its span touches (a chip/br inside the span —
     * impossible for a line's leading spaces, but guarded against
     * anyway — aborts just that edit); an insertion goes into the first
     * non-empty text leaf the offset reaches, falling back to the
     * last non-empty leaf's end. Every splice shifts the LIVE
     * selection points across it (same riding rule as
     * applyDigitRenames).
     *
     * The caret then parks at the plan's mapped offset on the item's
     * block — with the consumeFlatRange safety net: an unlisted BARE
     * marker empties its whole block, and empty husk leaves cannot
     * carry a DOM-reachable selection, so the block resets to the
     * pristine childless paragraph instead.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the blocks read at plan time.
     * @param {{kind: string, edits: {index: number, at: number,
     *   remove: number, insert: string}[], caret: {index: number,
     *   offset: number}}} plan - the planListLevelShift plan.
     */
    function applyLevelEdits(editor, blocks, plan) {
      if (plan.edits.length === 0) return; // a capped/noop plan: nothing to touch
      const selection = liveSelectionOf(editor);
      // Unique by identity: a stubbed (or aliased) collapsed caret must
      // shift once, not once per endpoint.
      const points = selection != null && selection.anchor != null && selection.focus != null
        ? [...new Set([selection.anchor, selection.focus])]
        : [];
      const ordered = [...plan.edits].sort((a, b) => (b.index - a.index) || (b.at - a.at));
      for (const edit of ordered) {
        const block = blocks[edit.index];
        if (block === undefined) continue;
        if (edit.remove > 0) {
          let offset = 0;
          const overlapping = [];
          let safe = true;
          for (const leaf of makeBlock(block.node).leaves) {
            const start = offset;
            const end = offset + leaf.text.length;
            offset = end;
            if (end <= edit.at || start >= edit.at + edit.remove) continue;
            if (leaf.kind !== 'text' || leaf.text === '') {
              safe = false; // a chip/br inside the span: do not touch
              break;
            }
            overlapping.push({
              node: leaf.node,
              from: Math.max(start, edit.at) - start,
              to: Math.min(end, edit.at + edit.remove) - start,
            });
          }
          if (!safe || overlapping.length === 0) continue;
          for (const { node, from, to } of overlapping) {
            const key = node.getKey();
            node.spliceText(from, to - from, '', false);
            for (const point of points) {
              shiftPointOverSplice(point, key, from, to, 0);
            }
          }
        } else if (edit.insert.length > 0) {
          let lastText = null;
          let target = null;
          let flat = 0;
          for (const leaf of makeBlock(block.node).leaves) {
            const start = flat;
            const end = flat + leaf.text.length;
            flat = end;
            if (leaf.kind !== 'text' || leaf.text === '') continue;
            lastText = { node: leaf.node, len: leaf.text.length };
            if (target === null && end >= edit.at) {
              target = { node: leaf.node, from: Math.max(0, edit.at - start) };
            }
          }
          const pick = target ?? (lastText !== null
            ? { node: lastText.node, from: lastText.len }
            : null);
          if (pick === null) continue; // nothing text-ish to splice into
          const key = pick.node.getKey();
          pick.node.spliceText(pick.from, 0, edit.insert, false);
          for (const point of points) {
            shiftPointOverSplice(point, key, pick.from, pick.from, edit.insert.length);
          }
        }
      }
      const block = blocks[plan.caret.index];
      if (block === undefined) return;
      if (makeBlock(block.node).text === '') {
        // The reset rule of consumeFlatRange: a bare marker unlisted
        // leaves only husk leaves — strip them, element-select.
        for (const leaf of makeBlock(block.node).leaves) leaf.node.remove?.();
        if (typeof block.node.selectStart === 'function') block.node.selectStart();
        return;
      }
      placeFlatCaret(block.node, plan.caret.offset);
    }

    /**
     * Remove blocks by node key (returns the set actually removed —
     * stale keys simply resolve to nothing).
     * @param {object} editor - the live editor.
     * @param {readonly string[]} keys - block node keys to remove.
     * @returns {Set<string>} the keys that were removed.
     */
    function removeBlockKeys(editor, keys) {
      const nodeMap = nodeMapOf(editor);
      const removed = new Set();
      for (const key of keys) {
        const node = nodeMap?.get?.(key);
        if (node != null && typeof node.remove === 'function') {
          node.remove();
          removed.add(key);
        }
      }
      return removed;
    }

    // ── plan appliers ──────────────────────────────────────────────────

    /**
     * Apply one Shift+Enter plan at the caret block. Node classes come
     * from the editor registry; caret placement rides the host's own
     * select() methods.
     * @param {object} editor - the live editor.
     * @param {ReturnType<computeEnterPlan>} plan - the plan to apply.
     * @param {Block[]} blocks - the blocks read at plan time.
     * @param {number} index - the caret's block index.
     */
    function applyEnterPlan(editor, plan, blocks, index) {
      const Paragraph = klassOf(editor, 'paragraph');
      const Text = klassOf(editor, 'text');
      if (Paragraph === null || Text === null) {
        warnContract('paragraph/text node classes not registered');
        return;
      }
      const block = blocks[index];
      if (block === undefined) return;
      switch (plan.kind) {
        case 'list-continue': {
          splitTailToNewParagraph(editor, block, plan.offset, plan.indent + plan.marker);
          return;
        }
        case 'list-continue-soft': {
          insertSoftContinuation(editor, block, plan.offset, plan.indent + plan.marker);
          return;
        }
        case 'list-exit': {
          consumeFlatRange(editor, block, 0, plan.prefix.length);
          placeFlatCaret(block.node, 0);
          return;
        }
        case 'list-exit-soft': {
          consumeFlatRange(editor, block, plan.offset, plan.offset + plan.prefix.length);
          return;
        }
        case 'fence-close': {
          const content = new Paragraph();
          const close = new Paragraph();
          close.append(new Text('```'));
          block.node.insertAfter(content);
          content.insertAfter(close);
          content.selectStart(); // caret at the empty content line
          return;
        }
        case 'fence-commit': {
          // ``` just typed at a content line's head: keep the tick run
          // as the marker line, move the whole tail (the user's
          // content) below the closing skeleton. Split first — the
          // tail paragraph lands right after the head — then squeeze
          // the empty body + close between the two halves.
          splitTailToNewParagraph(editor, block, plan.offset, '');
          const content = new Paragraph();
          const close = new Paragraph();
          close.append(new Text('```'));
          block.node.insertAfter(content);
          content.insertAfter(close);
          content.selectStart(); // caret at the empty content line
          return;
        }
        case 'fence-newline':
          // Break AT THE CARET: the tail after it becomes the new
          // line (a caret at the line end degenerates to the classic
          // append-below — the new paragraph is empty).
          splitTailToNewParagraph(editor, block, plan.offset, '');
          return;
        case 'fence-exit': {
          const para = new Paragraph();
          block.node.insertAfter(para);
          para.selectStart();
          return;
        }
        default:
          return;
      }
    }

    /**
     * Apply an atomic fence key plan inside editor.update(). A
     * committed fenced block is one object: a boundary delete UNWRAPS
     * it — both ``` marker paragraphs go, every body line survives as
     * a plain paragraph (its own undo step) — and the arrow skips
     * move the caret past the marker lines, growing an exit paragraph
     * when the box ends the draft.
     * @param {object} editor - the live editor.
     * @param {ReturnType<planFenceKey>} plan - the plan to apply.
     * @param {Block[]} blocks - the blocks read at plan time.
     */
    function applyFenceKeyPlan(editor, plan, blocks) {
      if (plan.kind === 'fence-skip-up') {
        const before = blocks[plan.open - 1];
        const first = blocks[plan.open + 1];
        if (before !== undefined && typeof before.node.selectEnd === 'function') before.node.selectEnd();
        else if (first !== undefined) first.node.selectStart(); // box opens the draft: clamp
        return;
      }
      if (plan.kind === 'fence-skip-down') {
        const after = blocks[plan.close + 1];
        if (after !== undefined) {
          after.node.selectStart();
          return;
        }
        // The box ends the draft: grow one paragraph after it so the
        // caret has somewhere to go (this is the box's exit flow).
        const para = newParagraphAfter(editor, blocks[plan.close].node);
        if (para !== null) para.selectStart();
        return;
      }
      // fence-unwrap: remove ONLY the two marker paragraphs — the body
      // lines stay, byte-identical, as plain paragraphs. All four
      // gesture positions keep the caret in a surviving block, so it
      // does not move; only the empty-fence edge (caret resting on a
      // marker line) needs homing.
      const doomed = [];
      for (const i of [plan.open, plan.close]) {
        const key = blocks[i]?.node.getKey();
        if (typeof key === 'string') doomed.push(key);
      }
      const body = blocks[plan.open + 1];
      const before = blocks[plan.open - 1];
      const after = blocks[plan.close + 1];
      removeBlockKeys(editor, doomed);
      if (plan.caret === plan.open || plan.caret === plan.close) {
        const home = body !== undefined && plan.open + 1 !== plan.close ? body : after;
        if (home !== undefined) {
          home.node.selectStart();
        } else if (before !== undefined) {
          if (typeof before.node.selectEnd === 'function') before.node.selectEnd();
          else before.node.selectStart();
        }
      }
      // The fence WAS the whole draft (empty body, no neighbours): keep
      // the composer alive with one empty paragraph.
      const root = nodeMapOf(editor)?.get?.('root');
      if (root !== null && root !== undefined && rootBlocksOf(editor).length === 0) {
        const Paragraph = klassOf(editor, 'paragraph');
        if (Paragraph === null) {
          warnContract('paragraph class missing after fence unwrap');
          return;
        }
        const para = new Paragraph();
        root.append(para);
        para.selectStart();
      }
    }

    // ── restyle-driven primitives ──────────────────────────────────────

    /**
     * Promote soft line boundaries to real paragraph breaks, inside
     * editor.update(): for one block, each planned flat-offset boundary —
     * a '\n' from a LineBreakNode leaf or a literal newline inside a text
     * leaf — splits the paragraph there. The head stays in the original
     * paragraph, the separator newline is dropped, and the tail moves into
     * a fresh paragraph after it. The clipboard projection is byte
     * identical either way (the '\n' gap between blocks serializes exactly
     * like the removed '\n' leaf), so draft, persistence, and send text
     * never change — only the paragraph structure the fence grammar reads.
     * Selections ride along: moved nodes keep their keys, so a caret in
     * the tail stays where the user put it.
     * @param {object} editor - the live editor.
     * @param {object} blockNode - the paragraph node to split.
     * @param {readonly number[]} offsets - ascending flat char offsets
     *   (into the block's flattened text) where a soft line begins.
     */
    function promoteSoftBoundaries(editor, blockNode, offsets) {
      const Paragraph = klassOf(editor, 'paragraph');
      if (Paragraph === null) {
        warnContract('paragraph class not registered (soft-line normalize)');
        return;
      }
      let current = blockNode;
      let base = 0; // flat offset of `current`'s head within the block text
      for (const offset of offsets) {
        let seek = offset - base - 1; // char index of the '\n' inside `current`
        let separator = null;
        for (const leaf of makeBlock(current).leaves) {
          if (seek < 0 || seek >= leaf.text.length) {
            seek -= leaf.text.length;
            continue;
          }
          if (leaf.kind === 'br') {
            separator = leaf.node;
          } else if (leaf.kind === 'text' && leaf.text.charCodeAt(seek) === 10) {
            // Split the leaf around the newline: [before]['\n'][after];
            // the middle part becomes the separator to drop.
            try {
              const parts = leaf.node.splitText(seek, seek + 1);
              separator = parts[1] ?? null;
            } catch {
              separator = null; // stale/foreign node: skip this boundary
            }
          } else {
            return; // '\n' inside a chip's clipboard text: atomic, unsplittable
          }
          break;
        }
        if (separator == null || typeof separator.remove !== 'function') continue;
        const para = new Paragraph();
        current.insertAfter(para);
        let mover = separator.getNextSibling();
        while (mover != null) {
          const next = mover.getNextSibling();
          para.append(mover);
          mover = next;
        }
        separator.remove();
        current = para;
        base = offset;
      }
    }

    /**
     * Whether one block's current code formatting already matches the
     * desired spans (read-side diff; no mutation). Three desired
     * shapes: the IS_CODE coverage of the span interiors, the LEAF
     * ISOLATION of the delimiter backticks, and the LEAF ISOLATION of
     * the list-marker glyphs (each styled digit / bullet dash) — each
     * rendered glyph char must sit in its own single-char text leaf
     * (marked unmergeable, or Lexical's text normalization merges it
     * straight back into its plain neighbors) so the DOM pass can
     * address (and restyle) exactly that glyph.
     * @param {Block} block - the block view.
     * @param {{start: number, end: number}[]} spans - desired code spans.
     * @param {number[]} delims - flat positions of delimiter backticks.
     * @param {number[]} [glyphs] - flat positions of list-marker glyphs.
     * @returns {boolean} true when a write is needed.
     */
    function shapeMismatch(block, spans, delims, glyphs = []) {
      let offset = 0;
      for (const leaf of block.leaves) {
        const start = offset;
        const end = offset + leaf.text.length;
        offset = end;
        if (leaf.kind !== 'text' || leaf.text === '') continue;
        const coded = (leaf.node.getFormat() & IS_CODE) !== 0;
        const covering = spans.some((span) => span.start <= start && end <= span.end);
        const overlapping = spans.some((span) => span.start < end && start < span.end);
        if (overlapping && !covering) return true; // a boundary cuts this node
        if (covering !== coded) return true; // format flip needed
        // Single-char isolation: delimiters and marker glyphs share the
        // same geometry — the leaf must be exactly the char, and it must
        // be pinned unmergeable so normalization cannot merge it back.
        const isolated = (p) => start === p && end === p + 1;
        const touched = (p) => start < p + 1 && p < end;
        for (const p of [...delims, ...glyphs]) {
          if (touched(p) && !isolated(p)) return true; // glyph not isolated
        }
        if ([...delims, ...glyphs].some(isolated)
          && typeof leaf.node.isUnmergeable === 'function'
          && !leaf.node.isUnmergeable()) return true; // isolation must stick
      }
      return false;
    }

    /**
     * Apply the desired spans to one block inside editor.update(): split
     * text nodes at span AND single-char-glyph boundaries, then set/clear
     * IS_CODE per part and pin every isolated glyph leaf unmergeable.
     * Chips are skipped (atomic); their text keeps the span geometry. The
     * delimiter and marker glyphs themselves stay UNformatted leaves —
     * their styling is a DOM-layer concern (the restyle passes), not a
     * format bit.
     * @param {Block} block - the block view.
     * @param {{start: number, end: number}[]} spans - desired code spans.
     * @param {number[]} delims - flat positions of delimiter backticks.
     * @param {number[]} [glyphs] - flat positions of list-marker glyphs.
     */
    function applyShape(block, spans, delims, glyphs = []) {
      // Split phase: collect local boundaries per text node, split once.
      const singles = [...delims, ...glyphs];
      const splits = new Map();
      let offset = 0;
      for (const leaf of makeBlock(block.node).leaves) {
        const start = offset;
        const end = offset + leaf.text.length;
        offset = end;
        if (leaf.kind !== 'text' || leaf.text === '') continue;
        const local = [];
        for (const span of spans) {
          if (span.start > start && span.start < end) local.push(span.start - start);
          if (span.end > start && span.end < end) local.push(span.end - start);
        }
        for (const p of singles) {
          if (p > start && p < end) local.push(p - start);
          if (p + 1 > start && p + 1 < end) local.push(p + 1 - start);
        }
        if (local.length > 0) {
          splits.set(leaf.node, [...new Set(local)].sort((a, b) => a - b));
        }
      }
      for (const [node, local] of splits) {
        try {
          node.splitText(...local);
        } catch {
          // A stale/foreign node simply stays unstyled this round.
        }
      }
      // Set phase: after splitting, every part is fully in or fully out.
      // A part that IS exactly a delimiter or marker glyph gets the
      // unmergeable detail bit — Lexical's text normalization merges
      // adjacent same-format simple-text leaves, and only that bit keeps
      // the one-char leaf (and the styling mark riding its element)
      // alive. Stale bits on leaves that are no longer glyphs are left
      // alone: a slightly fragmented paragraph is projection-identical
      // and harmless.
      offset = 0;
      for (const leaf of makeBlock(block.node).leaves) {
        const start = offset;
        const end = offset + leaf.text.length;
        offset = end;
        if (leaf.kind !== 'text' || leaf.text === '') continue;
        const covering = spans.some((span) => span.start <= start && end <= span.end);
        const format = leaf.node.getFormat();
        const coded = (format & IS_CODE) !== 0;
        if (covering && !coded) leaf.node.setFormat(format | IS_CODE);
        else if (!covering && coded) leaf.node.setFormat(format & ~IS_CODE);
        if (singles.some((p) => start === p && end === p + 1)
          && typeof leaf.node.isUnmergeable === 'function'
          && !leaf.node.isUnmergeable()) {
          leaf.node.toggleUnmergeable();
        }
      }
    }

    /**
     * Clear every IS_CODE bit (uninstall path) — text content untouched.
     * @param {object} editor - the live editor.
     */
    function clearCodeBits(editor) {
      try {
        editor.update(() => {
          for (const block of readBlocks(editor)) {
            for (const leaf of makeBlock(block.node).leaves) {
              if (leaf.kind !== 'text' || leaf.text === '') continue;
              const format = leaf.node.getFormat();
              if ((format & IS_CODE) !== 0) leaf.node.setFormat(format & ~IS_CODE);
            }
          }
        }, { discrete: true, tag: HISTORY_MERGE_TAG });
      } catch (error) {
        warnContract(error);
      }
    }

    module.exports = {
      eraseFlatRange,
      consumeFlatRange,
      placeFlatCaret,
      shiftPointOverSplice,
      applyDigitRenames,
      applyLevelEdits,
      newParagraphAfter,
      splitTailToNewParagraph,
      insertSoftContinuation,
      removeBlockKeys,
      applyEnterPlan,
      applyFenceKeyPlan,
      promoteSoftBoundaries,
      shapeMismatch,
      applyShape,
      clearCodeBits,
    };
