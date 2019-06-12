# WireState APIs

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
- `context` An object containing extra properties to set on the `WireStateContext`

> WireStateContext
Convenience context that provides the following properties:

- `service` = The `Interpreter` instance
- `send` = A convenience function used to send an event to the interpreter
- `matches` = A convenience function used to test the state configuration for matching states
- `configuration` = The current state configuration
- `*` = Any other properties passed to the `WireStateApp` in the `context` prop

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

> WireStateAction
A simple wrapper component that renders nothing but will call the `action` prop
if the the state configuration matches the specified state descriptor passed
to the `state` prop.

Example:

```jsx
const doStuff = ({ matches, send }) => {
  // do stuff
}

const Home = () => {
  /*
  // Same as using WireStateAction:
  const { matches } = React.useContext(WireStateContext)
  React.useEffect(() => {
    if (matches('*.Something')) {
      return action()
    }
  })
  */
  return (
    <>
      <WireStateAction state='*.Something' action={doStuff} />
      <h1>Home</h1>
    </>
  )
}
const App = () => {
  <>
    <WireStateView component={Home} state='.Home' />
  </>
}
```

Props:

- `action` The action function to invoke when the state descriptor matches
- `state` The state descriptor that must match the state configuration of the `Interpreter`

The `action` function can optionally return a function to [clean up](https://reactjs.org/docs/hooks-reference.html#cleaning-up-an-effect) any side
effects.

## Vue Binding

*Comming soon*
