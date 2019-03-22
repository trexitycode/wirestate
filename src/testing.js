import { interpret, Machine } from 'xstate'
import * as React from 'react'
import * as ReactDom from 'react-dom'
import { WireStateContext, WireStateView } from './wirestate/bindings'

const stateComponentMap = {
  'App': ({ currState, send, wirestate }) => {
    const style = {
      height: '100%',
      background: 'red'
    }

    return (<div style={style}>{wirestate()}</div>)
  }
}

const stateServiceMap = {
  'App.Loading Screen.Loading App State': (send) => {
    // load app state
    // set mobx
    // send('loaded')
    // set mobx error message
    // send('fail)
  }
}

const machine = Machine({
  id: 'App',
  initial: 'Go',
  states: {
    Go: {
      id: 'Go',
      initial: 'Does token exist?',
      states: {
        'No Errors': {
          id: 'No Errors',
          type: 'parallel',
          states: {
            One: {
              id: 'One',
              on: { 'go': '#App.Go' }
            },
            Two: {
              id: 'Two',
              initial: 'What time is it?',
              states: {
                'What time is it?': {
                  id: 'What time is it?',
                  on: {
                    'Is it noon?': '#App.Go'
                  }
                }
              }
            },
            Three: {
              id: 'Three',
              on: { 'go': '#App.Go' }
            }
          }
        },
        'No Token Error': {
        },
        'Does token exist?': {
          id: 'Does token exist?',
          on: {
            'token exists?': 'No Errors',
            'token does not exist?': 'No Errors'
          }
        }
      }
    }
  }
})
const service = interpret(machine).start()

const Root = () => {
  const [currState, setCurrState] = React.useState(service.state)
  const [prevState, setPrevState] = React.useState(null)

  React.useMemo(() => {
    service.onTransition(() => {
      setPrevState(currState)
      setCurrState(service.state)
    })
  }, [])

  return (
    <WireStateContext.Provider value={{ service, currState, prevState, stateComponentMap }}>
      <WireStateView />
    </WireStateContext.Provider>
  )
}

ReactDom.render(<Root />, document.getElementById('app'))
