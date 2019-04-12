# WireState APIs

## CLI

> wirestate {input file} [--output {output type}]

Takes as input a wirestate behavioural statechart file and generates a new
form that can be used in code.

Supported output formats:

- json
- json-commonjs
- json-esm
- xstate-config
- xstate-config-commonjs
- xstate-config-esm
- xstate-machine-commonjs
- xstate-machine-esm

## Interpreter API

TODO

> Interpreter(state)

> start()

> matches(stateDescriptor)

> setConfiguration(states)

> onTransition

> onEvent

> onDone

> onEntry

> onExit

## React Binding

> WireStateApp
The root of any the React tree. Responsible for listening for `onTransition`
events and updating the `WireStateContext` appropriately. Also starts the service
when mounted.

Example:

```jsx
const state = State.create(stateConfig)
const service = new Interpreter(state)
const Root = () => {
  return (
    <WireStateApp service={service}>
      <App />
    </WireStateApp>
  )
}
```

Props:

- `service` The `Interpreter` instance
- `onStart` Function called when the interpreter starts (called each render)

> WireStateContext
Convenience context that provides the following properties:

- `service` = The `Interpreter` instance
- `send` = A convenience function used to send an event to the interpreter
- `matches` = A convenience function used to test the state configuration for matching states
- `configuration` = The current state configuration

Example:

```jsx
const Nav = () => {
  const { send } = React.useContext(WireStateContext)
  return (
    <ul>
      <a href='' onClick={e => {e.preventDefault(); send('home')}}>Home</a>
    </ul>
  )
}
```

> WireStateView
A simple wrapper component that will render its `children` or the `component`
prop if the the state configuration matches the specified state descriptor passed
to the `state` prop.

Example:

```jsx
const Home = () => {
  return (<h1>Home</h1>)
}
const App = () => {
  <>
    <WireStateView component={Home} state='.Home' />
  </>
}
```

Props:

- `component` The component to render when the state descriptor matches
- `state` The state descriptor that must match the state configuration of the `Interpreter`

## Vue Binding

*Comming soon*
