"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BLACKLISTED_PROPS = ['line', 'column', 'indent'];
/**
 * @deprecated
 * @param {MachineNode} mainMachineNode
 * @param {Cache} cache
 */
async function jsonGenerator(mainMachineNode, cache) {
    const replacer = _DiscardJsonReplacer(BLACKLISTED_PROPS);
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
function _DiscardJsonReplacer(props) {
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