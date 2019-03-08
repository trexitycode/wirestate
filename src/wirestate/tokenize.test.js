import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
import { makeAnalyzer } from './analyzer'

const state = `
back -> Exit!

Exit!

Home*
  one -> One?
  get name -> Home.Modal

  @include "./modal.state"

One?
  is user logged in? -> Seven

Seven`


const tokenizer = makeTokenizer()
const tokens = tokenizer.tokenize(state)
// console.log(JSON.stringify({ tokens }, null, 2))

const parser = makeParser()
const ast = parser.parse(tokens)
// console.log(JSON.stringify(ast, null, 2))

const analyzer = makeAnalyzer()
analyzer.analyze(ast, 'file.state').then(newAst => {
  console.log(JSON.stringify(newAst, null, 2))
})

