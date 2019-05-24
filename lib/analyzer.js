"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FS = require("fs");
const Path = require("path");
const util_1 = require("util");
const tokenizer_1 = require("./tokenizer");
const parser_1 = require("./parser");
const ast_nodes_1 = require("./ast-nodes");
const FileSystem = require("./file-system");
const readFile = util_1.promisify(FS.readFile);
class SemanticError extends Error {
    constructor(message, { fileName = 'Unknown', line = 0, column = 0 }) {
        super(message);
        this.fileName = fileName;
        this.line = line;
        this.column = column;
    }
}
/** @param {string} eventName */
const normalizeEventName = eventName => {
    return eventName.split(',').map(e => e.trim()).sort().join(',');
};
/**
 * @param {ScopeNode} scopeNode
 * @param {Object} options
 * @param {Cache} options.cache
 * @param {string} [options.srcDir] The directory to search for wirestate files
 * @return {Promise<ScopeNode>}
 */
function analyze(scopeNode, { cache, srcDir = '' }) {
    if (scopeNode instanceof ast_nodes_1.ScopeNode) {
        return analyzeScopeNode(scopeNode.clone(), { cache, srcDir });
    }
    else {
        throw new Error('Can only analyzie ScopeNode instances');
    }
}
/**
 * @param {string} wireStateFile
 * @param {Object} options
 * @param {Cache} options.cache
 * @param {string} [options.srcDir]
 * @return {Promise<ScopeNode>}
 */
async function requireWireStateFile(wireStateFile, { cache, srcDir = '' }) {
    if (wireStateFile.startsWith('.')) {
        throw new Error(`WireState file cannot start with ./ or ../`);
    }
    const fileName = Path.resolve(srcDir, wireStateFile);
    const fileExists = await FileSystem.fileExists(fileName);
    if (!fileExists) {
        throw Object.assign(new Error(`WireState file not found\n  File: ${wireStateFile}`), { code: 'ENOENT' });
    }
    const cacheHit = await cache.has(wireStateFile);
    if (cacheHit) {
        return cache.get(wireStateFile);
    }
    const promise = new Promise((resolve, reject) => {
        readFile(fileName, 'utf8').then(text => {
            const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile });
            const parser = parser_1.makeParser({ wireStateFile });
            const tokens = tokenizer.tokenize(text);
            const scopeNode = parser.parse(tokens);
            resolve(analyze(scopeNode, { cache, srcDir }));
        }, reject);
    });
    await cache.set(wireStateFile, promise);
    return promise;
}
exports.requireWireStateFile = requireWireStateFile;
/**
 * @param {ScopeNode} scopeNode
 * @param {Object} options
 * @param {Cache} options.cache
 * @param {string} [options.srcDir]
 */
async function analyzeScopeNode(scopeNode, { cache, srcDir = '' }) {
    // Ensure that we have unique machine IDs
    const machineIds = scopeNode.machines.map(machineNode => machineNode.id);
    const uniqueMachineIds = new Set(machineIds);
    for (let machineId of uniqueMachineIds) {
        const k = machineIds.indexOf(machineId);
        const l = machineIds.lastIndexOf(machineId);
        if (k !== l) {
            const machineNode = scopeNode.machines.find(n => n.id === machineId);
            throw new SemanticError(`Duplicate machine\n  Machine ID: "${machineId}"`, {
                fileName: scopeNode.wireStateFile,
                line: machineNode.line,
                column: machineNode.column
            });
        }
    }
    // Analyze the import nodes
    await Promise.all(scopeNode.imports.map(async (node) => {
        return analyzeImportNode(node, { cache, srcDir });
    }));
    // Analyze the machine nodes
    scopeNode._machines = await Promise.all(scopeNode.machines.map(machineNode => {
        return analyzeMachineNode(machineNode, { cache });
    }));
    return scopeNode;
}
/**
 * @param {ImportNode} importNode
 * @param {Object} options
 * @param {Cache} options.cache
 * @param {string} [options.srcDir]
 */
async function analyzeImportNode(importNode, { cache, srcDir = '' }) {
    if (Path.isAbsolute(importNode.wireStateFile)) {
        throw new SemanticError(`Import file cannot be absolute`, {
            fileName: importNode.parent.wireStateFile,
            line: importNode.line,
            column: importNode.column
        });
    }
    let file = /^\.+[/\\]/.test(importNode.wireStateFile)
        ? Path.join(Path.dirname(importNode.parent.wireStateFile), importNode.wireStateFile)
        : importNode.wireStateFile;
    // Ensure the file we're importing has an extension,
    // by default it's the .wirestate extension
    file = Path.extname(file)
        ? file
        : `${file}.wirestate`;
    importNode._wireStateFile = file;
    requireWireStateFile(file, { cache, srcDir });
    return importNode;
}
/**
 * @param {MachineNode} machineNode
 * @param {Object} options
 * @param {Cache} options.cache
 * @return {Promise<MachineNode>}
 */
async function analyzeMachineNode(machineNode, { cache }) {
    // Ensure that we have unique state IDs
    const stateIds = machineNode.states.map(stateNode => stateNode.id);
    const uniqueStateIds = new Set(stateIds);
    for (let stateId of uniqueStateIds) {
        const k = stateIds.indexOf(stateId);
        const l = stateIds.lastIndexOf(stateId);
        if (k !== l) {
            const stateNode = machineNode.states.find(n => n.id === stateId);
            throw new SemanticError(`Duplicate state\n  State ID: "${stateId}"`, {
                fileName: stateNode.scopeNode.wireStateFile,
                line: stateNode.line,
                column: stateNode.column
            });
        }
    }
    // Ensure that we have unique transitions
    const transitionEvents = machineNode.transitions.map(transitionNode => {
        return normalizeEventName(transitionNode.event);
    });
    const uniqueTransitionEvents = new Set(transitionEvents);
    for (let event of uniqueTransitionEvents) {
        const k = transitionEvents.indexOf(event);
        const l = transitionEvents.lastIndexOf(event);
        if (k !== l) {
            const transitionNode = machineNode.transitions.find(n => {
                return normalizeEventName(n.event) === event;
            });
            throw new SemanticError(`Duplicate transition\n  Transition Event: "${transitionNode.event}"`, {
                fileName: machineNode.parent.wireStateFile,
                line: transitionNode.line,
                column: transitionNode.column
            });
        }
    }
    // Ensure that we have unique event protocols
    const protocolEvents = machineNode.eventProtocols.map(eventProtocolNode => {
        return eventProtocolNode.eventName.split(',').map(e => e.trim()).sort().join(',');
    });
    const uniqueProtocolEvents = new Set(protocolEvents);
    for (let event of uniqueProtocolEvents) {
        const k = protocolEvents.indexOf(event);
        const l = protocolEvents.lastIndexOf(event);
        if (k !== l) {
            const eventProtocolNode = machineNode.eventProtocols.find(n => {
                return n.eventName.split(',').map(e => e.trim()).sort().join(',') === event;
            });
            throw new SemanticError(`Duplicate event protocol\n  Event Protocol: "${eventProtocolNode.eventName}"`, {
                fileName: machineNode.parent.wireStateFile,
                line: eventProtocolNode.line,
                column: eventProtocolNode.column
            });
        }
    }
    // Ensure transitions target a state that can be reached
    machineNode.transitions.forEach(transitionNode => {
        const stateNode = ast_nodes_1.resolveState(transitionNode);
        if (!stateNode) {
            throw new SemanticError(`Transition target cannot be resolved\n  Transition Target: ${transitionNode.target}`, {
                fileName: machineNode.parent.wireStateFile,
                line: transitionNode.line,
                column: transitionNode.column
            });
        }
    });
    // Verify there is only one initial child state
    if (machineNode.states.filter(n => n.initial).length > 1) {
        const s = machineNode.states.filter(n => n.initial)[1];
        throw new SemanticError(`Only one child state can be marked as initial\n  Machine ID: "${machineNode.id}"`, {
            fileName: machineNode.parent.wireStateFile,
            line: s.line,
            column: s.column
        });
    }
    // If no child state is set to be initial then, set first child state to be initial
    if (machineNode.states.length && !machineNode.states.some(n => n.initial)) {
        machineNode.states[0].initial = true;
    }
    // Analyze state nodes
    machineNode._states = await Promise.all(machineNode.states.map(stateNode => {
        return analyzeStateNode(stateNode, { cache });
    }));
    return machineNode;
}
/**
 * @param {StateNode} stateNode
 * @param {Object} options
 * @param {Cache} options.cache
 * @return {Promise<StateNode>}
 */
async function analyzeStateNode(stateNode, { cache }) {
    // Transient states cannot have child states
    if (stateNode.stateType === 'transient' && stateNode.states.length > 0) {
        throw new SemanticError(`Transient states cannot have child states\n  State ID: ${stateNode.id}"`, {
            fileName: stateNode.scopeNode.wireStateFile,
            line: stateNode.states[0].line,
            column: stateNode.states[0].column
        });
    }
    // For atomic states that have child states, set their stateType to "compound"
    if (stateNode.stateType === 'atomic' && stateNode.states.length > 0) {
        stateNode.stateType = 'compound';
    }
    // Ensure that we have unique state IDs
    const stateIds = stateNode.states.map(stateNode => stateNode.id);
    const uniqueStateIds = new Set(stateIds);
    for (let stateId of uniqueStateIds) {
        const k = stateIds.indexOf(stateId);
        const l = stateIds.lastIndexOf(stateId);
        if (k !== l) {
            const childStateNode = stateNode.states.find(n => n.id === stateId);
            throw new SemanticError(`Duplicate state\n  State ID: "${stateId}"`, {
                fileName: stateNode.scopeNode.wireStateFile,
                line: childStateNode.line,
                column: childStateNode.column
            });
        }
    }
    // Ensure that we have unique transitions
    const transitionEvents = stateNode.transitions.map(transitionNode => {
        return normalizeEventName(transitionNode.event);
    });
    const uniqueTransitionEvents = new Set(transitionEvents);
    for (let event of uniqueTransitionEvents) {
        const k = transitionEvents.indexOf(event);
        const l = transitionEvents.lastIndexOf(event);
        if (k !== l) {
            const transitionNode = stateNode.transitions.find(n => {
                return normalizeEventName(n.event) === event;
            });
            throw new SemanticError(`Duplicate transition\n  Transition Event: "${transitionNode.event}"`, {
                fileName: stateNode.scopeNode.wireStateFile,
                line: transitionNode.line,
                column: transitionNode.column
            });
        }
    }
    // Ensure that we have unique event protocols
    const protocolEvents = stateNode.eventProtocols.map(eventProtocolNode => {
        return eventProtocolNode.eventName.split(',').map(e => e.trim()).sort().join(',');
    });
    const uniqueProtocolEvents = new Set(protocolEvents);
    for (let event of uniqueProtocolEvents) {
        const k = protocolEvents.indexOf(event);
        const l = protocolEvents.lastIndexOf(event);
        if (k !== l) {
            const eventProtocolNode = stateNode.eventProtocols.find(n => {
                return n.eventName.split(',').map(e => e.trim()).sort().join(',') === event;
            });
            throw new SemanticError(`Duplicate event protocol\n  Event Protocol: "${eventProtocolNode.eventName}"`, {
                fileName: stateNode.scopeNode.wireStateFile,
                line: eventProtocolNode.line,
                column: eventProtocolNode.column
            });
        }
    }
    // Ensure transitions target a state that can be reached
    stateNode.transitions.forEach(transitionNode => {
        const childStateNode = ast_nodes_1.resolveState(transitionNode);
        if (!childStateNode) {
            throw new SemanticError(`Transition target cannot be resolved\n  Transition Target: ${transitionNode.target}`, {
                fileName: stateNode.scopeNode.wireStateFile,
                line: transitionNode.line,
                column: transitionNode.column
            });
        }
    });
    // Verify there is only one initial child state
    if (stateNode.states.filter(n => n.initial).length > 1) {
        const s = stateNode.states.filter(n => n.initial)[1];
        throw new SemanticError(`Only one child state can be marked as initial\n  State ID: "${stateNode.id}"`, {
            fileName: stateNode.scopeNode.wireStateFile,
            line: s.line,
            column: s.column
        });
    }
    // If no child state is set to be initial then, set first child state to be initial
    if (stateNode.states.length && !stateNode.states.some(n => n.initial)) {
        stateNode.states[0].initial = true;
    }
    // Analyze state nodes
    stateNode._states = await Promise.all(stateNode.states.map(stateNode => {
        return analyzeStateNode(stateNode, { cache });
    }));
    // Analyze @use directive
    stateNode.useDirective = await analyzeUseDirectiveNode(stateNode.useDirective, { cache });
    return stateNode;
}
/**
 * @param {UseDirectiveNode} useDirectiveNode
 * @param {Object} options
 * @param {Cache} options.cache
 * @return {Promise<UseDirectiveNode>}
 */
async function analyzeUseDirectiveNode(useDirectiveNode, { cache }) {
    if (useDirectiveNode) {
        const machineId = useDirectiveNode.machineId;
        const scopeNode = useDirectiveNode.parent.scopeNode;
        let machineNode = scopeNode.machines.find(machineNode => {
            return machineNode.id === machineId;
        });
        if (!machineNode) {
            const importedScopeNodes = await Promise.all(scopeNode.imports.map(importNode => cache.get(importNode.wireStateFile)));
            importedScopeNodes.some(scopeNode => {
                machineNode = scopeNode.machines.find(machineNode => {
                    return machineNode.id === machineId;
                });
                return !!machineNode;
            });
        }
        if (!machineNode) {
            throw new SemanticError(`Machine not found\n  Machine ID: ${useDirectiveNode.machineId}`, {
                fileName: useDirectiveNode.parent.scopeNode.wireStateFile,
                line: useDirectiveNode.line,
                column: useDirectiveNode.column
            });
        }
        return useDirectiveNode;
    }
    else {
        return null;
    }
}
/**
 * @param {Object} options
 * @param {Cache} options.cache
 * @param {string} [options.srcDir]
 */
exports.makeAnalyzer = ({ cache, srcDir = '' }) => {
    return {
        /** @param {ScopeNode} scopeNode */
        analyze(scopeNode) {
            return analyze(scopeNode, { cache, srcDir });
        }
    };
};
//# sourceMappingURL=analyzer.js.map