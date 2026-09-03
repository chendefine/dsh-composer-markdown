    /**
     * Pure fence planning (unit-tested through __internals).
     *
     * Fence grammar is line grammar (./grammar): intervals and coverage
     * arrive pre-computed on the shared model, so every function here
     * is a pure projection (roles, soft-line promotion, pairs) or a
     * pure decision plan (atomic keys, marker nudges, orphan cleanup)
     * over it. The one hybrid is closedFencePairs, which reads block
     * node keys from the block views (never the editor itself).
     */
    const { FENCE_MARKER_RE, FENCE_OPEN_RE } = require('./constants');

    /**
     * Map a visual line to the BLOCK it wholly IS (-1 unless the line
     * spans exactly one whole block). The fence grammar speaks visual
     * lines; the DOM pass, the fence key plans and the pair tracker
     * speak paragraphs — this is the one translation point. After the
     * normalize stage every fence line is its own paragraph, so the
     * mapping is the identity there; an unpromoted transient (a fence
     * still sharing a paragraph with other lines) maps to -1 and its
     * consumers simply treat the fence as not-yet-atomic.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {number} v - the visual line index.
     * @returns {number} the block index, or -1 when the line is not a
     *   whole block.
     */
    function wholeBlockOf(model, v) {
      const line = model.lines[v];
      if (line === undefined || line.start !== 0) return -1;
      if (line.end !== model.texts[line.block].length) return -1;
      return line.block;
    }

    /**
     * The language id of a fence-opening line ('```py' → 'py', '```' →
     * null). Tolerates ≤3 leading spaces and trailing whitespace.
     * @param {string} line - the flattened opening-marker text.
     * @returns {string|null} the language id, or null when bare/unknown.
     */
    function fenceLangOf(line) {
      const m = FENCE_OPEN_RE.exec(line);
      if (m === null) return null;
      const lang = line.trim().slice(3).trim();
      return lang.length > 0 ? lang : null;
    }

    /**
     * Per-line fence roles: which VISUAL lines form each fenced code
     * block. The opening marker renders as the block banner (language
     * badge, markers hidden), interior lines as the code body, the
     * closing marker as the block's bottom padding.
     *
     * ACTIVATION IS COMMIT-ONLY: a fence with no closing ``` renders
     * NOTHING — every line stays plain text. The box materializes only
     * when the pair completes: the Shift+Enter commit gesture on the
     * marker line (skeleton, or the fence-commit tail split) or a
     * closing ``` landing on any line below (typed, pasted, restored).
     * So typing ``` at the head of a line — even mid-draft with content
     * below — never swallows that content into a box; content below an
     * uncommitted marker keeps its ordinary behavior everywhere, and
     * the markers themselves never show inside a rendered box.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{role: 'open'|'body'|'close'|null, lang: string|null}[]}
     *   one entry per visual line, in order.
     */
    function fenceRolesOf(model) {
      const roles = model.lines.map(() => ({ role: null, lang: null }));
      for (const { open, close } of model.intervals) {
        if (close === Infinity) continue; // uncommitted fence: plain text
        roles[open] = { role: 'open', lang: fenceLangOf(model.lines[open].text) };
        for (let i = open + 1; i < close; i += 1) {
          roles[i] = { role: 'body', lang: null };
        }
        roles[close] = { role: 'close', lang: null };
      }
      return roles;
    }

    /**
     * Per-BLOCK fence roles for the DOM styling pass: which PARAGRAPH
     * elements form each fenced code block. The DOM pass classes
     * paragraph elements, so the per-line roles fold onto blocks one
     * line per block — a block that carries a role must be exactly its
     * line. A multi-line block folds to null: the normalize stage
     * promotes every fence-adjacent soft boundary to a paragraph break
     * first (the "never style a mixed paragraph for a frame" rule), so
     * by the time this projection is read, a block mixing lines never
     * takes marker styling.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{role: 'open'|'body'|'close'|null, lang: string|null}[]}
     *   one entry per block, in order.
     */
    function blockRolesOf(model) {
      const lineRoles = fenceRolesOf(model);
      const roles = Array.from({ length: model.texts.length }, () => null);
      const linesPerBlock = Array.from({ length: model.texts.length }, () => 0);
      model.lines.forEach((line, v) => {
        const count = linesPerBlock[line.block] + 1;
        linesPerBlock[line.block] = count;
        roles[line.block] = count === 1 ? lineRoles[v] : null;
      });
      return roles;
    }

    /**
     * Soft line boundaries that must become paragraph breaks so the
     * fence grammar recognizes markers typed at the head of ANY line,
     * not just paragraph heads: ``` after a soft break (Shift+Enter)
     * or inside a pasted block. A boundary between visual lines v-1
     * and v is promoted when either side is covered by a fence region
     * (the committed-coverage rule of ./grammar): a CLOSED fence
     * isolates the open marker, the close marker, and every interior
     * line, each as its own paragraph (a mixed paragraph like ```…\ncode
     * would otherwise take the marker's zero-height/close styling and
     * hide the other line's text); an UNCOMMITTED fence isolates only
     * its marker line — enough for the commit gesture to reach it —
     * while the plain lines below keep their soft representation.
     * Lines outside fences keep their soft representation — only
     * fence-context boundaries are touched. The promotion is
     * text-identical: the removed '\n' leaf serializes exactly like
     * the '\n' gap between blocks, so the draft/send text stays
     * byte-for-byte.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {number[][]} per block, ascending flat char offsets where a
     * soft line begins and the paragraph must split.
     */
    function softSplitsOf(model) {
      const splits = Array.from({ length: model.texts.length }, () => []);
      for (let v = 1; v <= model.last; v += 1) {
        const line = model.lines[v];
        if (line.start === 0) continue; // paragraph head: already a hard boundary
        if (model.inFence(v - 1) || model.inFence(v)) {
          splits[line.block].push(line.start);
        }
      }
      return splits;
    }

    /**
     * A bare closing fence line: exactly ``` (≤3 leading spaces,
     * nothing else). Only such verbatim lines are eligible for orphan
     * cleanup.
     * @param {string} text - the flattened line text.
     * @returns {boolean}
     */
    function isBareCloseMarker(text) {
      return FENCE_MARKER_RE.test(text) && text.trim() === '```';
    }

    /**
     * Orphan-close cleanup: when a closed fence's OPENING marker
     * paragraph is fully deleted — the paragraph is gone, or its text
     * is emptied because the user removed the ``` symbols — while its
     * closing ``` paragraph still sits there verbatim, that close is
     * scaffold the pair no longer supports: plan its removal (plus the
     * emptied open line) so nothing lingers in the composer. Pairing
     * rides on paragraph node keys tracked across restyle passes, so
     * index shifts never confuse it; a line the user is mid-edit on
     * (still has content) stays watched, never nuked, and a bare
     * trailing ``` with no pair history (the user just typing one) is
     * never touched.
     * @param {{openKey: string, closeKey: string}[]} prevPairs - pairs
     *   tracked by the previous pass.
     * @param {{openKey: string, closeKey: string}[]} pairs - closed-fence
     *   pairs in the current draft.
     * @param {{key: string, text: string}[]} current - current blocks as
     *   {key, text}, in document order.
     * @param {string[]} caretKeys - block keys under anchor/focus.
     * @returns {{removeKeys: string[], reselectKey: string|null,
     *   keepPairs: {openKey: string, closeKey: string}[]}}
     */
    function planOrphanCleanup(prevPairs, pairs, current, caretKeys) {
      const byKey = new Map(current.map((block) => [block.key, block.text]));
      const order = new Map(current.map((block, i) => [block.key, i]));
      const liveCloses = new Set(pairs.map((pair) => pair.closeKey));
      const caret = new Set(caretKeys);
      const keep = pairs.slice();
      const remove = [];
      for (const prev of prevPairs) {
        const intact = pairs.some(
          (pair) => pair.openKey === prev.openKey && pair.closeKey === prev.closeKey,
        );
        if (intact) continue;
        const closeText = byKey.get(prev.closeKey);
        // Close gone or repurposed by the user → nothing to clean.
        if (closeText === undefined || !isBareCloseMarker(closeText)) continue;
        // The close now pairs with a different open → leave it alone.
        if (liveCloses.has(prev.closeKey)) continue;
        const openText = byKey.get(prev.openKey);
        const openEmpty = openText !== undefined && openText.trim() === '';
        if (openText !== undefined && !openEmpty) {
          keep.push(prev); // mid-edit line: keep watching, never delete content
          continue;
        }
        // Open paragraph gone entirely, or its marker fully deleted.
        remove.push(prev.closeKey);
        if (openEmpty) remove.push(prev.openKey);
      }
      let reselectKey = null;
      if (remove.length > 0 && remove.some((key) => caret.has(key))) {
        // The caret sits in a block being removed — hand it to the nearest
        // surviving neighbour (prefer the block after, for edit flow).
        const doomed = new Set(remove);
        const indexes = remove
          .map((key) => order.get(key))
          .filter((i) => i !== undefined)
          .sort((a, b) => a - b);
        const after = indexes
          .map((i) => current[i + 1])
          .find((block) => block !== undefined && !doomed.has(block.key));
        const before = indexes
          .map((i) => current[i - 1])
          .filter((block) => block !== undefined && !doomed.has(block.key))
          .pop();
        reselectKey = (after ?? before)?.key ?? null;
      }
      return { removeKeys: remove, reselectKey, keepPairs: keep };
    }

    /**
     * Closed-fence pairs of the current draft, keyed by paragraph node
     * keys (identity survives line insertions/deletions around them).
     * The fence grammar speaks visual lines while pairs speak
     * paragraphs, so each marker line maps through wholeBlockOf — in
     * the promoted world (the normalize stage guarantees it before
     * anything acts) the two vocabularies coincide; an unpromoted
     * transient simply yields no pair this pass.
     * @param {Block[]} blocks - the read blocks.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @returns {{openKey: string, closeKey: string}[]}
     */
    function closedFencePairs(blocks, model) {
      const pairs = [];
      for (const { open, close } of model.intervals) {
        if (close === Infinity) continue;
        const openBlock = wholeBlockOf(model, open);
        const closeBlock = wholeBlockOf(model, close);
        if (openBlock === -1 || closeBlock === -1) continue;
        const openNode = blocks[openBlock];
        const closeNode = blocks[closeBlock];
        if (openNode === undefined || closeNode === undefined) continue;
        pairs.push({ openKey: openNode.node.getKey(), closeKey: closeNode.node.getKey() });
      }
      return pairs;
    }

    /**
     * The caret point of a fence key plan: which block a collapsed caret
     * sits in and whether it rests on the block's first/last character.
     * @typedef {{index: number, atStart: boolean, atEnd: boolean}} CaretPoint
     */

    /**
     * Atomic fence key plan: Backspace / Delete / ArrowUp / ArrowDown at a
     * boundary of a COMMITTED fenced block treat the ```…``` region as
     * one object. Deleting into the box from any side UNWRAPS it — both
     * marker lines go, every body line survives as a plain paragraph
     * (one undo step restores the markers), and the caret stays where
     * it is: all four gesture positions sit in surviving blocks. The
     * vertical arrows skip over the marker lines instead of landing the
     * caret inside them, so the user never perceives the ``` glyphs at
     * all. Uncommitted (unclosed) fences are plain text and never
     * matched, and so is a fence still awaiting soft-line promotion —
     * the marker lines must BE paragraphs for the unwrap to remove.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {CaretPoint|null} point - the collapsed caret, or null.
     * @param {'Backspace'|'Delete'|'ArrowUp'|'ArrowDown'} key - the key.
     * @returns {null | {kind: 'fence-unwrap', open: number, close: number,
     *   caret: number} |
     *   {kind: 'fence-skip-up', open: number} |
     *   {kind: 'fence-skip-down', close: number}}
     *   null → not ours; the native key behavior proceeds. The unwrap
     *   plan carries the caret's block index so the applier can home
     *   it only in the empty-fence edge (caret on a marker line).
     */
    function planFenceKey(model, point, key) {
      if (point === null) return null;
      const { index, atStart, atEnd } = point;
      for (const { open, close } of model.intervals) {
        if (close === Infinity) continue; // uncommitted fence: plain text
        const openBlock = wholeBlockOf(model, open);
        const closeBlock = wholeBlockOf(model, close);
        if (openBlock === -1 || closeBlock === -1) continue; // unpromoted yet
        if (key === 'Backspace' && atStart) {
          if (index === openBlock + 1 || index === closeBlock + 1) {
            return { kind: 'fence-unwrap', open: openBlock, close: closeBlock, caret: index };
          }
        }
        if (key === 'Delete' && atEnd) {
          if (index === openBlock - 1 || index === closeBlock - 1) {
            return { kind: 'fence-unwrap', open: openBlock, close: closeBlock, caret: index };
          }
        }
        if (key === 'ArrowUp' && atStart && index === openBlock + 1) {
          return { kind: 'fence-skip-up', open: openBlock };
        }
        if (key === 'ArrowDown' && atEnd && index === closeBlock - 1) {
          return { kind: 'fence-skip-down', close: closeBlock };
        }
      }
      return null;
    }

    /**
     * Caret homing plan: a collapsed caret that somehow landed on a
     * zero-height marker paragraph of a COMMITTED fence (click on the
     * box edges, programmatic moves) moves to the adjacent content
     * line — the markers stay completely imperceptible, with no
     * invisible-caret dead zone. Uncommitted (unclosed) fences never
     * nudge: their marker line is plain text the user may well be
     * typing on. When no content line sits between the markers (an
     * empty ```/``` pair) the caret hops OUT of the box entirely, so
     * successive passes converge instead of bouncing a caret between
     * the two marker lines forever.
     * @param {ReturnType<import('./grammar').visualModelOf>} model - the
     *   shared line model.
     * @param {CaretPoint|null} point - the collapsed caret, or null.
     * @returns {{index: number, where: 'start'|'end'}|null} the block
     *   index to home into, or null when the caret is already fine
     *   (or has nowhere better to go).
     */
    function planMarkerNudge(model, point) {
      if (point === null) return null;
      const last = model.texts.length - 1;
      let role = null;
      let interval = null;
      for (const iv of model.intervals) {
        if (iv.close === Infinity) continue; // uncommitted fence: plain text
        const openBlock = wholeBlockOf(model, iv.open);
        const closeBlock = wholeBlockOf(model, iv.close);
        if (openBlock === -1 || closeBlock === -1) continue; // unpromoted yet
        if (point.index === openBlock) {
          role = 'open';
          interval = { open: openBlock, close: closeBlock };
          break;
        }
        if (point.index === closeBlock) {
          role = 'close';
          interval = { open: openBlock, close: closeBlock };
          break;
        }
      }
      if (role === null) return null;
      const { open, close } = interval;
      if (role === 'open' && close - 1 > open) return { index: open + 1, where: 'start' };
      if (role === 'close' && close - 1 > open) return { index: close - 1, where: 'end' };
      // No content line to home into: hop out of the box (prefer the
      // paragraph after it); nowhere to go → leave the caret alone.
      const after = close + 1 <= last ? close + 1 : null;
      const before = open - 1 >= 0 ? open - 1 : null;
      const index = after ?? before;
      return index === null ? null : { index, where: 'start' };
    }

    module.exports = {
      fenceLangOf,
      fenceRolesOf,
      blockRolesOf,
      softSplitsOf,
      isBareCloseMarker,
      wholeBlockOf,
      planOrphanCleanup,
      closedFencePairs,
      planFenceKey,
      planMarkerNudge,
    };
