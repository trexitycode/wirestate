#! /usr/bin/env node

const FS = require('fs')
const Path = require('path')
const { promisify } = require('util')
const WireState = require('../lib/index')

const readFile = promisify(FS.readFile)
const tokenizer = WireState.makeTokenizer()
const parser = WireState.makeParser()
const analyzer = WireState.makeAnalyzer()
const generator = WireState.makeGenerator()

const readOption = (names, args, { defaultValue = null }) => {
  let argValue = defaultValue
  names.some(name => {
    const index = args.findIndex(arg => arg.startsWith(name))
    if (index >= 0) {
      let value = args[index].indexOf('=') >= 0
        ? args[index].split('=').slice(1).join('=')
        : args[index + 1]

      if (typeof defaultValue === 'boolean') {
        value = true
      } else if (!value || value.startsWith('-')) {
        throw new Error(`Option ${name} must have a value`)
      }

      argValue = value
      return true
    }
  })

  return argValue
}

async function generate (inputFileName, outputType) {
  const id = Path.basename(inputFileName, '.states')
  const stateText = await readFile(inputFileName, 'utf8')
  const tokens = tokenizer.tokenize(stateText)
  const stateNode = parser.parse(tokens, id)

  const newStateNode = await analyzer.analyze(stateNode, 'file.states')
  const output = generator.generate(newStateNode, outputType)

  return output
}

function main () {
  const args = process.argv.slice(2)
  const help = () => {
    console.log(`Usage:
wirestate {input file} [--output {output type}] [--strict]`
    )
  }

  if (args.some(arg => [ '--help', '-h' ].indexOf(arg) >= 0)) {
    help()
    process.exit(0)
  }

  const inputFileName = args.find(arg => !arg.startsWith('-'))
  const output = readOption([ '--output' ], args, { defaultValue: 'json' })

  if (!inputFileName) {
    help()
    process.exit(20)
  }

  return generate(inputFileName, output)
}

main().then(output => {
  return new Promise((resolve, reject) => {
    process.stdout.write(output, 'utf8', (error) => {
      error ? reject(error) : resolve()
    })
  })
}).catch(error => {
  console.error(error)
  process.exit(10)
})