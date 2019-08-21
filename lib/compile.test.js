"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Assert = require("assert");
const compile_1 = require("./compile");
describe.only('a compiler', function () {
    it('should compile to XState with proper state names', function () {
        const text = `
@machine Shipments
  updated potential shipments -> Redisplay
  back -> |

  Display*
  Redisplay
    one -> Two
  Two

@machine App
  Shipments
    @use "Shipments"
`;
        const wireStateFile = 'App.wirestate';
        return compile_1.compileFromText(text, wireStateFile, { generatorName: 'xstate', disableCallbacks: true }).then(async (sourceText) => {
            Assert.ok(!!sourceText.match(/one": {\s+"target":\s+\[\s+"#Two"\s+\]\s+}/), 'Incorrectly generated state name');
            Assert.ok(!!sourceText.match(/"updated potential shipments": {\s+"target":\s+\[\s+"#Redisplay"\s+\]\s+}/), 'Incorrectly generated state name');
            Assert.ok(!!sourceText.match(/"updated potential shipments": {\s+"target":\s+\[\s+"#Shipments Redisplay 1"\s+\]\s+}/), 'Incorrectly generated state name');
            Assert.ok(!!sourceText.match(/"back": {\s+"actions": \[\]\s+}/), 'Incorreclty generated forbidden transitions');
        }, error => {
            console.error(error);
            throw error;
        });
    });
});
//# sourceMappingURL=compile.test.js.map