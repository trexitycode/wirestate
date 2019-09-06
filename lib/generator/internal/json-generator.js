"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BLACKLISTED_PROPS = ['line', 'column', 'indent'];
/** @param {CacheBase} cache */
function jsonGenerator(cache) {
    const replacer = DiscardJsonReplacer(BLACKLISTED_PROPS);
    return JSON.stringify(cache, replacer, 2);
}
exports.jsonGenerator = jsonGenerator;
/**
 * Factory function that produces a JSON replacer function that will discard
 * properties that in the specified properties array.
 *
 * @param { string[] } props Property names to discard from all objects
 * @return { (key: string, value) => any }
 */
function DiscardJsonReplacer(props) {
    return (key, value) => {
        if (props.includes(key)) {
            return undefined;
        }
        else {
            return value;
        }
    };
}
//# sourceMappingURL=json-generator.js.map