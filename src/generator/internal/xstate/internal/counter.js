// Keeps track of singleton counting objects
/** @type {Map<string, CountingObject>} */
let counters = new Map()

/**
 * @typedef {Object} CountingObject
 * @prop {number} value The current value of the counter
 * @prop {() => number} incr Increment the counter
 * @prop {() => number} decr Decrement the counter
 * @prop {() => number} valueOf
 */

/**
 * Factory function that produces a counting object with a counting API.
 *
 * @param {number} [value] The starting value of the counter
 * @return {CountingObject}
 */
export function Counter (value = 0) {
  return Object.freeze({
    get value () {
      return value
    },
    incr () {
      value += 1
      return value
    },
    decr () {
      value -= 1
      return value
    },
    valueOf () {
      return value
    }
  })
}

/**
 * Retrieves or creates a singleton counting object.
 *
 * @param {string} name
 * @return {CountingObject}
 */
Counter.get = name => {
  if (counters.has(name)) {
    return counters.get(name)
  } else {
    counters.set(name, Counter())
    return counters.get(name)
  }
}
