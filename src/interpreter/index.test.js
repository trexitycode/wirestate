import { Interpreter, State } from './index'

const config = {
  name: 'Root',
  states: [
    {
      name: 'MyApp',
      initial: true,
      // parallel: true,
      transitions: [
        { event: 'done.state.MyApp', target: 'Contact' }
      ],
      states: [
        {
          name: 'Home',
          transitions: [
            { event: 'about', target: 'About Contact' }
          ]
        },
        {
          name: 'About'
        },
        {
          name: 'Contact'
        }
      ]
    }
  ]
}

const s = new Interpreter()
s.onTransition((configuration) => {
  console.log('configuration:', configuration)
})
s.onEvent(event => {
  console.log('event sent:', event)
})
const state = State.create(config)
s.start(state)
s.send('about')
