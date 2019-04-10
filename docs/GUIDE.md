# WireState Guide

## Get Started

### Installation

```
npm install launchfort/wirestate --save
```

### Compiling

Given a statechart like:

```
# App.state
App
  home -> Home
  about -> About
  contact -> Contact

  Home*
  About
  Contact
```

We can compile it to a `json` format for interpreting using the following CLI:

```
wirestate App.state --output json-esm > App.state.js
```

### Choose A Binding

#### React

```js
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Interpreter, State } from 'wirestate/interpreter'
import { WireStateApp, WireStateView } from 'wirestate/bindings/react'
import { config as AppStateConfig } from './App.state.js'

// Parse the app state from JSON
const appState = State.create(AppStateConfig)
// Instantiate the interpreter
const service = new Interpreter(appState)

// Handle out-of-band state transitions (i.e. deep links)
const syncDocumentLocation = () => {
  const hash = document.location.hash || '#home'
  service.send(hash.substr(1))
}
window.addEventListener('popstate', syncDocumentLocation)

// The root of the React tree. This sets up the WireStateApp
// component and context and contains our App component.
export const Root = () => {
  return (
    <WireStateApp service={service} onStart={syncDocumentLocation}>
      <App />
    </WireStateApp>
  )
}

const App = () => {
  // Render components whenever a state ID matches a state descriptor pattern
  return (
    <>
      <WireStateView component={Home} state='*.Home' />
      <WireStateView component={About} state='*.About' />
      <WireStateView component={Contact} state='*.Contact' />
    </>
  )
}

const Nav = () => {
  return (
    <ul>
      <li><a href='#home'>Home</a></li>
      <li><a href='#about'>About</a></li>
      <li><a href='#contact'>Contact</a></li>
    </ul>
  )
}

const Home = () => {
  return (
    <div>
      <h1>Home</h1>
      <Nav />
    </div>
  )
}

const About = () => {
  return (
    <div>
      <h1>About</h1>
      <Nav />
    </div>
  )
}

const Contact = () => {
  return (
    <div>
      <h1>Contact</h1>
      <Nav />
    </div>
  )
}

ReactDOM.render(<Root />, document.getElementById('app'))
```

#### Vue

*Coming soon*

## Behaviour Statechart Syntax

Behaviour statecharts are typically files ending with `.state`. The statechart
consistes of states and their transitions.

States:

```
# States are typically written in proper casing
Loading Profile
Home
About

# States can be nested by indenting 2 spaces
App
  Home
  About
  Contact
```

Transitions:

```
# Transitions are typically all lowercased, indented 2 spaces and are of the
# form `name -> State`
About
  home -> Home
  about -> About

  Home
  About
```

By default the first nested/child state is a parent state's initial state:

```
# Home is the initial state of state App
App
  home -> Home

  Home
```

Each state can have optional modifiers that change the state's behaviour:

```
App
  home -> Home

  About
  # '*' indicates Home is initial
  Home*

  # '&' indicates that Contact is a parallel state
  #
  # Parallel states are states that when active, all child states will be active
  Contact&
    One
    Two
    Three

  Blog
    Four
    # '!' indicates that Five! is final
    #
    # Final states are states that will cause the interpreter to trigger a
    # 'done.state.{state id}' event. Where `state id` is the fully qualified
    # path of the parent state (i.e. in this example: 'done.state.App.Blog').
    #
    # When referencing final states as transition targets '!' is part of the
    # state name.
    Five!
```

Transient states are states that are suffixed with `?`. There's no special
meaning to these states other than tranditionally these states are used to
model logic behaviour of the system being modelled.

```
# App.state
Launch*
  Is User Authenticated?*
    yes? -> Loading Profile
    no? -> Login

  Loading Profile
    profile loaded -> Check Profile?
    profile not found -> Login
    failure -> Loading Profile Error

  Loading Profile Error
    try again -> Loading Profile

  Check Profile?
    email unverified? -> Verify Email
    profile complete? -> Home
    profile not complete -> User Onboarding

  User Onboarding
  Verify Email
  Login

Home
```

Notice that when referencing transiet states the `?` is always included in the
state name.

Transient states are not meant to model a long-lasting state of the machine
but to indicate to the system to perform a synchronous logic behaviour. Also,
typically transient states have their transition events ending in `?` as well.

## Concepts

**State Configuration**

TODO

- state configuration; all states that are currently active
- state specification; target states intended to enter
- state ID; all ancestor state names joined by '.'

**Transition Targets**

TODO

- single and multiple transition targets

**State ID And Event Matching**

TODO

```
PATTERN            MATCHES EVENTS AND STATE IDS LIKE
*                  anything, foo.event, something
.foo               foo, something.foo
*.foo              foo, something.foo
foo                foo
foo.               foo, foo.something, foo.something.two
foo.*              foo, foo.something, foo.something.two
foo.*.Modal        foo.Modal, foo.anything.Modal
foo.*.Modal.       foo.Modal, foo.anything.Modal, foo.anything.something.Modal.Another
foo.*.Modal.*      foo.Modal, foo.anything.Modal, foo.anything.something.Modal.Another
foo.*.One.*.Two    foo.One.Two, foo.anything.One.something.somethingelse.Two
```
