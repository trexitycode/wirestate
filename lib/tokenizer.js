"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var makeScanner = function (str) {
    var i = 0;
    var c = str[i];
    var line = 1;
    var column = 0;
    var reset = function () {
        i = 0;
        c = str[i];
        line = 1;
        column = 0;
    };
    var advance = function (step) {
        if (step === void 0) { step = 1; }
        for (var k = 0; k < step; k += 1) {
            var char = str[i + k];
            if (char === '\n') {
                line += 1;
                column = 0;
            }
            else {
                column += 1;
            }
        }
        i += step;
        c = str[i];
        return c;
    };
    var look = function (text) {
        return str.substr(i, text.length) === text;
    };
    return {
        get line() { return line; },
        get column() { return column; },
        get index() { return i; },
        get c() { return c; },
        get text() { return str; },
        reset: reset,
        advance: advance,
        look: look
    };
};
exports.makeTokenizer = function () {
    var commentToken = {
        canRead: function (scanner) { return scanner.c === '#'; },
        read: function (scanner) {
            var buffer = scanner.c;
            var c = scanner.advance();
            while (!scanner.look('\n') && !scanner.look('\r\n')) {
                buffer += c;
                c = scanner.advance();
            }
            return {
                type: 'comment',
                value: buffer.slice(1),
                raw: buffer
            };
        }
    };
    var newlineToken = {
        canRead: function (scanner) { return scanner.c === '\n' || scanner.look('\r\n'); },
        read: function (scanner) {
            var nl = scanner.c;
            if (scanner.look('\r\n')) {
                nl += scanner.advance();
            }
            scanner.advance();
            return {
                type: 'newline',
                value: nl,
                raw: nl
            };
        }
    };
    var whitespaceToken = {
        canRead: function (scanner) { return scanner.c === ' '; },
        read: function (scanner) {
            scanner.advance();
            return {
                type: 'whitespace',
                value: ' ',
                raw: ' '
            };
        }
    };
    var stringToken = {
        canRead: function (scanner) { return scanner.c === '"' || scanner.c === "'"; },
        read: function (scanner) {
            var buffer = '';
            var quote = scanner.c;
            var isTerminated = false;
            var c = scanner.advance();
            while (c) {
                if (c === '\n' || scanner.look('\r\n') || c === '\r') {
                    break;
                }
                else if (c === '\\') {
                    c = scanner.advance();
                    if (!c) {
                        isTerminated = false;
                        break;
                    }
                    switch (c) {
                        case 'b':
                            c = '\b';
                            break;
                        case 'f':
                            c = '\f';
                            break;
                        case 'n':
                            c = '\n';
                            break;
                        case 'r':
                            c = '\r';
                            break;
                        case 't':
                            c = '\t';
                            break;
                        case 'u':
                            if (scanner.index >= scanner.text.len) {
                                isTerminated = false;
                            }
                            c = parseInt(scanner.text.substr(scanner.index + 1, 4), 16);
                            if (!isFinite(c) || c < 0) {
                                isTerminated = false;
                            }
                            c = String.fromCharCode(c);
                            scanner.advance(4);
                            break;
                    }
                    buffer += c;
                    c = scanner.advance();
                }
                else if (c === quote) {
                    isTerminated = true;
                    c = scanner.advance();
                    break;
                }
                else {
                    buffer += c;
                    c = scanner.advance();
                }
            }
            if (!isTerminated) {
                throw new Error("LexicalError: Unterminated string \"" + buffer + "\"");
            }
            return {
                type: 'string',
                value: buffer,
                raw: "" + quote + buffer + quote
            };
        }
    };
    var operatorToken = {
        canRead: function (scanner) { return scanner.look('->'); },
        read: function (scanner) {
            scanner.advance(2);
            return {
                type: 'operator',
                value: '->',
                raw: '->'
            };
        }
    };
    var symbolToken = {
        symbols: '?&*!.',
        canRead: function (scanner) { return this.symbols.indexOf(scanner.c) >= 0; },
        read: function (scanner) {
            var c = scanner.c;
            scanner.advance();
            return {
                type: 'symbol',
                value: c,
                raw: c
            };
        }
    };
    var identifierToken = {
        canRead: function (scanner) {
            var c = scanner.c;
            return (c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                (c >= '0' && c <= '9') ||
                c === '_' ||
                c === '-';
        },
        read: function (scanner) {
            var id = '';
            var c = scanner.c;
            while ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === ' ' || c === '_' || c === '-') {
                if (c === ' ') {
                    var t = scanner.text.substr(scanner.index + 1, 2);
                    // Don't cosume the space if it is immediately followed by:
                    // '->' (the transition operator)
                    if (t === '->') {
                        break;
                    }
                    else {
                        id += c;
                        c = scanner.advance();
                    }
                }
                else {
                    id += c;
                    c = scanner.advance();
                }
            }
            return {
                type: 'identifier',
                value: id.trim(),
                raw: id
            };
        }
    };
    var directiveToken = {
        canRead: function (scanner) {
            var i = scanner.index;
            var text = scanner.text;
            var c = scanner.c;
            return c === '@' &&
                ((text[i + 1] >= 'a' && text[i + 1] <= 'z') ||
                    (text[i + 1] >= 'A' && text[i + 1] <= 'Z'));
        },
        read: function (scanner) {
            var buffer = '@';
            var c = scanner.advance();
            while ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
                buffer += c;
                c = scanner.advance();
            }
            return {
                type: 'directive',
                value: buffer,
                raw: buffer
            };
        }
    };
    var tokenReaders = [
        commentToken,
        newlineToken,
        whitespaceToken,
        stringToken,
        directiveToken,
        operatorToken,
        symbolToken,
        identifierToken
    ];
    var tokenReaderCount = tokenReaders.length;
    var tokenize = function (text) {
        var scanner = makeScanner(text);
        var tokens = [];
        var line = scanner.line;
        var column = scanner.column;
        var noMatch = true;
        var token = null;
        while (scanner.c) {
            line = scanner.line;
            column = scanner.column;
            noMatch = true;
            for (var t = 0; t < tokenReaderCount && noMatch; t += 1) {
                if (tokenReaders[t].canRead(scanner)) {
                    token = tokenReaders[t].read(scanner);
                    token.line = line;
                    token.column = column;
                    tokens.push(token);
                    noMatch = false;
                }
            }
            if (noMatch) {
                throw new Error("LexicalError: Unknown charcter: " + scanner.c + " [L:" + line + " C:" + column + "]");
            }
        }
        return tokens;
    };
    return { tokenize: tokenize };
};
