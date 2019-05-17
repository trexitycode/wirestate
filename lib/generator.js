"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function makeGenerator() {
    /**
     * @param {StateNode} node
     * @param {string} generatorName
     */
    const generate = (node, generatorName) => {
        if (!generatorName) {
            throw new Error('Generator name must be provided');
        }
        if (generatorName === 'json')
            return jsonGenerator(node);
        if (generatorName === 'json-commonjs')
            return jsonCommonJsGenerator(node);
        if (generatorName === 'json-esm')
            return jsonEsmGenerator(node);
        throw new Error(`Generator "${generatorName}" not found`);
    };
    return { generate };
}
exports.makeGenerator = makeGenerator;
/** @param {ScopeNode} scopeNode */
function jsonGenerator(scopeNode) {
    /** @param {ScopeNode} scopeNode */
    const toJsonNode = scopeNode => {
        const jsonNode = {
            name: scopeNode.name,
            initial: scopeNode.initial ? true : undefined,
            final: scopeNode.final ? true : undefined,
            parallel: scopeNode.parallel ? true : undefined
        };
        if (scopeNode.transitions.length) {
            jsonNode.transitions = scopeNode.transitions.map(transition => {
                return { event: transition.event, target: transition.target };
            });
        }
        if (scopeNode.states.length) {
            jsonNode.states = scopeNode.states.map(toJsonNode);
        }
        return jsonNode;
    };
    return JSON.stringify(toJsonNode(scopeNode), null, 2);
}
/** @param {ScopeNode} scopeNode */
function jsonCommonJsGenerator(scopeNode) {
    return [
        'exports.config = ', jsonGenerator(scopeNode)
    ].join('');
}
/** @param {ScopeNode} scopeNode */
function jsonEsmGenerator(scopeNode) {
    return [
        'export const config = ', jsonGenerator(scopeNode)
    ].join('');
}
//# sourceMappingURL=generator.js.map