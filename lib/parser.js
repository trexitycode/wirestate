"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ast_nodes_1 = require("./ast-nodes");
var makeScanner = function (tokens) {
    // Remove the comments
    tokens = tokens.filter(function (t) { return t.type !== 'comment'; });
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
            return Object.assign(new Error("SyntaxError" + (message ? ': ' + message : '') + " near [L:" + token.line + " C:" + token.column + "]"));
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
            if (token_2.type === 'newline')
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
            _loop_3();
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
            throw syntaxError();
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
var parseImplicitStateNode = function (scanner, name) {
    var node = new ast_nodes_1.StateNode();
    Object.assign(node, {
        name: name,
        stateType: 'atomic',
        indent: 0,
        line: 1,
        column: 0
    });
    var indent = 0;
    while (scanner.token) {
        if (scanner.look('identifier') || scanner.look([{ value: '*' }])) {
            // Is indentation too much?
            if (indent > 0) {
                throw scanner.syntaxError("Expected indentation 0 but got " + indent);
            }
            // event ->
            // event. ->
            // event.* ->
            // * ->
            // *. ->
            // *.event ->
            if (scanner.canConsumeTo({ value: '->' })) {
                indent = 0;
                node.transitions.push(Object.assign(parseTransitionNode(scanner), { parent: node }));
            }
            else if (scanner.look('identifier')) { // another state
                // child state
                node.states.push(Object.assign(parseStateNode(scanner, { indentLevel: 0 }), { parent: node }));
                indent = 0;
            }
            else {
                throw scanner.syntaxError();
            }
            // Is the next token directive, transition or child state?
        }
        else if (scanner.look('directive')) { // a directive
            // Is indentation too much?
            if (indent > 0) {
                throw scanner.syntaxError("Expected indentation 0 but got " + indent);
            }
            indent = 0;
            // @ts-ignore
            node.states.push(Object.assign(parseDirectiveNode(scanner), { parent: node }));
        }
        else if (scanner.look('newline')) {
            indent = 0;
            scanner.advance();
        }
        else if (scanner.look('whitespace')) {
            indent += 1;
            scanner.advance();
        }
        else {
            throw scanner.syntaxError();
        }
    }
    return node;
};
var parseStateNode = function (scanner, _a) {
    var indentLevel = _a.indentLevel;
    var nameToken = scanner.consume('identifier');
    var node = new ast_nodes_1.StateNode();
    Object.assign(node, {
        name: nameToken.value,
        stateType: 'atomic',
        indent: indentLevel,
        line: nameToken.line,
        column: nameToken.column
    });
    var indent = 0;
    var symbols = [];
    while (scanner.look('symbol')) {
        symbols.push(scanner.consume('symbol'));
    }
    // (all) *?&!
    // (valid co-symbols) &!*
    // (valid co-symbols) ?*
    if (symbols.find(function (s) { return s.value === '?'; })) {
        if (symbols.find(function (s) { return ['!', '&'].indexOf(s.value) >= 0; })) {
            throw scanner.syntaxError('Unsupported state symbol');
        }
    }
    symbols.forEach(function (s) {
        if (s.value === '*')
            node.initial = true;
        if (s.value === '!') {
            node.final = true;
            node.name += '!';
        }
        if (s.value === '&')
            node.parallel = true;
        if (s.value === '?') {
            node.stateType = 'transient';
            node.name += '?';
        }
    });
    while (scanner.token) {
        if (scanner.look('identifier') || scanner.look([{ value: '*' }])) {
            // Is indentation too much?
            if (indent > indentLevel + 2) {
                throw scanner.syntaxError("Expected indentation " + (indentLevel + 2) + " but got " + indent);
            }
            // event ->
            // event. ->
            // event.* ->
            // * ->
            // *. ->
            // *.event ->
            if (scanner.canConsumeTo({ value: '->' })) {
                if (indent < indentLevel) {
                    throw scanner.syntaxError('Unexpected dedentation');
                }
                indent = 0;
                node.transitions.push(Object.assign(parseTransitionNode(scanner), { parent: node }));
            }
            else if (scanner.look('identifier')) { // another state
                if (indent <= indentLevel) { // ancestor state
                    // Backtrack so the ancestor parent will re-read the indentation
                    scanner.advance(-indent);
                    indent = 0;
                    break;
                }
                else { // child state
                    node.states.push(Object.assign(parseStateNode(scanner, { indentLevel: indent }), { parent: node }));
                    indent = 0;
                }
            }
            else {
                throw scanner.syntaxError();
            }
            // Is the next token directive, transition or child state?
        }
        else if (scanner.look('directive')) { // a directive
            // Is indentation too much?
            if (indent > indentLevel + 2) {
                throw scanner.syntaxError("Expected indentation " + (indentLevel + 2) + " but got " + indent);
            }
            if (indent < indentLevel) {
                throw scanner.syntaxError('Unexpected dedentation');
            }
            indent = 0;
            // @ts-ignore
            node.states.push(Object.assign(parseDirectiveNode(scanner), { parent: node }));
        }
        else if (scanner.look('newline')) {
            indent = 0;
            scanner.advance();
        }
        else if (scanner.look('whitespace')) {
            indent += 1;
            scanner.advance();
        }
        else {
            throw scanner.syntaxError();
        }
    }
    return node;
};
var parseTransitionNode = function (scanner) {
    var eventDescriptorTokens = scanner.consumeTo({ value: '->' });
    var eventDescriptor = eventDescriptorTokens.map(function (t) { return t.value; }).join('').trim();
    if (/^(\*|([a-zA-Z0-9_-][a-zA-Z0-9_\- ?]*))(\.(\*|([a-zA-Z0-9_-][a-zA-Z0-9_\- ?]*)*))*$/.test(eventDescriptor) === false) {
        throw scanner.syntaxError("Invalid event descriptor: " + eventDescriptor);
    }
    scanner.consume({ value: '->' });
    while (scanner.look('whitespace')) {
        scanner.consume('whitespace');
    }
    var target = scanner.consume('identifier').value;
    if (scanner.look('symbol')) {
        var symbolToken = scanner.consume('symbol');
        if (symbolToken.value === '?' || symbolToken.value === '!') {
            target += symbolToken.value;
        }
        else {
            throw scanner.syntaxError();
        }
    }
    var node = new ast_nodes_1.TransitionNode();
    Object.assign(node, {
        event: eventDescriptor,
        target: target,
        line: eventDescriptorTokens[0].line,
        column: eventDescriptorTokens[0].column
    });
    return node;
};
var parseDirectiveNode = function (scanner) {
    var typeToken = scanner.consume('directive');
    while (scanner.look('whitespace')) {
        scanner.consume('whitespace');
    }
    var node = null;
    if (typeToken.value === '@include') {
        node = new ast_nodes_1.IncludeDirectiveNode();
        Object.assign(node, {
            fileName: scanner.consume('string').value,
            line: typeToken.line,
            column: typeToken.column
        });
    }
    else {
        node = new ast_nodes_1.DirectiveNode();
        Object.assign({
            directiveType: typeToken.value,
            line: typeToken.line,
            column: typeToken.column
        });
    }
    return node;
};
exports.makeParser = function () {
    var parse = function (tokens, name) {
        if (name === void 0) { name = 'StateChart'; }
        var scanner = makeScanner(tokens);
        return parseImplicitStateNode(scanner, name);
    };
    return { parse: parse };
};
