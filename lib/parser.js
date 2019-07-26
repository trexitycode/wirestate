"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Path = require("path");
const ast_nodes_1 = require("./ast-nodes");
const errors_1 = require("./errors");
const makeScanner = (tokens, { wireStateFile = '' } = {}) => {
    // Remove the comments and whitespace
    tokens = tokens.filter(t => t.type !== 'comment' && t.type !== 'whitespace');
    let i = 0;
    let token = tokens[i];
    const reset = () => {
        i = 0;
        token = tokens[i];
    };
    const syntaxError = (message = null) => {
        if (token) {
            message = message || `Unexpected token ${token.type}:"${token.value}"`;
            throw new errors_1.SyntaxError(`Syntax error near line ${token.line}.\n${message}`, { line: token.line, column: token.column, fileName: wireStateFile });
        }
        else {
            throw new errors_1.SyntaxError('Unexpected end of input');
        }
    };
    const advance = (step = 1) => {
        i += step;
        return (token = tokens[i]);
    };
    const look = (patterns) => {
        patterns = [].concat(patterns);
        const patternCount = patterns.length;
        let patternDoesMatch = true;
        let t = 0;
        for (let p = 0; p < patternCount && patternDoesMatch; p += 1) {
            const pattern = patterns[p];
            const token = tokens[i + t];
            if (!token) {
                patternDoesMatch = false;
                break;
            }
            if (typeof pattern === 'string') {
                // Wildcard token type (0 or more)
                if (pattern.endsWith('*')) {
                    if (token.type === pattern.substr(0, pattern.length - 1)) {
                        p -= 1;
                        t += 1;
                    }
                    // Zero or one token type (0 or 1)
                }
                else if (pattern.endsWith('?')) {
                    if (token.type === pattern.substr(0, pattern.length - 1)) {
                        t += 1;
                    }
                }
                else {
                    t += 1;
                    patternDoesMatch = token.type === pattern;
                }
            }
            else if (Object(pattern) === pattern) {
                t += 1;
                patternDoesMatch = Object
                    .keys(pattern)
                    .every(key => token[key] === pattern[key]);
            }
            else {
                throw new Error('Expected a string or token mask as a pattern');
            }
        }
        return patternDoesMatch;
    };
    const canConsumeTo = (typeOrObj) => {
        let canConsumeTo = false;
        for (let t = 0; t + i < tokens.length && !canConsumeTo; t += 1) {
            const token = tokens[i + t];
            if (token.type === 'indent')
                break;
            if (typeof typeOrObj === 'string') {
                canConsumeTo = token.type === typeOrObj;
            }
            else {
                canConsumeTo = Object
                    .keys(typeOrObj)
                    .every(key => token[key] === typeOrObj[key]);
            }
        }
        return canConsumeTo;
    };
    const consumeTo = (typeOrObj) => {
        let toks = [];
        let done = false;
        for (; i < tokens.length && !done; i += 1) {
            const token = tokens[i];
            if (token.type === 'indent')
                break;
            if (typeof typeOrObj === 'string') {
                done = token.type === typeOrObj;
                if (!done)
                    toks.push(token);
                if (done)
                    i -= 1;
            }
            else {
                done = Object
                    .keys(typeOrObj)
                    .every(key => token[key] === typeOrObj[key]);
                if (!done)
                    toks.push(token);
                if (done)
                    i -= 1;
            }
        }
        return toks;
    };
    const consume = (pattern) => {
        if (look(pattern)) {
            const t = token;
            advance();
            return t;
        }
        else {
            const message = pattern.type || typeof pattern === 'string'
                ? `Expected ${pattern.type || pattern} token but got ${token ? token.type : 'END'}`
                : `Expected "${pattern.value}" but got ${token ? '"' + token.value + '"' : 'END'}`;
            throw syntaxError(message);
        }
    };
    return {
        get token() { return token; },
        get index() { return i; },
        advance,
        look,
        reset,
        consume,
        canConsumeTo,
        consumeTo,
        syntaxError
    };
};
const parseScopeNode = (scanner, { wireStateFile = '' } = {}) => {
    const scopeNode = new ast_nodes_1.ScopeNode(wireStateFile);
    let importNodesValid = true;
    let indent = 0;
    while (scanner.token) {
        if (scanner.look({ type: 'indent' })) {
            indent = scanner.consume({ type: 'indent' }).value.length;
        }
        else if (importNodesValid && scanner.look({ value: '@import' })) {
            if (indent !== 0) {
                throw scanner.syntaxError(`Expected indentation 0 but got ${indent}`);
            }
            const importNode = parseImportNode(scanner);
            importNode.parent = scopeNode;
            scopeNode.imports.push(importNode);
        }
        else if (scanner.look({ value: '@machine' })) {
            if (indent !== 0) {
                throw scanner.syntaxError(`Expected indentation 0 but got ${indent}`);
            }
            importNodesValid = false;
            const machineNode = parseMachineNode(scanner);
            machineNode.parent = scopeNode;
            scopeNode.machines.push(machineNode);
        }
        else {
            throw scanner.syntaxError();
        }
    }
    return scopeNode;
};
const parseImportNode = (scanner) => {
    // @import { a, b, c } from 'file'
    const firstToken = scanner.consume({ value: '@import' });
    scanner.consume({ value: '{' });
    let ids = [];
    while (scanner.look({ type: 'identifier' })) {
        if (scanner.look({ value: ',' })) {
            scanner.consume({ value: ',' });
        }
        else {
            ids.push(scanner.consume({ type: 'identifier' }).value);
        }
    }
    if (ids.length === 0) {
        throw scanner.syntaxError();
    }
    scanner.consume({ value: '}' });
    scanner.consume({ value: 'from' });
    const wireStateFile = scanner.consume({ type: 'string' }).value;
    let importNode = new ast_nodes_1.ImportNode(ids, wireStateFile);
    importNode.line = firstToken.line;
    importNode.column = firstToken.column;
    return importNode;
};
const parseMachineNode = (scanner) => {
    const firstToken = scanner.consume({ value: '@machine' });
    const machineId = scanner.consume({ type: 'identifier' }).value;
    const machineNode = new ast_nodes_1.MachineNode(machineId);
    let indent = 0;
    machineNode.line = firstToken.line;
    machineNode.column = firstToken.column;
    while (scanner.token) {
        if (scanner.look({ type: 'indent' })) {
            if (scanner.look([{ type: 'indent' }, { value: '@machine' }])) {
                break;
            }
            else {
                indent = scanner.consume({ type: 'indent' }).value.length;
            }
        }
        else if (scanner.look({ value: '@machine' })) {
            throw scanner.syntaxError();
        }
        else if (scanner.look('identifier') || scanner.look({ value: '*' })) {
            // Is indentation too much?
            if (indent > 2) {
                throw scanner.syntaxError(`Expected indentation 2 but got ${indent}`);
            }
            if (indent < 2) {
                throw scanner.syntaxError('Unexpected dedentation');
            }
            // event ->
            // event.something else ->
            // * ->
            if (scanner.canConsumeTo({ value: '->' })) {
                machineNode.transitions.push(Object.assign(parseTransitionNode(scanner), { parent: machineNode }));
            }
            else if (scanner.look('identifier')) { // another state
                // child state
                machineNode.states.push(Object.assign(parseStateNode(scanner, { indentLevel: indent }), { parent: machineNode }));
            }
            else {
                throw scanner.syntaxError();
            }
        }
        else {
            throw scanner.syntaxError();
        }
    }
    return machineNode;
};
const parseTransitionNode = (scanner) => {
    let eventDescriptor = '';
    let firstToken = null;
    if (scanner.look({ value: '*' })) {
        firstToken = scanner.consume({ value: '*' });
        eventDescriptor = firstToken.value;
    }
    else {
        firstToken = scanner.consume({ type: 'identifier' });
        eventDescriptor += firstToken.value;
        while (scanner.look({ value: '.' })) {
            eventDescriptor += scanner.consume({ value: '.' }).value;
            eventDescriptor += scanner.consume({ type: 'identifier' }).value;
        }
        if (scanner.look({ value: '?' })) {
            eventDescriptor += scanner.consume({ value: '?' }).value;
        }
    }
    scanner.consume({ value: '->' });
    // Event target can be a comma separated list of state names
    let target = '';
    while (true) {
        target += scanner.consume('identifier').value;
        if (scanner.look({ value: '?' }) || scanner.look({ value: '!' })) {
            target += scanner.consume({ type: 'operator' }).value;
        }
        if (scanner.look({ value: ',' })) {
            target += scanner.consume({ value: ',' }).value;
        }
        else {
            break;
        }
    }
    let node = new ast_nodes_1.TransitionNode(eventDescriptor, target);
    Object.assign(node, {
        line: firstToken.line,
        column: firstToken.column
    });
    return node;
};
const parseStateNode = (scanner, { indentLevel }) => {
    const idToken = scanner.consume('identifier');
    let node = new ast_nodes_1.StateNode(idToken.value, indentLevel);
    Object.assign(node, {
        line: idToken.line,
        column: idToken.column
    });
    let operators = [];
    while (scanner.look('operator')) {
        operators.push(scanner.consume('operator'));
    }
    // (all) *?&!
    // (valid co-operators) &!*
    // (valid co-operators) ?*
    if (operators.find(s => s.value === '?')) {
        if (operators.find(s => ['!', '&'].indexOf(s.value) >= 0)) {
            throw scanner.syntaxError('Unsupported state operator');
        }
    }
    operators.forEach(s => {
        if (s.value === '*')
            node.initial = true;
        if (s.value === '!') {
            node.final = true;
            node.id += '!';
        }
        if (s.value === '&')
            node.parallel = true;
        if (s.value === '?') {
            node.stateType = 'transient';
            node.id += '?';
        }
    });
    while (scanner.token) {
        const indent = scanner.consume({ type: 'indent' }).value.length;
        if (scanner.look({ value: '@machine' })) {
            scanner.advance(-1);
            break;
        }
        else if (scanner.look('identifier') || scanner.look({ value: '*' })) {
            // Is indentation too much?
            if (indent > indentLevel + 2) {
                throw scanner.syntaxError(`Expected indentation ${indentLevel + 2} but got ${indent}`);
            }
            // event ->
            // event.something else ->
            // * ->
            if (scanner.canConsumeTo({ value: '->' })) {
                if (indent < indentLevel) {
                    throw scanner.syntaxError('Unexpected dedentation');
                }
                node.transitions.push(Object.assign(parseTransitionNode(scanner), { parent: node }));
            }
            else if (scanner.look('identifier')) { // another state
                if (indent <= indentLevel) { // ancestor state
                    // Backtrack so the ancestor parent will re-read the indentation
                    scanner.advance(-1);
                    break;
                }
                else { // child state
                    if (node.stateType === 'transient') {
                        throw scanner.syntaxError('Transient states cannot have child states');
                    }
                    node.states.push(Object.assign(parseStateNode(scanner, { indentLevel: indent }), { parent: node }));
                }
            }
            else {
                throw scanner.syntaxError();
            }
        }
        else if (scanner.look({ value: '@use' })) {
            // Is indentation too much?
            if (indent > indentLevel + 2) {
                throw scanner.syntaxError(`Expected indentation ${indentLevel + 2} but got ${indent}`);
            }
            if (indent < indentLevel) {
                throw scanner.syntaxError('Unexpected dedentation');
            }
            if (node.useDirective) {
                // Advance so that when we throw the proper column is reported
                scanner.consume({ value: '@use' });
                throw scanner.syntaxError('Multiple @use encountered');
            }
            node.useDirective = Object.assign(parseUseDirectiveNode(scanner), { parent: node });
        }
    }
    return node;
};
const parseUseDirectiveNode = (scanner) => {
    const typeToken = scanner.consume({ value: '@use' });
    const machineId = scanner.look('string')
        ? scanner.consume('string').value
        : scanner.consume('identifier').value;
    let alias = null;
    if (scanner.look({ value: 'as' })) {
        scanner.consume({ value: 'as' });
        alias = scanner.look('string')
            ? scanner.consume('string').value
            : scanner.consume('identifier').value;
    }
    const node = new ast_nodes_1.UseDirectiveNode(machineId, alias);
    Object.assign(node, {
        line: typeToken.line,
        column: typeToken.column
    });
    return node;
};
exports.makeParser = ({ wireStateFile = '' } = {}) => {
    if (Path.isAbsolute(wireStateFile)) {
        throw new Error('WireStateFile must be relative');
    }
    if (wireStateFile.startsWith('.')) {
        throw new Error('WireStateFile cannot be prefixed with ./ or ../');
    }
    const parse = (tokens) => {
        const scanner = makeScanner(tokens, { wireStateFile });
        return parseScopeNode(scanner, { wireStateFile });
    };
    return { parse };
};
//# sourceMappingURL=parser.js.map