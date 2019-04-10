"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable-next-line */
var ast_nodes_1 = require("./ast-nodes");
function makeGenerator() {
    /**
     * @param {StateNode} node
     * @param {string} generatorName
     */
    var generate = function (node, generatorName) {
        if (!generatorName) {
            throw new Error('Generator name must be provided');
        }
        if (generatorName === 'json')
            return jsonGenerator(node);
        if (generatorName === 'json-commonjs')
            return jsonCommonJsGenerator(node);
        if (generatorName === 'json-esm')
            return jsonEsmGenerator(node);
        if (generatorName === 'xstate-config')
            return xstateConfigGenerator(node);
        if (generatorName === 'xstate-config-commonjs')
            return xstateConfigCommonJsGenerator(node);
        if (generatorName === 'xstate-config-esm')
            return xstateConfigEsmGenerator(node);
        if (generatorName === 'xstate-machine')
            return xstateMachineGenerator(node);
        if (generatorName === 'xstate-machine-esm')
            return xstateMachineGeneratorEsm(node);
        throw new Error("Generator \"" + generatorName + "\" not found");
    };
    return { generate: generate };
}
exports.makeGenerator = makeGenerator;
/** @param {StateNode} stateNode */
function jsonGenerator(stateNode) {
    /** @param {StateNode} stateNode */
    var toJsonNode = function (stateNode) {
        var jsonNode = {
            name: stateNode.name,
            initial: stateNode.initial ? true : undefined,
            final: stateNode.final ? true : undefined,
            parallel: stateNode.parallel ? true : undefined
        };
        if (stateNode.transitions.length) {
            jsonNode.transitions = stateNode.transitions.map(function (transition) {
                return { event: transition.event, target: transition.target };
            });
        }
        if (stateNode.states.length) {
            jsonNode.states = stateNode.states.map(toJsonNode);
        }
        return jsonNode;
    };
    return JSON.stringify(toJsonNode(stateNode), null, 2);
}
/** @param {StateNode} stateNode */
function jsonCommonJsGenerator(stateNode) {
    return [
        'exports.config = ', jsonGenerator(stateNode)
    ].join('');
}
/** @param {StateNode} stateNode */
function jsonEsmGenerator(stateNode) {
    return [
        'export const config = ', jsonGenerator(stateNode)
    ].join('');
}
/** @param {StateNode} stateNode */
function xstateConfigGenerator(stateNode) {
    /** @param {StateNode} stateNode */
    var toXstateNode = function (stateNode) {
        var xstateNode = {
            id: stateNode.parent
                ? stateNode.id
                : stateNode.name,
            initial: (stateNode.states.find(function (state) { return !!state.initial; }) || { name: undefined }).name,
            final: stateNode.final ? true : undefined,
            type: stateNode.parallel ? 'parallel' : undefined
        };
        if (stateNode.transitions.length) {
            xstateNode.on = stateNode.transitions.reduce(function (o, transition) {
                var s = ast_nodes_1.resolveState(transition);
                if (s === stateNode || (stateNode.parent || { states: [] }).states.find(function (ss) { return ss === s; })) {
                    o[transition.event] = s.name;
                }
                else {
                    o[transition.event] = "#" + s.id;
                }
                return o;
            }, {});
        }
        if (stateNode.states.length) {
            xstateNode.states = stateNode.states.reduce(function (states, /** @type {StateNode} */ stateNode) {
                states[stateNode.name] = toXstateNode(stateNode);
                return states;
            }, {});
        }
        return xstateNode;
    };
    return JSON.stringify(toXstateNode(stateNode), null, 2);
}
/** @param {StateNode} stateNode */
function xstateConfigCommonJsGenerator(stateNode) {
    return [
        'exports.config = ', xstateConfigGenerator(stateNode)
    ].join('');
}
/** @param {StateNode} stateNode */
function xstateConfigEsmGenerator(stateNode) {
    return [
        'export const config = ', xstateConfigGenerator(stateNode)
    ].join('');
}
/** @param {StateNode} stateNode */
function xstateMachineGenerator(stateNode) {
    return [
        "const { Machine } = require('xstate')\n\n",
        'exports.machine = Machine(', xstateConfigGenerator(stateNode), ')'
    ].join('');
}
/** @param {StateNode} stateNode */
function xstateMachineGeneratorEsm(stateNode) {
    return [
        "import { Machine } from 'xstate'\n\n",
        'export const machine = Machine(', xstateConfigGenerator(stateNode), ')'
    ].join('');
}
