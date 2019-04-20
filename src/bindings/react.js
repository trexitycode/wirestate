import * as React from 'react'
import * as PropTypes from 'prop-types'

const noop = () => {}

export const WireStateContext = React.createContext({
  configuration: [],
  send: null,
  matches: null,
  service: null
})

export const WireStateApp = ({ children, service, onStart, context = {} }) => {
  const [ state, setState ] = React.useState(() => {
    return {
      configuration: [],
      service,
      send: service.send,
      matches: service.matches
    }
  })

  React.useEffect(() => {
    const subscriptions = [
      service.onTransition(() => {
        setState({ ...context, ...state, configuration: service.configuration.toArray() })
      })
    ].filter(Boolean)

    // Calling start multiple times has no effect. Just the first
    // call to start will start the interpreter.
    service.start()

    if (typeof onStart === 'function') {
      onStart()
    }

    return () => {
      while (subscriptions.length) {
        subscriptions.pop()()
      }
    }
  })

  return (
    <WireStateContext.Provider value={state}>
      {children}
    </WireStateContext.Provider>
  )
}
WireStateApp.propTypes = {
  service: PropTypes.object.isRequired,
  children: PropTypes.node.isRequired,
  onStart: PropTypes.func,
  context: PropTypes.object
}

export const WireStateView = ({ state, component, children }) => {
  const Component = component
  const { matches } = React.useContext(WireStateContext)

  return matches(state)
    ? (
      Component ? <Component /> : children
    )
    : null
}
WireStateView.propTypes = {
  state: PropTypes.string.isRequired,
  component: PropTypes.elementType,
  children: PropTypes.node
}

export const WireStateAction = ({ state, action }) => {
  const ctx = React.useContext(WireStateContext)

  React.useEffect(() => {
    if (ctx.matches(state)) {
      return action(ctx)
    }
  })

  return null
}
WireStateAction.propTypes = {
  state: PropTypes.string.isRequired,
  action: PropTypes.func.isRequired
}
