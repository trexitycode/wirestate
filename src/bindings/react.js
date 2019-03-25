import * as React from 'react'
import * as PropTypes from 'prop-types'
import { Interpreter } from '../interpreter'

const service = new Interpreter()

export const WireStateContext = React.createContext({
  configuration: [],
  atomicStates: [],
  service,
  send: service.send.bind(service),
  matches: service.matches.bind(service)
})

export const WireStateApp = ({ children, onDone = () => {} }) => {
  const { service } = React.useContext(WireStateContext)
  const { configuration, setConfiguration } = React.useState([])

  React.useEffect(() => {
    const unlistenTransition = service.onTransition(() => {
      setConfiguration(service.configuration.toArray())
    })
    const unlistenDone = service.onDone(() => {
      if (typeof onDone === 'function') onDone()
    })
    return () => {
      unlistenTransition()
      unlistenDone()
    }
  })

  const atomicStates = configuration.filter(s => s.isAtomic)
  return (
    <WireStateContext.Provider value={{ service, configuration, atomicStates }}>
      {children}
    </WireStateContext.Provider>
  )
}
WireStateApp.propTypes = {
  children: PropTypes.node.isRequired,
  onDone: PropTypes.func
}

export const WireStateView = ({ state, component, children }) => {
  const { matches, atomicStates } = React.useContext(WireStateContext)
  return matches(atomicStates, state)
    ? (
      component ? <component /> : <>{children}</>
    )
    : null
}
WireStateView.propTypes = {
  state: PropTypes.string.isRequired,
  component: PropTypes.func,
  children: PropTypes.node
}
