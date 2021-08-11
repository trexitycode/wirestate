"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Assert = require("assert");
const compile_1 = require("./compile");
describe('a compiler', function () {
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
        return compile_1.compileFromText(text, wireStateFile, { generatorName: 'xstate', disableCallbacks: true }).then(sourceText => {
            Assert.ok(!!sourceText.match(/one": {\s+"target":\s+\[\s+"#Two"\s+\],\s+"actions": function \(\) {}\s+}/), 'Incorrectly generated state name');
            Assert.ok(!!sourceText.match(/"updated potential shipments": {\s+"target":\s+\[\s+"#Redisplay"\s+\],\s+"actions": function \(\) {}\s+}/), 'Incorrectly generated state name');
            Assert.ok(!!sourceText.match(/"updated potential shipments": {\s+"target":\s+\[\s+"#Shipments Redisplay 1"\s+\],\s+"actions": function \(\) {}\s+}/), 'Incorrectly generated state name');
            Assert.ok(!!sourceText.match(/"back": {\s+"actions": \[\]\s+}/), 'Incorreclty generated forbidden transitions');
        }, error => {
            console.error(error);
            throw error;
        });
    });
    it.only('should compile a file with an @import', function () {
        return compile_1.compile('fixtures/App.wirestate', { srcDir: 'fixtures', generatorName: 'xstate', disableCallbacks: true }).then(text => {
            Assert.ok(!!text.match(/machines\['App'\]/), 'App machine not found');
            Assert.ok(!!text.match(/machines\['Auth'\]/), 'Auth machine not found');
            Assert.ok(!!text.match(/"Use Auth": \{\s+"id": "Use Auth",\s+"initial": "Auth"/), 'Auth machine not used');
        }, error => {
            console.error(error);
            throw error;
        });
    });
});
//# sourceMappingURL=compile.test.js.map