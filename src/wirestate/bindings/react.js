import * as React from 'react'

export const WireStateContext = React.createContext({
  service: null,
  prevState: null,
  currState: null,
  stateComponentMap: {}
})

const EventsView = ({ events, send, layout = 'auto' }) => {
  let eventElements = null
  let style = {
    section: {
      display: 'flex',
      justifyContent: 'center',
      padding: '20px'
    },
    select: {
      padding: '8px'
    },
    button: {
      padding: '8px',
      border: '1px solid black',
      textDecoration: 'none',
      background: '#EAEAEA',
      color: '#333333',
      fontWeight: 'bold',
      borderRadius: '8px'
    }
  }

  if (!Array.isArray(events) || events.length === 0) return null

  if (layout === 'select') {
    eventElements = (
      <select
        style={style.select}
        onChange={(e) => {
          if (e.target.value !== 'Choose logic descision') {
            send(e.target.value)
          }
        }}>
        {
          [ 'Choose logic descision' ].concat(events).map(event => {
            return (<option key={event} value={event}>{event}</option>)
          })
        }
      </select>
    )
  } else {
    layout = layout === 'auto'
      ? (events.length > 2 ? 'block' : 'inline')
      : layout

    if (layout === 'block') {
      style.section.flexDirection = 'column'
      style.section.alignItems = 'stretch'
      style.button.maxWidth = '400px'
    } else {
      style.section.flexDirection = 'row'
    }

    eventElements = events.map(event => {
      return (
        <button
          key={event}
          style={style.button}
          onClick={() => send(event)}
        >{event}</button>
      )
    })
  }

  return (
    <section style={style.section}>
      <React.Fragment>{eventElements}</React.Fragment>
    </section>
  )
}


const AtomicStateView = ({ title, send, events = [], children = null }) => {
  const style = {
    state: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      alignItems: 'center',
      alignContent: 'stretch',
      height: '100%'
    },
    header: {
      padding: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      textAlign: 'center'
    }
  }
  return (
    <div style={style.state}>
      <header style={style.header}>{ title }</header>
      <EventsView events={events} send={send} />
      {
        children ? <div>{children}</div> : null
      }
    </div>
  )
}

const TransientStateView = ({ title, events, send }) => {
  const style = {
    container: {
      position: 'absolute',
      top: 0,
      left: 0,
      zIndex: '900',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',
      width: '100vw',
      background: 'rgba(0,0,0,0.35)'
    },
    state: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      maxWidth: '350px',
      height: '250px',
      borderStyle: 'dashed',
      borderRadius: '8px',
      borderColor: 'black',
      borderThickness: '2px',
      background: 'white'
    },
    header: {
      padding: '8px',
      fontSize: '14px',
      fontWeight: 'bold',
      textAlign: 'center'
    }
  }
  return (
    <div style={style.container}>
      <div style={style.state}>
        <header className='State-header' style={style.header}>{ title }</header>
        <EventsView events={events} send={send} layout='select' />
      </div>
    </div>
  )
}

const fromStateValueToPaths = (stateValue) => {
  if (typeof stateValue === 'string') {
    return [ stateValue ]
  }

  return Object.keys(stateValue).map(key => {
      const res = fromStateValueToPaths(stateValue[key])
      return res.length ? res.map(r => [ key ].concat(r)) : [ key ]
    }).reduce((a, b) => a.concat(b), [])
}

const renderStateView = ({ service, currState, prevState, stateComponentMap, parentStatePath = null }) => {
  if (!currState) return null

  // NOTE: parentStatePath is used to indicate the parent state that has been
  // overridden by the developer by a React component. This means that WireStateView
  // has been called to further render the React component's children as
  // related to the state machine. Using parentStatePath (which is a state node path)
  // we will know where to stop attempting to look up further state overrides
  // by the developer furhter in the state hierarchy (i.e. we don't go up the
  // hierarchy past parentStatePath).

  const send = service.send.bind(service)
  const machine = service.machine
  const paths = [ machine.id ].concat(currState.toStrings().map(path => `${machine.id}.${path}`))
  const k = paths.indexOf(parentStatePath)
  const hierarchyToSearch = paths.slice(k + 1)
  const match = hierarchyToSearch.filter(path => (path in stateComponentMap)).shift()

  if (parentStatePath && match) {
    const ViewOverride = stateComponentMap[match]
    return (
      <ViewOverride
        send={send}
        currState={currState}
        prevState={prevState}
        wirestate={
          () => (<WireStateView parentStatePath={match} />)
        }
      />
    )
  }

  const stateNodes = service.machine.getStateNodes(currState)
  const currStateNode = stateNodes.slice(-1).pop()
  const parentStateNode = currStateNode.parent
  const events = currState.nextEvents
  const title = currStateNode.id

  // Parallel
  if (stateNodes.some(x => x.type === 'parallel')) {
    // We can't call currState.toStrings() since this gives us ancestor paths as well.
    // All we're interested in is leaf paths.
    const strings = fromStateValueToPaths(currState.value).map(x => x.join('.'))
    // Find the last parallel state node
    const parallelStateNode = stateNodes.find(x => x.type === 'parallel')
    const p = strings.indexOf(parallelStateNode.path.join('.'))
    const paths = strings.slice(p + 1)

    const style = {
      state: {
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        alignContent: 'stretch',
        height: '100%'
      },
      row: {
        flexGrow: 1,
        width: '100%',
        borderBottom: '2px solid black'
      }
    }

    return (
      <div style={style.state}>
        <React.Fragment>{
          paths.map(path => {
            if (path.endsWith('?')) {
              const e = service.machine.getStateNodeByPath(path).events
              return (
                <div key={path} style={style.row}>
                  <AtomicStateView title={path.split('.').slice(0, -1)} send={send}>
                    <TransientStateView title={path} events={e} send={send} />
                  </AtomicStateView>
                </div>
              )
            } else {
              // Don't show psuedo events from transient states (i.e. ends with '?').
              return (
                <div key={path} style={style.row}>
                  <AtomicStateView title={path} events={events.filter(e => !e.endsWith('?'))} send={send} />
                </div>
              )
            }
          })
        }</React.Fragment>
      </div>
    )
  }

  // Transient
  if (currStateNode.id.endsWith('?')) {
    if (process.env.NODE_ENV === 'development') {
      if (parentStateNode) {
        return (
          <AtomicStateView title={parentStateNode.id} send={send}>
            <TransientStateView title={title} events={events} send={send} />
          </AtomicStateView>
        )
      } else {
        return (<TransientStateView title={title} events={events} send={send} />)
      }
    } else {
      if (parentStateNode) {
        return (
          <AtomicStateView title={parentStateNode.id} send={send} />
        )
      } else {
        return null
      }
    }
  }

  // Atomic
  if (currStateNode.type === 'atomic') {
    return (<AtomicStateView title={title} events={events} send={send} />)
  }
}

export const WireStateView = ({ parentStatePath = '' }) => {
  return (
    <WireStateContext.Consumer>{
      value => renderStateView(Object.assign({}, value, { parentStatePath }))
    }</WireStateContext.Consumer>
  )
}
