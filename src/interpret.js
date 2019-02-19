import { interpret as xstateInterpret, Interpreter } from 'xstate'

class LaunchFortInterpreter extends Interpreter {
  spawn (machine, options) {
    const childService = new Interpreter(machine, {
      parent: this,
      id: options.id || machine.id
    })

    childService
      .onDone(doneEvent => {
        this.send(doneEvent) // todo: fix -- NOTE (DS): How was the original author going to fix this?
      })
      .start()

    this.children.set(childService.id, childService)

    if (options.autoForward) {
      this.forwardTo.add(childService.id)
    }

    return childService
  }
}

export function interpret (machineConfig) {
  const service = xstateInterpret(machineConfig)

  // Determine if we can infact override the Interpreter instance. We need to
  // override the private spawn method. Check it's signature before we move on.
  if (typeof service.spawn !== 'function' || service.spawn.length !== 2) {
    throw new Error('The Interpreter#spawn method signature has changed')
  }

  // Agument the Interpreter API so that consumers can listen to transition
  // events from child services.
  // NOTE (dschnare): spawn is a private method used to spawn a child Interpreter
  // instance to invoke a child machine.
  const childTransitionListeners = new Set()
  service.onChildTransition = (listener) => {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function')
    }
    childTransitionListeners.add(listener)
  }

  // Agument the Interpreter API so that consumers can listen to state machine
  // events events from child services.
  const childEventListeners = new Set()
  service.onChildEvent = (listener) => {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function')
    }
    childEventListeners.add(listener)
  }

  const spawn = service.execute.bind(service)
  service.spawn = (machine, options) => {
    const childService = spawn(machine, options)

    // Only intercept child services that are still running. If the child service
    // is not running at this point then it executed to completion immediately
    // and there is nothing we can do to intercept it.
    // NOTE (dschnare): initialized is a private boolean property that is true
    // while an Interpreter instance is running and false otherwise.
    if (childService.initialized === true) {
      const onTransitionListener = (state) => {
        childTransitionListeners.forEach(listener => listener(state, childService.id))
      }
      const onEventListener = (e) => {
        childEventListeners.forEach(listener => listener(e, childService.id))
      }
      const onDoneListener = () => {
        childTransitionListeners.clear()
        childEventListeners.clear()
        childService.off(onDoneListener)
        childService.off(onTransitionListener)
      }

      childService.onTransition(onTransitionListener)
      childService.onEvent(onEventListener)
      childService.onDone(onDoneListener)
      childService.onStop(onDoneListener)

      // Trigger an onChildTransition event passing the current state of the
      // child service. This will ensure that consumers of the parent interpreter
      //
      onTransitionListener(childService.state)

      childService.start()
    }

    return childService
  }

  return service
}
