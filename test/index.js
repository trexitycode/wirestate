import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Interpreter, State } from '../src/interpreter'
import { WireStateApp, WireStateView } from '../src/bindings/react'
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
