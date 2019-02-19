export function parse (tokens) {
  let i = 0
  let t = tokens[i]

  // Remove comments
  tokens = tokens.filter(t => t.type !== 'comment')

  const syntaxError = ({ message = '', token = t }) => {
    if (t) {
      message = message || `Unexpected token ${token.type}:${token.value}`
      return Object.assign(
        new Error(`SyntaxError: ${message} [L:${token.line} C:${token.column}]`),
        {
          line: token.line,
          column: token.column
        }
      )
    } else {
      return new Error('Unexpected end of input')
    }
  }
  const advance = (step = 1) => {
    i += step
    t = tokens[i]
    return t
  }
  const lookAhead = (tok) => {
    return !!t && (t.type === tok || t.type === tok.type || t.value === tok.value)
  }
  const consumeWhitespace = () => {
    while (t) {
      if (t.type === 'whitespace') t = advance()
      else break
    }
  }
  const consumeWhitespaceAndNewLines = () => {
    while (t) {
      if (t.type === 'newline') {
        t = advance()
      } else if (t.type === 'whitespace') {
        t = advance()
      } else {
        break
      }
    }
  }
  const consume = (tok) => {
    while (t) {
      if (t.type === 'newline') {
        t = advance()
      } else if (t.type === 'whitespace') {
        t = advance()
      } else if (lookAhead(tok)) {
        const tt = t
        advance()
        return tt
      } else {
        break
      }
    }

    throw syntaxError({
      message: `Expected ${tok.type || tok.value || tok} but got ${t.type}:${t.value}`,
      token: t
    })
  }
  const getIndentLevelOfToken = (token) => {
    let indentLevel = 0
    let t = tokens.indexOf(token) - 1
    while (t >= 0) {
      if (tokens[t].type === 'newline') {
        break
      } else if (tokens[t].type === 'whitespace') {
        t -= 1
        if (tokens[t].type === 'whitespace') {
          indentLevel += 1
          t -= 1
        } else {
          indentLevel = 0
          break
        }
      } else {
        indentLevel = 0
        break
      }
    }
    return indentLevel
  }

  if (tokens.length === 0) return null

  let stateNodes = []
  let machineNode = { states: [] }
  const getStateNodeAtIndentLevel = (indentLevel) => {
    return stateNodes
      .filter(stateNode => stateNode.indentLevel === indentLevel)
      .pop()
  }

  advance()
  /* eslint-disable-next-line */
  while (t) {
    consumeWhitespaceAndNewLines()
    const start = t

    if (t && t.type === 'identifier') {
      const idToken = consume('identifier')
      const indentLevel = getIndentLevelOfToken(idToken)
      const prev = null
      let id = idToken.value

      // If this is a transition then we need to read this symbol and add it to
      // the event name.
      if (t && t.value === '?') {
        prev = { t, i }
        id += consume('symbol').value
      }

      // A transition encountered!
      if (lookAhead('whitespace')) {
        consumeWhitespace()
        consume({ value: '->' })
        consumeWhitespace()

        const event = id
        let target = consume('identifier').value
        if (t && (t.value === '?' || t.value === '!')) {
          target += t.value
          consume('symbol')
        }
        const parentStateNode = getStateNodeAtIndentLevel(indentLevel - 1)
        if (parentStateNode) {
          if (parentStateNode.transitions.some(t => t.event === event)) {
            throw new Error(`Cannot have duplicate transitions: ${event}`)
          }
          parentStateNode.transitions.push({
            event,
            target,
            line: start.line,
            column: start.column
          })
        } else {
          throw syntaxError({
            message: 'Unexpected transition',
            token: start
          })
        }

        consumeWhitespaceAndNewLines()

        // Cannot have a nested/indented transition or state following a transition
        if (t && t.type === 'identifier') {
          const id = t
          const nextIndentLevel = getIndentLevelOfToken(id)
          if (nextIndentLevel > indentLevel) {
            throw syntaxError({
              message: `Expected indent of ${indentLevel} or less`
            })
          }
        }

        continue
      }

      // If we get here then we want to unconsume the '?' if it was consumed
      if (prev) {
        t = prev.t
        i = prev.i
        // Also remove the '?' that was added to the ID token
        id = idToken.value
      }

      // A state node encountered!
      const stateNode = {
        id,
        indentLevel,
        initial: false,
        final: true,
        type: 'atomic',
        transitions: [],
        states: [],
        line: start.line,
        column: start.column
      }
      stateNodes.push(stateNode)

      // Consume first symbol for this state node
      if (t && t.type === 'symbol') {
        const symbol = consume('symbol').value
        switch (symbol) {
          case '&':
            stateNode.type = 'parallel'
            break
          case '?':
            stateNode.id += '?'
            stateNode.type = 'transient'
            break
          case '*':
            stateNode.initial = true
            break
          case '!':
            stateNode.id += '!'
            stateNode.final = true
            break
          default:
            throw syntaxError()
        }
      }

      // first symbol | can be followed by (order independent)
      // * | &! or ?
      // ! | &*
      // & | *!
      // ? | *

      // If a symbol was consumed then read the next symbol if there is one
      if (stateNode.initial) {
        if (t && t.type === 'symbol') {
          const symbol = consume('symbol').value
          switch (symbol) {
            case '&':
              stateNode.type = 'parallel'
              if (t && t.value === '!') {
                consume('symbol')
                stateNode.id += '!'
                stateNode.initial = true
              } else if (t) {
                throw syntaxError()
              }
              break
            case '!':
              stateNode.type = 'parallel'
              if (t && t.value === '&') {
                consume('symbol')
                stateNode.type = 'parallel'
              } else if (t) {
                throw syntaxError()
              }
              break
            case '?':
              stateNode.id += '?'
              stateNode.type = 'transient'
              break
            default:
              throw syntaxError()
          }
        }
      } else if (stateNode.final) {
        if (t && t.type === 'symbol') {
          const symbol = consume('symbol').value
          switch (symbol) {
            case '&':
              stateNode.type = 'parallel'
              break
            case '*':
              stateNode.initial = true
              break
            default:
              throw syntaxError()
          }
        }
      } else if (stateNode.type === 'parallel') {
        if (t && t.type === 'symbol') {
          const symbol = consume('symbol').value
          switch (symbol) {
            case '*':
              stateNode.initial = true
              break
            case '!':
              stateNode.id += '!'
              stateNode.final = true
              break
            default:
              throw syntaxError()
          }
        }
      } else if (stateNode.type === 'transient') {
        if (t && t.type === 'symbol') {
          const symbol = consume('symbol').value
          switch (symbol) {
            case '*':
              stateNode.initial = true
              break
            default:
              throw syntaxError()
          }
        }
      }

      const parentStateNode = getStateNodeAtIndentLevel(indentLevel - 1) || machineNode
      if (parentStateNode.type === 'atomic') {
        parentStateNode.type = 'compound'
      }
      if (parentStateNode.states.some(s => s.id === stateNode.id)) {
        throw new Error(`Cannot have duplicate states: ${stateNode.id}`)
      }
      if (stateNode.initial && parentStateNode.states.some(s => s.initial)) {
        throw new Error(`Cannot have mulitple initial states: ${stateNode.id}`)
      }

      parentStateNode.states.push(stateNode)

    // A directive encountered!
    } else if (t && t.type === 'directive') {
      const directiveToken = consume('directive')
      const indentLevel = getIndentLevelOfToken(directiveToken)
      const directiveName = directiveToken.value
      let directiveStateNode = {
        directive: true,
        type: directiveName,
        line: start.line,
        column: start.column
      }

      if (directiveName === '@include') {
        consumeWhitespace()
        directiveStateNode.fileName = consume('string').value
        consumeWhitespace()

        if (lookAhead({ value: 'prefix' })) {
          consume({ type: 'keyword' })
          consumeWhitespace()
          directiveStateNode.prefix = consume('identifier').value
        }
      }

      const parentStateNode = getStateNodeAtIndentLevel(indentLevel - 1)
      if (parentStateNode) {
        parentStateNode.states.push(directiveStateNode)
      } else {
        throw syntaxError({
          message: 'Unexpected directive',
          token: start
        })
      }
    } else if (t) {
      throw syntaxError()
    }
  }


  // Now we do some light post processing on the statechart

  const verifyTransitions = (stateNode) => {
    const badEvents = stateNode.transitions.filter(({ target }) => {
      return !stateNodes.find(s => s.id === target)
    })
    if (badEvents.length) {
      throw new Error(`Nothing found for state ID ${badEvents[0].target}`)
    }
  }
  const ensureFirstStateIsInital = (stateNode) => {
    if (stateNode.states.length && !stateNode.states.some(s => s.initial)) {
      stateNode.states[0].initial = true
    }
  }

  ensureFirstStateIsInital(machineNode)
  stateNodes.forEach(stateNode => {
    verifyTransitions(stateNode)
    ensureFirstStateIsInital(stateNode)
  })

  return machineNode
}
