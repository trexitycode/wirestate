"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_nodes_1 = require("./ast-nodes");
var makeScanner = function (tokens) {
    // Remove the comments and whitespace
    tokens = tokens.filter(function (t) { return t.type !== 'comment' && t.type !== 'whitespace'; });
    var i = 0;
    var token = tokens[i];
    var reset = function () {
        i = 0;
        token = tokens[i];
    };
    var syntaxError = function (message) {
        if (message === void 0) { message = null; }
        if (token) {
            message = message || "Unexpected token " + token.type + ":\"" + token.value + "\"";
            return Object.assign(new Error("SyntaxError" + (message ? ': ' + message : '') + " near [L:" + token.line + " C:" + token.column + "]"), { line: token.line, column: token.column });
        }
        else {
            return new Error("SyntaxError: Unexpected end of input");
        }
    };
    var advance = function (step) {
        if (step === void 0) { step = 1; }
        i += step;
        return (token = tokens[i]);
    };
    var look = function (patterns) {
        patterns = [].concat(patterns);
        var patternCount = patterns.length;
        var patternDoesMatch = true;
        var t = 0;
        var _loop_1 = function (p) {
            var pattern = patterns[p];
            var token_1 = tokens[i + t];
            if (!token_1) {
                patternDoesMatch = false;
                return out_p_1 = p, "break";
            }
            if (typeof pattern === 'string') {
                // Wildcard token type (0 or more)
                if (pattern.endsWith('*')) {
                    if (token_1.type === pattern.substr(0, pattern.length - 1)) {
                        p -= 1;
                        t += 1;
                    }
                    patternDoesMatch = true;
                    // Zero or one token type (0 or 1)
                }
                else if (pattern.endsWith('?')) {
                    if (token_1.type === pattern.substr(0, pattern.length - 1)) {
                        t += 1;
                    }
                    patternDoesMatch = true;
                }
                else {
                    t += 1;
                    patternDoesMatch = token_1.type === pattern;
                }
            }
            else if (Object(pattern) === pattern) {
                t += 1;
                patternDoesMatch = Object
                    .keys(pattern)
                    .every(function (key) { return token_1[key] === pattern[key]; });
            }
            else {
                throw new Error('Expected a string or token mask as a pattern');
            }
            out_p_1 = p;
        };
        var out_p_1;
        for (var p = 0; p < patternCount && patternDoesMatch; p += 1) {
            var state_1 = _loop_1(p);
            p = out_p_1;
            if (state_1 === "break")
                break;
        }
        return patternDoesMatch;
    };
    var canConsumeTo = function (typeOrObj) {
        var canConsumeTo = false;
        var _loop_2 = function (t) {
            var token_2 = tokens[i + t];
            if (token_2.type === 'indent')
                return "break";
            if (typeof typeOrObj === 'string') {
                canConsumeTo = token_2.type === typeOrObj;
            }
            else {
                canConsumeTo = Object
                    .keys(typeOrObj)
                    .every(function (key) { return token_2[key] === typeOrObj[key]; });
            }
        };
        for (var t = 0; t + i < tokens.length && !canConsumeTo; t += 1) {
            var state_2 = _loop_2(t);
            if (state_2 === "break")
                break;
        }
        return canConsumeTo;
    };
    var consumeTo = function (typeOrObj) {
        var toks = [];
        var done = false;
        var _loop_3 = function () {
            var token_3 = tokens[i];
            if (token_3.type === 'indent')
                return "break";
            if (typeof typeOrObj === 'string') {
                done = token_3.type === typeOrObj;
                if (!done)
                    toks.push(token_3);
                if (done)
                    i -= 1;
            }
            else {
                done = Object
                    .keys(typeOrObj)
                    .every(function (key) { return token_3[key] === typeOrObj[key]; });
                if (!done)
                    toks.push(token_3);
                if (done)
                    i -= 1;
            }
        };
        for (; i < tokens.length && !done; i += 1) {
            var state_3 = _loop_3();
            if (state_3 === "break")
                break;
        }
        return toks;
    };
    var consume = function (pattern) {
        if (look(pattern)) {
            var t = token;
            advance();
            return t;
        }
        else {
            var message = pattern.type || typeof pattern === 'string'
                ? "Expected " + (pattern.type || pattern) + " token but got " + (token ? token.type : 'END')
                : "Expected \"" + pattern.value + "\" but got " + (token ? '"' + token.value + '"' : 'END');
            throw syntaxError(message);
        }
    };
    return {
        get token() { return token; },
        get index() { return i; },
        advance: advance,
        look: look,
        reset: reset,
        consume: consume,
        canConsumeTo: canConsumeTo,
        consumeTo: consumeTo,
        syntaxError: syntaxError
    };
};
var parseScopeNode = function (scanner) {
    var scopeNode = new ast_nodes_1.ScopeNode();
    var importNodesValid = true;
    var indent = 0;
    while (scanner.token) {
        if (scanner.look({ type: 'indent' })) {
            indent = scanner.consume({ type: 'indent' }).value.length;
        }
        else if (importNodesValid && scanner.look({ value: '@import' })) {
            if (indent !== 0) {
                throw scanner.syntaxError("Expected indentation 0 but got " + indent);
            }
            var importNode = parseImportNode(scanner);
            importNode.parent = scopeNode;
            scopeNode.imports.push(importNode);
        }
        else if (scanner.look({ value: '@machine' })) {
            if (indent !== 0) {
                throw scanner.syntaxError("Expected indentation 0 but got " + indent);
            }
            importNodesValid = false;
            var machineNode = parseMarchineNode(scanner);
            machineNode.parent = scopeNode;
            scopeNode.machines.push(machineNode);
        }
        else {
            throw scanner.syntaxError();
        }
    }
    return scopeNode;
};
var parseImportNode = function (scanner) {
    // @import { a, b, c } from 'file'
    var firstToken = scanner.consume({ value: '@import' });
    scanner.consume({ value: '{' });
    var ids = [];
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
    var file = scanner.consume({ type: 'string' }).value;
    var importNode = new ast_nodes_1.ImportNode(ids, file);
    importNode.line = firstToken.line;
    importNode.column = firstToken.column;
    return importNode;
};
var parseMarchineNode = function (scanner) {
    var firstToken = scanner.consume({ value: '@machine' });
    var machineId = scanner.consume({ type: 'identifier' }).value;
    var machineNode = new ast_nodes_1.MachineNode(machineId);
    var indent = 0;
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
                throw scanner.syntaxError("Expected indentation 2 but got " + indent);
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
        else if (scanner.look({ value: '@use' })) {
            // Is indentation too much?
            if (indent > 2) {
                throw scanner.syntaxError("Expected indentation 2 but got " + indent);
            }
            if (indent < 2) {
                throw scanner.syntaxError('Unexpected dedentation');
            }
            // @ts-ignore
            machineNode.states.push(Object.assign(parseUseDirectiveNode(scanner), { parent: machineNode }));
        }
        else if (scanner.look({ value: '<-' })) {
            // Is indentation too much?
            if (indent > 2) {
                throw scanner.syntaxError("Expected indentation 2 but got " + indent);
            }
            if (indent < 2) {
                throw scanner.syntaxError('Unexpected dedentation');
            }
            var firstToken_1 = scanner.consume({ value: '<-' });
            var event_1 = scanner.consume({ type: 'identifier' }).value;
            while (scanner.look({ value: '.' })) {
                event_1 += scanner.consume({ value: '.' }).value;
                event_1 += scanner.consume({ type: 'identifier' }).value;
            }
            if (scanner.look({ value: '?' })) {
                event_1 += scanner.consume({ value: '?' }).value;
            }
            var ep = new ast_nodes_1.EventProtocolNode(event_1);
            ep.line = firstToken_1.line;
            ep.column = firstToken_1.column;
            ep.parent = machineNode;
            machineNode.eventProtocols.push(ep);
        }
    }
    return machineNode;
};
var parseTransitionNode = function (scanner) {
    var eventDescriptor = '';
    var firstToken = null;
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
    var target = scanner.consume('identifier').value;
    if (scanner.look({ type: 'operator' })) {
        var t = scanner.consume({ type: 'operator' });
        if (t.value === '?' || t.value === '!') {
            target += t.value;
        }
        else {
            throw scanner.syntaxError();
        }
    }
    var node = new ast_nodes_1.TransitionNode(eventDescriptor, target);
    Object.assign(node, {
        line: firstToken.line,
        column: firstToken.column
    });
    return node;
};
var parseStateNode = function (scanner, _a) {
    var indentLevel = _a.indentLevel;
    var idToken = scanner.consume('identifier');
    var node = new ast_nodes_1.StateNode(idToken.value, indentLevel);
    Object.assign(node, {
        line: idToken.line,
        column: idToken.column
    });
    var operators = [];
    while (scanner.look('operator')) {
        operators.push(scanner.consume('operator'));
    }
    // (all) *?&!
    // (valid co-operators) &!*
    // (valid co-operators) ?*
    if (operators.find(function (s) { return s.value === '?'; })) {
        if (operators.find(function (s) { return ['!', '&'].indexOf(s.value) >= 0; })) {
            throw scanner.syntaxError('Unsupported state operator');
        }
    }
    operators.forEach(function (s) {
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
        var indent = scanner.consume({ type: 'indent' }).value.length;
        if (scanner.look({ type: '@machine' })) {
            scanner.advance(-1);
            break;
        }
        else if (scanner.look('identifier') || scanner.look({ value: '*' })) {
            // Is indentation too much?
            if (indent > indentLevel + 2) {
                throw scanner.syntaxError("Expected indentation " + (indentLevel + 2) + " but got " + indent);
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
                throw scanner.syntaxError("Expected indentation " + (indentLevel + 2) + " but got " + indent);
            }
            if (indent < indentLevel) {
                throw scanner.syntaxError('Unexpected dedentation');
            }
            // @ts-ignore
            node.states.push(Object.assign(parseUseDirectiveNode(scanner), { parent: node }));
        }
        else if (scanner.look({ value: '<-' })) {
            // Is indentation too much?
            if (indent > indentLevel + 2) {
                throw scanner.syntaxError("Expected indentation " + (indentLevel + 2) + " but got " + indent);
            }
            if (indent < indentLevel) {
                throw scanner.syntaxError('Unexpected dedentation');
            }
            var firstToken = scanner.consume({ value: '<-' });
            var event_2 = scanner.consume({ type: 'identifier' }).value;
            while (scanner.look({ value: '.' })) {
                event_2 += scanner.consume({ value: '.' }).value;
                event_2 += scanner.consume({ type: 'identifier' }).value;
            }
            if (scanner.look({ value: '?' })) {
                event_2 += scanner.consume({ value: '?' }).value;
            }
            var ep = new ast_nodes_1.EventProtocolNode(event_2);
            ep.line = firstToken.line;
            ep.column = firstToken.column;
            ep.parent = node;
            node.eventProtocols.push(ep);
        }
    }
    return node;
};
var parseUseDirectiveNode = function (scanner) {
    var typeToken = scanner.consume({ value: '@use' });
    var node = new ast_nodes_1.UseDirectiveNode(scanner.consume('identifier').value);
    Object.assign(node, {
        line: typeToken.line,
        column: typeToken.column
    });
    return node;
};
exports.makeParser = function () {
    var parse = function (tokens) {
        var scanner = makeScanner(tokens);
        return parseScopeNode(scanner);
    };
    return { parse: parse };
};
//# sourceMappingURL=parser.js.map