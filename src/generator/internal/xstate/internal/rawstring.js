/**
 * Wraps a string in rawstring demarcations
 *
 * @param {string} s
 */
export const rawstring = s => `<!${s}!>`

/**
 * Unwraps demarked, quoted rawstrings
 *
 * @param {string} s
 */
export const unwrap = s => s.replace(/"<!(.+?)!>"/g, '$1')
