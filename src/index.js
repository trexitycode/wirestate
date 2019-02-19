import { interpret, Machine } from 'xstate'
import * as React from 'react'
import * as ReactDom from 'react-dom'
import { WireStateContext, WireStateView } from './wirestate'

const stateComponentMap = {
  // 'App': ({ currState, send, wirestate }) => {
  //   const style = {
  //     height: '100%',
  //     background: 'red'
  //   }
  //   return <div style={style}>{wirestate()}</div>
  // }
}

const machine = Machine({
  id: 'App',
  initial: 'Go',
  states: {
    Go: {
      initial: 'Does token exist?',
      states: {
        'No Errors': {
          type: 'parallel',
          states: {
            One: {
              on: { 'go': '#App.Go' }
            },
            Two: {
              initial: 'What time is it?',
              states: {
                'What time is it?': {
                  on: {
                    'Is it noon?': '#App.Go'
                  }
                }
              }
            },
            Three: {
              on: { 'go': '#App.Go' }
            }
          }
        },
        'No Token Error': {
        },
        'Does token exist?': {
          on: {
            'yes?': 'No Errors',
            'no?': 'No Errors'
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

  service.onTransition(() => {
    setPrevState(currState)
    setCurrState(service.state)
  })

  return (
    <WireStateContext.Provider value={{ service, currState, prevState, stateComponentMap }}>
      <WireStateView />
    </WireStateContext.Provider>
  )
}

ReactDom.render(<Root />, document.getElementById('app'))
