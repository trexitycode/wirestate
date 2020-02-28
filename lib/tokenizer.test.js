"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Assert = require("assert");
const tokenizer_1 = require("./tokenizer");
describe('a tokenzier', function () {
    it('should tokenize keywords only followed by whitespace', function () {
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'SomeFile.wirestate' });
        const source = 'as asOne oneas';
        const tokens = tokenizer.tokenize(source);
        Assert.deepStrictEqual(tokens, [
            { type: 'keyword', value: 'as', raw: 'as', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 2, line: 1 },
            { type: 'identifier', value: 'asOne oneas', raw: 'asOne oneas', column: 3, line: 1 }
        ]);
    });
    it('should tokenize keywords at end of source text', function () {
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'SomeFile.wirestate' });
        const source = '*as';
        const tokens = tokenizer.tokenize(source);
        Assert.deepStrictEqual(tokens, [
            { type: 'operator', value: '*', raw: '*', column: 0, line: 1 },
            { type: 'keyword', value: 'as', raw: 'as', column: 1, line: 1 }
        ]);
    });
    it('should not include keywords within identifiers', function () {
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'SomeFile.wirestate' });
        const source = 'My as State Name as';
        const tokens = tokenizer.tokenize(source);
        Assert.deepStrictEqual(tokens, [
            { type: 'identifier', value: 'My', raw: 'My', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 2, line: 1 },
            { type: 'keyword', value: 'as', raw: 'as', column: 3, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 5, line: 1 },
            { type: 'identifier', value: 'State Name', raw: 'State Name', column: 6, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 16, line: 1 },
            { type: 'keyword', value: 'as', raw: 'as', column: 17, line: 1 }
        ]);
    });
    it('should exclude trailing keywords from identifiers', function () {
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'SomeFile.wirestate' });
        const source = 'My State as';
        const tokens = tokenizer.tokenize(source);
        Assert.deepStrictEqual(tokens, [
            { type: 'identifier', value: 'My State', raw: 'My State', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 8, line: 1 },
            { type: 'keyword', value: 'as', raw: 'as', column: 9, line: 1 }
        ]);
    });
    it('should tokenize source text', function () {
        const sourceText = `@machine App
  Home
    about -> About?, Away
  About?
  Away`;
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'App.wirestate' });
        const tokens = tokenizer.tokenize(sourceText);
        Assert.deepStrictEqual(tokens, [
            { type: 'directive', value: '@machine', raw: '@machine', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 8, line: 1 },
            { type: 'identifier', value: 'App', raw: 'App', column: 9, line: 1 },
            { type: 'indent', value: '  ', raw: '  ', column: 12, line: 1 },
            { type: 'identifier', value: 'Home', raw: 'Home', column: 2, line: 2 },
            { type: 'indent', value: '    ', raw: '    ', column: 6, line: 2 },
            { type: 'identifier', value: 'about', raw: 'about', column: 4, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 9, line: 3 },
            { type: 'symbol', value: '->', raw: '->', column: 10, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 12, line: 3 },
            { type: 'identifier', value: 'About', raw: 'About', column: 13, line: 3 },
            { type: 'operator', value: '?', raw: '?', column: 18, line: 3 },
            { type: 'operator', value: ',', raw: ',', column: 19, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 20, line: 3 },
            { type: 'identifier', value: 'Away', raw: 'Away', column: 21, line: 3 },
            { type: 'indent', value: '  ', raw: '  ', column: 25, line: 3 },
            { type: 'identifier', value: 'About', raw: 'About', column: 2, line: 4 },
            { type: 'operator', value: '?', raw: '?', column: 7, line: 4 },
            { type: 'indent', value: '  ', raw: '  ', column: 8, line: 4 },
            { type: 'identifier', value: 'Away', raw: 'Away', column: 2, line: 5 }
        ]);
    });
    it('should tokenize forbidden transitions', function () {
        const sourceText = `@machine App
  Home
    about -> |
    away -> Away
  About?
  Away`;
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'App.wirestate' });
        const tokens = tokenizer.tokenize(sourceText);
        Assert.deepStrictEqual(tokens, [
            { type: 'directive', value: '@machine', raw: '@machine', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 8, line: 1 },
            { type: 'identifier', value: 'App', raw: 'App', column: 9, line: 1 },
            { type: 'indent', value: '  ', raw: '  ', column: 12, line: 1 },
            { type: 'identifier', value: 'Home', raw: 'Home', column: 2, line: 2 },
            { type: 'indent', value: '    ', raw: '    ', column: 6, line: 2 },
            { type: 'identifier', value: 'about', raw: 'about', column: 4, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 9, line: 3 },
            { type: 'symbol', value: '->', raw: '->', column: 10, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 12, line: 3 },
            { type: 'symbol', value: '|', raw: '|', column: 13, line: 3 },
            { type: 'indent', value: '    ', raw: '    ', column: 14, line: 3 },
            { type: 'identifier', value: 'away', raw: 'away', column: 4, line: 4 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 8, line: 4 },
            { type: 'symbol', value: '->', raw: '->', column: 9, line: 4 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 11, line: 4 },
            { type: 'identifier', value: 'Away', raw: 'Away', column: 12, line: 4 },
            { type: 'indent', value: '  ', raw: '  ', column: 16, line: 4 },
            { type: 'identifier', value: 'About', raw: 'About', column: 2, line: 5 },
            { type: 'operator', value: '?', raw: '?', column: 7, line: 5 },
            { type: 'indent', value: '  ', raw: '  ', column: 8, line: 5 },
            { type: 'identifier', value: 'Away', raw: 'Away', column: 2, line: 6 }
        ]);
    });
});
//# sourceMappingURL=tokenizer.test.js.map