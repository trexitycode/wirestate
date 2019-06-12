"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const compile_1 = require("./compile");
const text = `
@machine App
  dismiss -> Done!

  Yellow
    go -> Green
    @use Modal

  Green
  Done!

@machine Modal
  <- go
  Start
    done -> Done!
  Done!
`;
const wireStateFile = 'App.wirestate';
// compileFromText(text, wireStateFile).then(async jsonString => {
//   console.log(jsonString)
// }, error => {
//   console.error(error)
// })
compile_1.compileFromText(text, wireStateFile, { generatorName: 'xstate' }).then(async (jsonString) => {
    console.log(jsonString);
}, error => {
    console.error(error);
});
//# sourceMappingURL=compile.test.js.map