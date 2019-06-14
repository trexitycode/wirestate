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
  Start
    done -> Done!
  Done!
`;
// Should raise a SemanticError due to the fact we have two states in the machine
// with the same ID.
// const text2 = `
// @machine App
//   Application&
//     Menu
//       dashboard -> Dashboard
//       other -> Other
//       Dashboard
//       Other
//     Screens
//       Dashboard
//         next -> Other
//       Other
//         back -> Dashboard
// `
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