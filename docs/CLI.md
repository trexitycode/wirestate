# WireState CLI

Takes as input a wirestate behavioural statechart file and generates a new
form that can be used in code.

```
Usage:
wirestate {input file} [--srcDir directory] [--cacheDir directory] [--generator name]

Compiles a wirestate statechart and writes the generated result to stdout.

--srcDir              The source directory where imported wirestate files can be found [default {current directory}]
--cacheDir            The directory where the compiled files will be saved between compiles [default .wirestate]
--generator           The name of the generator to use [default json]

Generators:
json                  Generates the statechart in JSON format
json-commonjs         Generates a CommonJS module that exports the statechart in JSON format (named export "statechart")
json-esm              Generates an ESM module that exports the statechart in JSON format (named export "statechart")
xstate                Generates an ESM module that exports the statechart as an xstate Interpreter factory (named export "wirestate")

Example:
wirestate statechart/App.wirestate --generator xstate --srcDir statechart > App.wirestate.js
```
