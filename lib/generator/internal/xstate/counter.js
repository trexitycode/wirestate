"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Keeps track on singleton counting objects
let counters = new Map();
/**
 * @typedef {Object} CountingObject
 * @prop {number} value The current value of the counter
 * @prop {() => number} incr Increment the counter
 * @prop {() => number} decr Decrement the counter
 * @prop {() => number} valueOf
 */
/**
 * Factory function that produces a counter object with a counting API.
 *
 * @param {number} [value] The starting value of the counter
 * @return {CountingObject}
 */
function Counter(value = 1) {
    return Object.freeze({
        get value() {
            return value;
        },
        incr() {
            value += 1;
            return value;
        },
        decr() {
            value -= 1;
            return value;
        },
        valueOf() {
            return value;
        }
    });
}
exports.Counter = Counter;
/**
 * Retrieves or creates a singleton counting object.
 *
 * @param {string} name
 * @return {CountingObject}
 */
Counter.get = name => {
    if (counters.has(name)) {
        return counters.get(name);
    }
    else {
        counters.set(name, Counter());
        return counters.get(name);
    }
};
//# sourceMappingURL=counter.js.map