    /**
     * The document read: ONE coherent view of the composer draft's
     * NODES that every planner and every edit shares.
     *
     *   BLOCKS — root children flattened into leaves (text runs,
     *   reference chips, line breaks) with flat char geometry, so
     *   plans and edits address content by (block index, flat char
     *   offset) instead of node-key arithmetic.
     *
     *   CARET — the selection resolved onto that geometry (block index
     *   + flat offset, collapsed-caret shape, per-block covered
     *   ranges), each in a committed and a LIVE (pending-update)
     *   flavor.
     *
     * The string side of the model (visual lines, fences) lives in
     * ./grammar; this module is the only one that reads nodes.
     */
    const {
      nodeMapOf,
      rootBlocksOf,
      selectionOf,
      liveSelectionOf,
    } = require('./editor');

    /**
     * @typedef {{kind: 'text'|'chip'|'br', node: object|null, text: string}} Leaf
     * @typedef {{node: object, leaves: Leaf[], text: string}} Block
     */

    /**
     * Flatten one block's children into leaves. Text-ish nodes
     * (including the composer-text-ref subclass) carry their node;
     * reference chips are opaque atomic leaves (their clipboard text
     * counts toward the line but they can never be formatted); line
     * breaks contribute '\n' and carry their node too (the soft-line
     * pass needs the handle to promote one into a paragraph break).
     * @param {object} blockNode - a root child element node.
     * @returns {Block} the block view.
     */
    function makeBlock(blockNode) {
      const leaves = [];
      const walk = (element) => {
        for (const kid of element.getChildren()) {
          const type = kid.__type;
          if (typeof kid.__text === 'string') {
            leaves.push({ kind: 'text', node: kid, text: kid.getTextContent() });
          } else if (type === 'reference-chip') {
            leaves.push({ kind: 'chip', node: kid, text: kid.getTextContent() });
          } else if (type === 'linebreak') {
            leaves.push({ kind: 'br', node: kid, text: '\n' });
          } else if (typeof kid.getChildren === 'function') {
            walk(kid);
          }
        }
      };
      if (typeof blockNode.getChildren === 'function') walk(blockNode);
      return { node: blockNode, leaves, text: leaves.map((leaf) => leaf.text).join('') };
    }

    /**
     * Read the current blocks. Valid inside read() and update() alike —
     * node methods resolve the latest state on their own.
     * @param {object} editor - the live editor.
     * @returns {Block[]} blocks in document order.
     */
    function readBlocks(editor) {
      return rootBlocksOf(editor).map(makeBlock);
    }

    /**
     * The top-level block index holding one selection key, walking up
     * the parent chain to a root child (-1 when the key is unusable).
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @param {unknown} key - a selection anchor/focus node key.
     * @returns {number} index into blocks, or -1.
     */
    function blockIndexForKey(editor, blocks, key) {
      if (typeof key !== 'string') return -1;
      let node = nodeMapOf(editor)?.get?.(key);
      let guard = 0;
      while (node != null && guard < 64) {
        guard += 1;
        const parent = typeof node.getParent === 'function' ? node.getParent() : null;
        if (parent != null && parent.getKey?.() === 'root') {
          const blockKey = node.getKey();
          return blocks.findIndex((block) => block.node.getKey() === blockKey);
        }
        node = parent;
      }
      return -1;
    }

    /**
     * Map one selection endpoint (anchor/focus) to a flat char offset
     * inside its block. A text leaf carries the offset directly; a
     * line-break leaf maps its 0/1 side; an element selection on the
     * paragraph itself maps to the boundary BEFORE its offset-th
     * child — the sum of the text lengths of the preceding children
     * (v2.7: a mid-children element selection no longer snaps to the
     * block end; offset 0 is still the block start, and an offset
     * past the last child is still the block end).
     * @param {Block} block - the block view.
     * @param {unknown} key - the endpoint's node key.
     * @param {unknown} offset - the endpoint's offset.
     * @returns {number|null} the flat offset, or null when unusable.
     */
    function flatOffsetForKey(block, key, offset) {
      if (key === block.node.getKey()) {
        if (offset === 0) return 0;
        const kids = typeof block.node.getChildren === 'function'
          ? block.node.getChildren()
          : [];
        let flat = 0;
        for (let i = 0; i < Math.min(offset, kids.length); i += 1) {
          flat += typeof kids[i]?.getTextContent === 'function'
            ? kids[i].getTextContent().length
            : 0;
        }
        return flat;
      }
      let flat = 0;
      for (const leaf of block.leaves) {
        if (leaf.node.getKey() === key) {
          if (leaf.kind === 'text') return flat + Math.min(offset, leaf.text.length);
          return flat + (offset > 0 ? 1 : 0);
        }
        flat += leaf.text.length;
      }
      return null;
    }

    /**
     * The caret's block index AND flat char offset inside that block —
     * the visual line the caret is editing starts at the previous '\n'
     * after this offset. Range selections use the anchor (Shift+Enter
     * arbitration is anchor-driven).
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, offset: number}|null} null when unusable.
     */
    function caretBlockPoint(editor, blocks) {
      return caretBlockPointFrom(selectionOf(editor), editor, blocks);
    }

    /**
     * caretBlockPoint against the LIVE selection (inside an in-flight
     * editor.update, where getEditorState() still answers with the last
     * committed state): the commit-time re-plans of the caret-home
     * stage read through here so they never act on a position a newer
     * same-batch update has already left.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, offset: number}|null} null when unusable.
     */
    function caretBlockPointLive(editor, blocks) {
      return caretBlockPointFrom(liveSelectionOf(editor), editor, blocks);
    }

    /** caretBlockPoint's core over an explicit selection object. */
    function caretBlockPointFrom(selection, editor, blocks) {
      const anchor = selection?.anchor;
      if (anchor?.key === undefined) return null;
      const index = blockIndexForKey(editor, blocks, anchor.key);
      if (index < 0) return null;
      const block = blocks[index];
      if (block === undefined) return null;
      const offset = flatOffsetForKey(block, anchor.key, anchor.offset ?? 0);
      return offset === null ? null : { index, offset };
    }

    /**
     * The flat char ranges the selection genuinely covers, ONE entry
     * per touched block — the glyph-reveal test's input (a hidden tick
     * or marker glyph shows only while a range covers it). Same-block
     * endpoints yield the single [lo, hi) span between them (a
     * collapsed caret covers nothing); cross-block selections (v2.7:
     * Ctrl+A over a multi-paragraph draft, a drag across paragraphs)
     * project per block: the upper endpoint's block keeps its span
     * down to the block end, blocks in between are fully covered, and
     * the lower endpoint's block is covered up to its endpoint. Null
     * for missing selections or unresolvable keys.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, lo: number, hi: number}[]|null}
     */
    function selectionCoveredRanges(editor, blocks) {
      const selection = selectionOf(editor);
      const anchor = selection?.anchor;
      const focus = selection?.focus;
      if (anchor?.key === undefined || focus?.key === undefined) return null;
      const aIndex = blockIndexForKey(editor, blocks, anchor.key);
      const fIndex = blockIndexForKey(editor, blocks, focus.key);
      if (aIndex < 0 || fIndex < 0) return null;
      const a = flatOffsetForKey(blocks[aIndex], anchor.key, anchor.offset ?? 0);
      const f = flatOffsetForKey(blocks[fIndex], focus.key, focus.offset ?? 0);
      if (a === null || f === null) return null;
      if (aIndex === fIndex) {
        return [{ index: aIndex, lo: Math.min(a, f), hi: Math.max(a, f) }];
      }
      const down = aIndex < fIndex; // the anchor sits above the focus
      const ranges = [];
      for (let i = Math.min(aIndex, fIndex); i <= Math.max(aIndex, fIndex); i += 1) {
        const len = blocks[i]?.text.length ?? 0;
        let lo = 0;
        let hi = len;
        if (i === aIndex) {
          if (down) lo = a;
          else hi = a;
        }
        if (i === fIndex) {
          if (down) hi = f;
          else lo = f;
        }
        ranges.push({ index: i, lo: Math.min(lo, hi), hi: Math.max(lo, hi) });
      }
      return ranges;
    }

    /**
     * The collapsed caret as an atomic-key point: which block it sits
     * in and whether it rests on the block's first/last character.
     * Range selections (and missing/blurred selections) yield null —
     * the atomic fence/list gestures only apply to a plain collapsed
     * caret.
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, atStart: boolean, atEnd: boolean}|null}
     */
    function caretPoint(editor, blocks) {
      return caretPointFrom(selectionOf(editor), editor, blocks);
    }

    /**
     * caretPoint against the LIVE selection (same pending-vs-committed
     * rule as caretBlockPointLive — see there).
     * @param {object} editor - the live editor.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{index: number, atStart: boolean, atEnd: boolean}|null}
     */
    function caretPointLive(editor, blocks) {
      return caretPointFrom(liveSelectionOf(editor), editor, blocks);
    }

    /** caretPoint's core over an explicit selection object. */
    function caretPointFrom(selection, editor, blocks) {
      const anchor = selection?.anchor;
      const focus = selection?.focus;
      if (anchor?.key === undefined || focus?.key === undefined) return null;
      if (anchor.key !== focus.key || anchor.offset !== focus.offset) return null;
      const index = blockIndexForKey(editor, blocks, anchor.key);
      if (index < 0) return null;
      const block = blocks[index];
      if (block === undefined) return null;
      if (block.text === '') return { index, atStart: true, atEnd: true };
      const first = block.leaves[0];
      const lastLeaf = block.leaves[block.leaves.length - 1];
      const atStart = first !== undefined && first.kind === 'text'
        && first.node.getKey() === anchor.key && anchor.offset === 0;
      const atEnd = lastLeaf !== undefined && lastLeaf.kind === 'text'
        && lastLeaf.node.getKey() === anchor.key && anchor.offset === lastLeaf.text.length;
      return { index, atStart, atEnd };
    }

    /**
     * Blocks whose whole text was spliced away but which still strand
     * zero-length leaf "husks" (the unmergeable glyph leaves of a
     * marker-only line survive Lexical's normalization). A text
     * selection anchored in such a husk cannot reach the DOM, so the
     * repairs stage strips these blocks back to the pristine childless
     * paragraph. Pure query over the read blocks.
     * @param {Block[]} blocks - the read blocks.
     * @returns {{node: object, keys: string[]}[]} one entry per husk
     *   block, carrying the removable leaf keys.
     */
    function huskBlocksOf(blocks) {
      const husks = [];
      blocks.forEach((block) => {
        if (block.text !== '' || block.leaves.length === 0) return;
        husks.push({
          node: block.node,
          keys: block.leaves
            .map((leaf) => (leaf.node != null && typeof leaf.node.getKey === 'function'
              ? leaf.node.getKey()
              : null))
            .filter((key) => typeof key === 'string'),
        });
      });
      return husks;
    }

    module.exports = {
      makeBlock,
      readBlocks,
      blockIndexForKey,
      flatOffsetForKey,
      caretBlockPoint,
      caretBlockPointLive,
      selectionCoveredRanges,
      caretPoint,
      caretPointLive,
      huskBlocksOf,
    };
