    /**
     * The draft analysis: ONE read of the composer's texts, assembled
     * into every pure projection the drivers consult — fence roles,
     * soft-line promotion, code spans/delimiters, list marker glyphs,
     * the renumber invariant. Each projection is computed by its
     * domain module over the shared line model (./grammar); this
     * module only composes them, so a pass costs exactly one
     * derivation of each (the pre-v3 code re-derived fences and
     * visual lines seven times per scan, once per feature).
     *
     * Eager on purpose: composer drafts are small, every restyle pass
     * needs almost every projection anyway, and one shared object is
     * what keeps the projections from ever drifting apart (they see
     * the same lines and the same fence coverage by construction).
     */
    const { visualModelOf } = require('./grammar');
    const { blockRolesOf, softSplitsOf } = require('./fence-plan');
    const { codeSpansOf, codeDelimsOf } = require('./code-plan');
    const { renumberEditsOf, markerGlyphsOf } = require('./list-plan');

    /**
     * Assemble the full analysis of one draft.
     * @param {readonly string[]} texts - one flattened text per block.
     * @returns {ReturnType<visualModelOf> & {
     *   blockRoles: ({role: 'open'|'body'|'close'|null, lang: string|null}|null)[],
     *   softSplits: number[][],
     *   spans: {start: number, end: number}[][],
     *   delims: number[][],
     *   markers: {at: number, kind: 'num'|'bullet'|'bullet-space'}[][],
     *   renumber: {index: number, start: number, end: number, digits: string}[],
     * }} the model fields (texts, lines, intervals, last, lineIndexAt,
     * inFence) plus the assembled projections.
     */
    function analyzeDraft(texts) {
      const model = visualModelOf(texts);
      return {
        ...model,
        blockRoles: blockRolesOf(model),
        softSplits: softSplitsOf(model),
        spans: codeSpansOf(model),
        delims: codeDelimsOf(model),
        markers: markerGlyphsOf(model),
        renumber: renumberEditsOf(model),
      };
    }

    module.exports = { analyzeDraft };
