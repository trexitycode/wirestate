import { compileFromText } from './compile'

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
`

const wireStateFile = 'App.wirestate'

// compileFromText(text, wireStateFile).then(async jsonString => {
//   console.log(jsonString)
// }, error => {
//   console.error(error)
// })

compileFromText(text, wireStateFile, { generatorName: 'xstate' }).then(async jsonString => {
  console.log(jsonString)
}, error => {
  console.error(error)
})
