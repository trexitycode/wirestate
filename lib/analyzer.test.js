"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Assert = require("assert");
const tokenizer_1 = require("./tokenizer");
const parser_1 = require("./parser");
const analyzer_1 = require("./analyzer");
const cache_1 = require("./cache");
describe('an analyzer', function () {
    const tokenizer = tokenizer_1.makeTokenizer({ wireStateFile: 'App.wirestate' });
    const parser = parser_1.makeParser({ wireStateFile: 'App.wirestate' });
    const analyzer = analyzer_1.makeAnalyzer({ cache: new cache_1.Cache() });
    it('should throw if a single transition target cannot be resolved', async function () {
        const sourceText = `
@machine App
  Home
    about -> About
`;
        const tokens = tokenizer.tokenize(sourceText);
        const scopeNode = parser.parse(tokens);
        Assert.rejects(analyzer.analyze(scopeNode), /Transition Target: About/).catch(_ => { });
    });
    it('should not throw if a single transition target can be resolved', async function () {
        const sourceText = `
@machine App
  Home
    about -> About
  About
`;
        const tokens = tokenizer.tokenize(sourceText);
        const scopeNode = parser.parse(tokens);
        Assert.doesNotReject(analyzer.analyze(scopeNode)).catch(_ => { });
    });
    it('should throw if a multi-target transition target cannot be resolved', async function () {
        const sourceText = `
@machine App
  Home
    about -> About, Away
  About
`;
        const tokens = tokenizer.tokenize(sourceText);
        const scopeNode = parser.parse(tokens);
        Assert.rejects(analyzer.analyze(scopeNode), /Transition Target: Away/).catch(_ => { });
    });
    it('should not throw if a multi-target transition target can be resolved', async function () {
        const sourceText = `
@machine App
  Home
    about -> About, Away
  About
  Away
`;
        const tokens = tokenizer.tokenize(sourceText);
        const scopeNode = parser.parse(tokens);
        Assert.doesNotReject(analyzer.analyze(scopeNode)).catch(_ => { });
    });
});
//# sourceMappingURL=analyzer.test.js.map