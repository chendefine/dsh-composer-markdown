    /**
     * Host-editor contract seam — the only module that touches the
     * host's underscore internals (the fact contracts F2/F6/F7 in the
     * tech doc: __lexicalEditor, _nodes, _nodeMap, _selection,
     * _compositionKey). Everything else in the bundle reaches the
     * editor THROUGH these helpers, so an upgrade that breaks one
     * degrades in ONE place: warnContract fires once and the plugin
     * becomes a safe no-op.
     */
    const { COMPOSER_INPUT, MENU_PROBE } = require('./constants');

    let contractWarned = false;

    /** Warn once about a broken host/editor contract, then stay quiet. */
    function warnContract(detail) {
      if (contractWarned) return;
      contractWarned = true;
      console.warn('[dsh-composer-markdown] host contract missing; plugin inert', detail);
    }

    /**
     * Resolve the live composer editor (F2: Lexical hangs the instance
     * off the contenteditable root element). Re-resolved per call: the
     * composer is rebuilt per session, so a cached instance would be
     * disposed.
     * @returns {object|null} the Lexical editor, or null when absent
     * (no session / workspace picker / not yet mounted).
     */
    function resolveEditor() {
      const el = document.querySelector(COMPOSER_INPUT);
      if (!(el instanceof HTMLElement)) return null;
      const editor = el.__lexicalEditor;
      return editor ?? null;
    }

    /**
     * The real node class for a registered type, from the editor's own
     * registry (so created nodes belong to the host's lexical copy —
     * bundling a second lexical would split module state and node
     * classes).
     * @param {object} editor - the live editor.
     * @param {string} type - node type string ('paragraph' | 'text' | …).
     * @returns {Function|null} the class, or null when unknown.
     */
    function klassOf(editor, type) {
      const entry = editor._nodes?.get?.(type);
      return entry?.klass ?? null;
    }

    /**
     * Whether the slash/at trigger menu is currently visible (F12: a
     * visible listbox inside the composer card owns the Enter keys).
     * @returns {boolean}
     */
    function isTriggerMenuVisible() {
      const menu = document.querySelector(MENU_PROBE);
      return menu instanceof HTMLElement && menu.offsetParent !== null;
    }

    /** The editor state's live node map (blocks looked up by key). */
    function nodeMapOf(editor) {
      return editor.getEditorState()._nodeMap;
    }

    /** The root block's children as an array (empty when unusable). */
    function rootBlocksOf(editor) {
      const root = nodeMapOf(editor)?.get?.('root');
      if (root == null || typeof root.getChildren !== 'function') return [];
      return root.getChildren();
    }

    /** The live selection object (anchor/focus points), or null. */
    function selectionOf(editor) {
      return editor.getEditorState()._selection;
    }

    /**
     * The LIVE selection as of RIGHT NOW: inside an in-flight
     * editor.update() the pending state carries the current selection
     * (earlier callbacks in the same batch may already have moved it —
     * a marker hop, a caret placement), while getEditorState() answers
     * with the last COMMITTED state. Check-then-move re-plans (the
     * caret-home stage) must read through here or they act on stale
     * positions and yank the caret back. Outside an update the pending
     * state is null and this reads exactly like selectionOf.
     * @param {object} editor - the live editor.
     * @returns {object|null} the active selection, or null.
     */
    function liveSelectionOf(editor) {
      const pending = editor._pendingEditorState;
      return pending != null && pending._selection !== undefined
        ? pending._selection
        : selectionOf(editor);
    }

    /**
     * The LIVE node map (same pending-vs-committed rule as
     * liveSelectionOf): inside an in-flight update, lookups resolve the
     * versions earlier same-batch callbacks produced. Node METHODS
     * resolve the active state on their own, but direct data reads
     * (getTextContent) on a committed-map node see stale text.
     * @param {object} editor - the live editor.
     * @returns {Map|null} the active node map.
     */
    function liveNodeMapOf(editor) {
      const pending = editor._pendingEditorState;
      return pending != null && pending._nodeMap !== undefined
        ? pending._nodeMap
        : nodeMapOf(editor);
    }

    /**
     * The composition key Lexical maintains while an IME owns the
     * caret (null/undefined when idle) — the restyle pass yields to it.
     */
    function compositionKeyOf(editor) {
      return editor._compositionKey;
    }

    module.exports = {
      warnContract,
      resolveEditor,
      klassOf,
      isTriggerMenuVisible,
      nodeMapOf,
      liveNodeMapOf,
      rootBlocksOf,
      selectionOf,
      liveSelectionOf,
      compositionKeyOf,
    };
