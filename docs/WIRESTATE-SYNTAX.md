## WireState Syntax

Behaviour statecharts are typically files ending with `.wirestate`. The statechart
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
# form `name -> State`.

About
  home -> Home
  about -> About

  Home
  About
```

Also, transitions can target multiple states or a single state:

```
About
  home -> Home
  # When this transition is enabled, the About and Modal states will
  # be activated at the same time (i.e. in parallel)
  about -> About, About

  Home
  About
  Modal
```

By default the first nested/child state is a parent state's initial state:

```
# Home is the initial state of state App
App
  Home
  About
```


## Modifiers

Each state can have optional modifiers that change the state's behaviour:

### Initial State: Asterisk (`*`)

`*` indicates the `initial state`. This is an alternative to putting the `initial state` as the first.

```
# Home is the initial state of state App
@machine App
  About
  Home*
```

### Parallel State: Ampersand (`&`)

`&` indicates a `parallel state`.

`Parallel states` are states that when active, all child states will be active

```
@machine App
  # '&' indicates that Contact is a parallel state
  Contact&
    One
    Two
    Three
```

### Final State: Exclamation (`!`)
`!` indicates the `final state`.

`Final states` are states that will cause the interpreter to trigger a 'done.state.{state id}' event. Where `state id` is the fully qualified path of the parent state (i.e. in this example: 'done.state.App.Blog').

Unlike the other modifiers, when referencing final states as transition targets `!` is part of the state name.

```
@machine App
  One
    next -> Two
  Two
    next -> Three! # see that the exclamation myst be included in the transition target
  Three!
```

### Transient State: Interrogation (`?`)

`Transient states` are states that are suffixed with `?`. There's no special meaning to these states other than tranditionally these states are used to model logic behaviour of the system being modelled.

```
@machine Launch
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

Notice that when referencing transiet states the `?` is always included in the state name.

Transient states are not meant to model a long-lasting state of the machine
but to indicate to the system to perform a synchronous logic behaviour. Also,
typically transient states have their transition events ending in `?` as well.

## Using multiple machines

To add a separate state machine into another, we need a regular state, but with `@use OTHER_MACHINE` included in it.
This is to be treated just like any other state.

`Note: by convention, we are currently calling @use MACHINE_NAME at the bottom of the state since all the transitions prior to will still keep it in Machine1.`

```
@machine Machine1
  # other states
  get in machine2 -> Machine2
  Machine2
    @use Machine2
  
@machine Machine2
  # Machine2 states
```

As mentioned previously, this can be treated as any other state, so in order to navigate out of it, just add transations in the state where the second machine is invoked.

```
@machine Machine1
  # other states
  Start
    get in machine2 -> Machine2
  Machine2
    back to machine1 -> Start
    @use Machine2
  
@machine Machine2
  # Machine2 states
```

Make sure these aren't in the Machine2, when you expect to be able to return to Machine1, as there will be a conflict of usage. The one in the current machine will take precendent.
So for this example, make sure there is no `back to machine1` transition in Machine2 states where you know you may want to transition back to Machine1.


## Concepts

**State Configuration**

TODO

- state configuration; all states that are currently active
- state specification; target states intended to enter
- state ID; all ancestor state names joined by '.'

**Transition Targets**

TODO

- single and multiple transition targets
- state name resolution; the first sibling or ancestor state that matches the
  target state name will be selected

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

**Application State**

TODO

- don't need to listen to application state updates
- modifying application state then sending an event to the interpreter
  will cause a rerender of your application
- the state transition will naturally cause your application to rerender, and
  when it does the new application state values will be used
- you can use things like redux or veux, etc. but know that this will lead to
  extra redraws

