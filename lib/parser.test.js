"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Assert = require("assert");
const parser_1 = require("./parser");
describe('a parser', function () {
    it('should parse transitions with single targets', function () {
        const parser = parser_1.makeParser();
        /*
        @machine App
          Home
            about -> About
        */
        const tokens = [
            { type: 'directive', value: '@machine', raw: '@machine', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 8, line: 1 },
            { type: 'identifier', value: 'App', raw: 'App', column: 9, line: 1 },
            { type: 'indent', value: '  ', raw: '  ', column: 12, line: 1 },
            { type: 'identifier', value: 'Home', raw: 'Home', column: 0, line: 2 },
            { type: 'indent', value: '    ', raw: '    ', column: 6, line: 2 },
            { type: 'identifier', value: 'about', raw: 'about', column: 4, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 9, line: 3 },
            { type: 'symbol', value: '->', raw: '->', column: 10, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 12, line: 3 },
            { type: 'identifier', value: 'About', raw: 'About', column: 13, line: 3 }
        ];
        const scopeNode = parser.parse(tokens);
        Assert.strictEqual(scopeNode.machines.length, 1);
        Assert.strictEqual(scopeNode.machines[0].id, 'App');
        Assert.strictEqual(scopeNode.machines[0].states.length, 1);
        Assert.strictEqual(scopeNode.machines[0].states[0].id, 'Home');
        Assert.strictEqual(scopeNode.machines[0].states[0].transitions.length, 1);
        Assert.strictEqual(scopeNode.machines[0].states[0].transitions[0].target, 'About');
    });
    it('should parse transitions with multiple targets', function () {
        const parser = parser_1.makeParser();
        /*
        @machine App
          Home
            about -> About, Away
        */
        const tokens = [
            { type: 'directive', value: '@machine', raw: '@machine', column: 0, line: 1 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 8, line: 1 },
            { type: 'identifier', value: 'App', raw: 'App', column: 9, line: 1 },
            { type: 'indent', value: '  ', raw: '  ', column: 12, line: 1 },
            { type: 'identifier', value: 'Home', raw: 'Home', column: 0, line: 2 },
            { type: 'indent', value: '    ', raw: '    ', column: 6, line: 2 },
            { type: 'identifier', value: 'about', raw: 'about', column: 4, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 9, line: 3 },
            { type: 'symbol', value: '->', raw: '->', column: 10, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 12, line: 3 },
            { type: 'identifier', value: 'About', raw: 'About', column: 13, line: 3 },
            { type: 'operator', value: ',', raw: ',', column: 18, line: 3 },
            { type: 'whitespace', value: ' ', raw: ' ', column: 19, line: 3 },
            { type: 'identifier', value: 'Away', raw: 'Away', column: 20, line: 3 }
        ];
        const scopeNode = parser.parse(tokens);
        Assert.strictEqual(scopeNode.machines.length, 1);
        Assert.strictEqual(scopeNode.machines[0].id, 'App');
        Assert.strictEqual(scopeNode.machines[0].states.length, 1);
        Assert.strictEqual(scopeNode.machines[0].states[0].id, 'Home');
        Assert.strictEqual(scopeNode.machines[0].states[0].transitions.length, 1);
        Assert.strictEqual(scopeNode.machines[0].states[0].transitions[0].target, 'About,Away');
    });
});
//# sourceMappingURL=parser.test.js.map