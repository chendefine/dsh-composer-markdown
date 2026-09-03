/**
 * dsh-composer-markdown — Host entry.
 *
 * A no-op carrier: it gives the bundle an importable entry row for the
 * loader and the Settings → Plugins list. Every behavior is implemented in
 * the browser client — client.js, the single-file artifact generated from
 * the src/client/ modules by scripts/build.mjs.
 *
 * @module dsh-composer-markdown
 */

export const name = 'composer-markdown'

/** Host side has nothing to do; all logic lives in the client. */
export function apply() {}
