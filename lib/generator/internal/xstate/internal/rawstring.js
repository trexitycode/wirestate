"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Wraps a string in rawstring demarcations
 *
 * @param {string} s
 */
exports.rawstring = s => `<!${s}!>`;
/**
 * Unwraps demarked, quoted rawstrings
 *
 * @param {string} s
 */
exports.unwrap = s => s.replace(/"<!(.+?)!>"/g, '$1');
//# sourceMappingURL=rawstring.js.map