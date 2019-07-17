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

- `callback` The action function to invoke when the state descriptor matches
- `state` The state descriptor that must match the state configuration of the `Interpreter`

The `action` function can optionally return a function to [clean up](https://reactjs.org/docs/hooks-reference.html#cleaning-up-an-effect) any side
effects.

## Vue Binding

*Comming soon*

# TODO: We still need to update all the code above for the setup. From here forward, the API of the machine itself and the callbacks will be properly described, assuming it was all properly set up.

## Callbacks

Each state may or may not have a `callback` function.
Think of it as something that happens when we enter a state, however it is not required as some states don't need anything to happen upon entering. So, in other words, not all states need callbacks, but the callbacks must belong to a state.

### Setup
The `callbacks` object needs to be passed in the wirestate function when setting up the machine.

In the root of your project, have a file called `machine.js` and set it up as such.

```
import { interpret } from 'xstate'
import { wirestate } from './statecharts/generated/App.wirestate'

// TODO: actions is set to be updated to callbacks. Update this accordingly
const machines = wirestate({
  actions: callbacks
})

export const service = interpret(machines['App'])
export const send = service.send

service.start()
```

### Usage

The callbacks object will have the callback functions.

The callback object will map each function to a particular state. Say you have the following machine:

```
@machine App
  Start
    stop -> Stop!
  Stop!
```

If you want to add a `callback` once you have entered the `App` machine, the following code will be required in the callbacks object:

```
const callbacks = {
  'App': (evt, send) => {
    console.warn('I am in the App machine)
    return () => {
      console.warn('I have left the app machine)
    }
  }
}
```

Notice that we return a function. This is no accident. As a pattern in  the wirestate callbacks, you want to always return a function that will run once you leave that state (or machine).

Say you no want to add a callback to the `Start` state. Because it belongs to the `App` machine, this has to be indicated in the name of the callback in the object. This is done with the following naming pattern: `[MACHINE_NAME]/[STATE_NAME]`. Using the previous machine, this is what the object will now look like:

```
const callbacks = {
  'App': (evt, send) => {
    console.warn('I am in the App machine)
    return () => {
      console.warn('I have left the app machine)
    }
  'App/Start': (evt, send) => {
    console.warn('START')
    return () => {
      console.warn('I have left the Start state')
    }
  }
}
```

If you are deling with two separate machines, the callback properties for those machines will need to follow the same pattern.
Say you have the following machine:

```
@machine App
  Start
    stop -> Stop!
  OtherMachine
    back -> Start
    @use "OtherMachine"
  Stop!

@machine OtherMachine
  DoSomething
```

If we would like `OtherMachine` and `DoSomething` to have callbacks, they must be done as follows:

```
const callbacks = {
  // App callbacks here
  'OtherMachine': (evt, send) => {
    console.warn('Got in to the other machine!')
    return () => {
      console.warn('Left the other machine')
    }
  },
  'OtherMachine/DoSomething': (evt, send) => {
    console.warn('Do something!')
    return () => {
      console.warn('Left do something')
    }
  }
}
```

### Callback Parameters

The callback functions have two parameters: `evt` and `send`.

- `evt` the object passed in from the send which got them into the current state
- `send` is the same transition function

For the example being used, say upon entering `Start` you have to check one of the properties of `evt` to decide whether or not to go to `Stop`:

```
...
  'App/Start': (evt, send) => {
    console.warn('START')
    const { shouldIStop } = evt

    if (shouldIStop) {
      send('stop')
    }
    return () => {
      console.warn('I have left the Start state')
    }
...
```