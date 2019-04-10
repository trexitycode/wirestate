import * as React from 'react'
import * as PropTypes from 'prop-types'

export const WireStateContext = React.createContext({
  configuration: [],
  send: null,
  matches: null,
  service: null
})

export const WireStateApp = ({ children, service, onStart }) => {
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
        setState({ ...state, configuration: service.configuration.toArray() })
      })
    ].filter(Boolean)

    // Calling start multiple times has no effect. Just the first
    // call to start will start the interpreter.
    service.start()

    if (onStart) onStart()

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
  onStart: PropTypes.func
}

export const WireStateView = ({ state, component, children }) => {
  const Component = component
  const { service } = React.useContext(WireStateContext)

  return service.matches(state)
    ? (
      Component ? <Component /> : children
    )
    : null
}
WireStateView.propTypes = {
  state: PropTypes.string.isRequired,
  component: PropTypes.func,
  children: PropTypes.node
}
