# WireState CLI

Takes as input a wirestate behavioural statechart file and generates a new
form that can be used in code.

```
Usage:
wirestate {input file} [--srcDir directory] [--cacheDir directory] [--disableActions] [--mainMachine id]

Compiles a wirestate statechart and writes the generated result to stdout.

--srcDir              The source directory where imported wirestate files can be found [default {current directory}]
--cacheDir            The directory where the compiled files will be saved between compiles [default .wirestate]
--disableActions      Flag to disable action mapping when using the XState generator
--mainMachine         The ID of the machine to compile (first machine parsed by default)

Generates an ESM module that exports the statechart as a factory function that
generates an XState Machine instance. The factory is exported by the name
"wirestate".

Example:
wirestate statechart/App.wirestate --srcDir statechart > App.wirestate.js
```
