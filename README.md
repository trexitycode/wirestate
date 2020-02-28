# WireState

> Statecharts for wireframe and application development

WireState is a compiler that compiles files written in a
high-level DSL and transforms them to JavaScript ESM and other
formats. When targeting JavaScript ESM, the module exports
[XState][1] interpreters for each of your state machines.

The WireState DSL makes authoring statecharts for UIs easier
by focusing on a terse yet intuitive syntax. Additionally,
directives provide support for modular techniques that
help keep large applications maintainable.

WireState is inspired by [SCXML][2], [XState][1], and [sketch.systems][3].

[1]: https://xstate.js.org/
[2]: https://www.w3.org/TR/scxml/
[3]: https://sketch.systems/

## Documentation

- [Guide -- outdated](./docs/GUIDE.md)
- [CLI](./docs/CLI.md)
- [API -- outdated](./docs/API.md)
