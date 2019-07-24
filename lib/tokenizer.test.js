"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Assert = require("assert");
const tokenizer_1 = require("./tokenizer");
describe('a tokenzier', function () {
    it('should tokenize keywords only followed by whitespace', function () {
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'SomeFile.wirestate' });
        const source = `as asOne oneas`;
        const tokens = tokenizer.tokenize(source);
        Assert.deepStrictEqual(tokens, [
            { type: 'keyword', value: 'as', raw: 'as', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 2, line: 1 },
            { type: 'identifier', value: 'asOne oneas', raw: 'asOne oneas', column: 3, line: 1 }
        ]);
    });
    it('should tokenize keywords at end of source text', function () {
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'SomeFile.wirestate' });
        const source = `*as`;
        const tokens = tokenizer.tokenize(source);
        Assert.deepStrictEqual(tokens, [
            { type: 'operator', value: '*', raw: '*', column: 0, line: 1 },
            { type: 'keyword', value: 'as', raw: 'as', column: 1, line: 1 }
        ]);
    });
    it('should not include keywords within identifiers', function () {
        const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'SomeFile.wirestate' });
        const source = `My as State Name as`;
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
        const source = `My State as`;
        const tokens = tokenizer.tokenize(source);
        Assert.deepStrictEqual(tokens, [
            { type: 'identifier', value: 'My State', raw: 'My State', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 8, line: 1 },
            { type: 'keyword', value: 'as', raw: 'as', column: 9, line: 1 }
        ]);
    });
});
//# sourceMappingURL=tokenizer.test.js.map