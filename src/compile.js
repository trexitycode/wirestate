import * as FS from 'fs'
import * as Path from 'path'
import { promisify } from 'util'
import { makeTokenizer } from './tokenizer'
import { makeParser } from './parser'
import { makeAnalyzer } from './analyzer'
import { makeGenerator } from './generator'

const readFile = promisify(FS.readFile)

export const compileFromSource = async (src, generatorName = 'json') => {
  const tokenizer = makeTokenizer()
  const tokens = tokenizer.tokenize(src)

  const parser = makeParser()
  const ast = parser.parse(tokens)

  const analyzer = makeAnalyzer()
  const newAst = await analyzer.analyze(ast)
  const generator = makeGenerator()
  return generator.generate(newAst, generatorName)
}

export const compile = async (fileName, generatorName = 'json') => {
  const src = await readFile(fileName, 'utf8')
  const tokenizer = makeTokenizer()
  const tokens = tokenizer.tokenize(src)

  const rootStateName = Path.basename(fileName, Path.extname(fileName))
  const parser = makeParser()
  const ast = parser.parse(tokens, rootStateName)

  const analyzer = makeAnalyzer()
  const newAst = await analyzer.analyze(ast, { fileName })
  const generator = makeGenerator()
  return generator.generate(newAst, generatorName)
}
