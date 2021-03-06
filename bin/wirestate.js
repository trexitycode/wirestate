#! /usr/bin/env node

const WireState = require('../lib/index')

/**
 * Read a commandline option.
 *
 * @example
 * const args = process.args.slice(2)
 * // Required (i.e. program --name myname)
 * const name = readOption([ '--name' ], args)
 * // Optional list option (i.e. program --flavor value --flavor value2)
 * const flavor = readOption([ '--flavor' ], args, { defaultValue: [] })
 * // Optional flag option (i.e. program --flag)
 * const flag = readOption([ '--flg' ], args, { defaultValue: false })
 * @param {string[]} names The valid option names on the command line
 * @param {string[]} args The command line arguments without the program and script name
 * @param {Object} [options]
 * @param {any} [options.defaultValue] The defaultValue of the option
 * @return {any[]|any}
 */
function readOption (names, args, { defaultValue = undefined } = {}) {
  let argValues = []
  let argCount = 0

  names.forEach(name => {
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

      if (argCount === 0) {
        argValues = [ value ]
      } else {
        argValues = argValues.concat(value)
      }

      argCount += 1
    }
  })

  if (Array.isArray(defaultValue)) {
    return argValues
  } else {
    if (argCount === 1) {
      return argValues[0]
    } else if (argCount === 0) {
      if (defaultValue === undefined) {
        throw new Error(`Option ${names} is required`)
      } else {
        return defaultValue
      }
    } else {
      throw new Error(`Option ${names} only allows one value`)
    }
  }
}

async function generate (inputFileName, { generatorName, srcDir, cache, disableCallbacks }) {
  return WireState.compile(inputFileName, { generatorName, srcDir, cache, disableCallbacks })
}

const help = () => {
  console.log(`Usage:
wirestate {input file} [--srcDir directory] [--cacheDir directory] [--generator name]

Compiles a wirestate statechart and writes the generated result to stdout.

--srcDir              The source directory where imported wirestate files can be found [default {current directory}]
--cacheDir            The directory where the compiled files will be saved between compiles [default .wirestate]
--generator           The name of the generator to use [default json]
--disableCallbacks    Flag to disable callback mapping when using the XState generator

Generators:
json                  Generates the statechart in JSON format
xstate                Generates an ESM module that exports the statechart as an xstate Interpreter factory (named export "wirestate")

Example:
wirestate statechart/App.wirestate --generator xstate --srcDir statechart > App.wirestate.js`
  )
}

function main () {
  const args = process.argv.slice(2)

  if (args.some(arg => [ '--help', '-h' ].indexOf(arg) >= 0)) {
    help()
    process.exit(0)
  }

  const inputFileName = args.find(arg => !arg.startsWith('-'))
  const srcDir = readOption([ '--srcDir' ], args, { defaultValue: '' })
  const cacheDir = readOption([ '--cacheDir' ], args, { defaultValue: null })
  const generatorName = readOption([ '--generator' ], args, { defaultValue: 'json' })
  const disableCallbacks = readOption([ '--disableCallbacks' ], args, { defaultValue: false })

  if (!inputFileName) {
    help()
    process.exit(20)
  }

  const cache = cacheDir === null
    ? new WireState.MemoryCache()
    : new WireState.FileCache({ srcDir, cacheDir })

  return generate(inputFileName, { srcDir, generatorName, cache, disableCallbacks })
}

// Entry ---------

main().then(output => {
  return new Promise((resolve, reject) => {
    process.stdout.write(output, 'utf8', (error) => {
      error ? reject(error) : resolve()
    })
  })
}).catch(error => {
  if (error.name === 'SemanticError') {
    console.error(
      JSON.stringify(
        error,
        null,
        2
      )
    )
    process.exit(10)
  } else if (error.name === 'LexicalError') {
    console.error(
      JSON.stringify(
        error,
        null,
        2
      )
    )
    process.exit(20)
  } else {
    console.error(error)
    process.exit(30)
  }
})
