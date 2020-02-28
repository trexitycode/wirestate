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

## Callbacks

Each state may or may not have a `callback` function.
Think of it as something that happens when we enter a state, however it is not required as some states don't need anything to happen upon entering. So, in other words, not all states need callbacks, but the callbacks must belong to a state.

### Example Setup

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
    console.warn('I have entered the App machine')
    return () => {
      console.warn('I have left the app machine')
    }
  }
}
```

Notice that we return a function. This is no accident. As a pattern in the wirestate callbacks, you can optionally return a function that will run once you leave that state (or machine).

Say you want to add a callback to the `Start` state. Because it belongs to the `App` machine, this has to be indicated in the name of the callback in the object. This is done with the following naming pattern: `[MACHINE_NAME]/[STATE_NAME]`. Using the previous machine, this is what the object will now look like:

```
const callbacks = {
  'App': (evt, send) => {
    console.warn('I have entered the App machine')
    return () => {
      console.warn('I have left the app machine)
  },
  'App/Start': (evt, send) => {
    console.warn('START')
    return () => {
      console.warn('I have left the Start state')
    }
  }
}
```

If you are dealing with two separate machines, the callback properties for those machines will need to follow the same pattern.
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

If you would like `OtherMachine` and `DoSomething` to have callbacks, they must be done as follows:

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
