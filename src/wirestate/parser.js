const makeScanner = (tokens) => {
  // Remove the comments
  tokens = tokens.filter(t => t.type !== 'comment')

  let i = 0
  let token = tokens[i]

  const reset = () => {
    i = 0
    token = tokens[i]
  }

  const syntaxError = (message = null) => {
    if (token) {
      message = message || `Unexpected token ${token.type}:"${token.value}"`
      return Object.assign(
        new Error(`SyntaxError${message ? ': ' + message : ''} near [L:${token.line} C:${token.column}]`)
      )
    } else {
      return new Error(`SyntaxError: Unexpected end of input`)
    }
  }

  const advance = (step = 1) => {
    i += step
    return token = tokens[i]
  }

  const look = (patterns) => {
    patterns = [].concat(patterns)
    const patternCount = patterns.length
    let patternDoesMatch = true
    let t = 0

    for (let p = 0; p < patternCount && patternDoesMatch; p += 1) {
      const pattern = patterns[p]
      const token = tokens[i + t]

      if (!token) {
        patternDoesMatch = false
        break
      }

      if (typeof pattern === 'string') {
        // Wildcard token type (0 or more)
        if (pattern.endsWith('*')) {
          if (token.type === pattern.substr(0, pattern.length - 1)) {
            p -= 1
            t += 1
          }
          patternDoesMatch = true
        // Zero or one token type (0 or 1)
        } else if (pattern.endsWith('?')) {
          if (token.type === pattern.substr(0, pattern.length - 1)) {
            t += 1
          }
          patternDoesMatch = true
        } else {
          t += 1
          patternDoesMatch = token.type === pattern
        }
      } else if (Object(pattern) === pattern) {
        t += 1
        patternDoesMatch = Object
          .keys(pattern)
          .every(key => token[key] === pattern[key])
      } else {
        throw new Error('Expected a string or token mask as a pattern')
      }
    }

    return patternDoesMatch
  }

  const consume = (pattern) => {
    if (look(pattern)) {
      const t = token
      advance()
      return t
    } else {
      throw syntaxError()
    }
  }

  return {
    get token () { return token },
    get index () { return i },
    advance,
    look,
    reset,
    consume,
    syntaxError
  }
}

const implicitStateNode = (scanner, id) => {
  let node = {
    type: 'state',
    id,
    initial: true,
    final: true,
    parallel: false,
    stateType: 'atomic',
    indent: 0,
    states: [],
    transitions: [],
    line: 1,
    column: 0
  }
  let indent = 0

  while (scanner.token) {
    if (scanner.look('identifier')) {
      // Is indentation too much?
      if (indent > 0) {
        throw scanner.syntaxError(`Expected indentation 0 but got ${indent}`)
      }

      // event? ->
      // event! ->
      if (scanner.look([ 'identifier', 'symbol?', 'whitespace*', { value: '->' } ])) { // a transition
        indent = 0
        node.transitions.push(transitionNode(scanner))
      } else if (scanner.look('identifier')) { // another state
        // child state
        node.states.push(stateNode(scanner, { indentLevel: 0 }))
        indent = 0
      } else {
        throw scanner.syntaxError()
      }
    // Is the next token directive, transition or child state?
    } else if (scanner.look('directive')) { // a directive
      // Is indentation too much?
      if (indent > 0) {
        throw scanner.syntaxError(`Expected indentation 0 but got ${indent}`)
      }

      indent = 0
      node.states.push(directiveNode(scanner))
    } else if (scanner.look('newline')) {
      indent = 0
      scanner.advance()
    } else if (scanner.look('whitespace')) {
      indent += 1
      scanner.advance()
    } else {
      throw scanner.syntaxError()
    }
  }

  while (scanner.token) {
    if (scanner.look('identifier')) {
      if (indent === 0) {
        node.states.push(stateNode(scanner, { indentLevel: 0 }))
      } else {
        throw scanner.syntaxError('Unexpected indent')
      }
    } else if (scanner.look('newline')) {
      indent = 0
      scanner.advance()
    } else if (scanner.look('whitespace')) {
      indent += 1
      scanner.advance()
    } else {
      throw scanner.syntaxError()
    }
  }
  return node
}

const stateChartNode = (scanner) => {
  let node = {
    type: 'statechart',
    states: []
  }
  let indent = 0

  while (scanner.token) {
    if (scanner.look('identifier')) {
      if (indent === 0) {
        node.states.push(stateNode(scanner, { indentLevel: 0 }))
      } else {
        throw scanner.syntaxError('Unexpected indent')
      }
    } else if (scanner.look('newline')) {
      indent = 0
      scanner.advance()
    } else if (scanner.look('whitespace')) {
      indent += 1
      scanner.advance()
    } else {
      throw scanner.syntaxError()
    }
  }
  return node
}

const stateNode = (scanner, { indentLevel }) => {
  const idToken = scanner.consume('identifier')
  let node = {
    type: 'state',
    id: idToken.value,
    stateType: 'atomic',
    initial: false,
    final: false,
    indent: indentLevel,
    transitions: [],
    states: [],
    line: idToken.line,
    column: idToken.column
  }
  let indent = 0

  let symbols = []
  while (scanner.look('symbol')) {
    symbols.push(scanner.consume('symbol'))
  }

  // (all) *?&!
  // (valid co-symbols) &!*
  // (valid co-symbols) ?*

  if (symbols.find(s => s.value === '?')) {
    if (symbols.find(s => ['!', '&'].indexOf(s.value) >= 0)) {
      throw scanner.syntaxError('Unsupported state symbol')
    }
  }

  symbols.forEach(s => {
    if (s.value === '*') node.initial = true
    if (s.value === '!') {
      node.final = true
      node.id += '!'
    }
    if (s.value === '&') node.parallel = true
    if (s.value === '?') {
      node.stateType = 'transient'
      node.id += '?'
    }
  })

  while (scanner.token) {
    if (scanner.look('identifier')) {
      // Is indentation too much?
      if (indent > indentLevel + 2) {
        throw scanner.syntaxError(`Expected indentation ${indentLevel + 2} but got ${indent}`)
      }

      // event? ->
      // event! ->
      if (scanner.look([ 'identifier', 'symbol?', 'whitespace*', { value: '->' } ])) { // a transition
        if (indent < indentLevel) {
          throw scanner.syntaxError('Unexpected dedentation')
        }
        indent = 0
        node.transitions.push(transitionNode(scanner))
      } else if (scanner.look('identifier')) { // another state
        if (indent <= indentLevel) { // ancestor state
          // Backtrack so the ancestor parent will re-read the indentation
          scanner.advance(-indent)
          indent = 0
          break
        } else { // child state
          node.states.push(stateNode(scanner, { indentLevel: indent }))
          indent = 0
        }
      } else {
        throw scanner.syntaxError()
      }
    // Is the next token directive, transition or child state?
    } else if (scanner.look('directive')) { // a directive
      // Is indentation too much?
      if (indent > indentLevel + 2) {
        throw scanner.syntaxError(`Expected indentation ${indentLevel + 2} but got ${indent}`)
      }

      if (indent < indentLevel) {
        throw scanner.syntaxError('Unexpected dedentation')
      }

      indent = 0
      node.states.push(directiveNode(scanner))
    } else if (scanner.look('newline')) {
      indent = 0
      scanner.advance()
    } else if (scanner.look('whitespace')) {
      indent += 1
      scanner.advance()
    } else {
      throw scanner.syntaxError()
    }
  }

  return node
}

const transitionNode = (scanner) => {
  const eventToken = scanner.consume('identifier')
  let event = eventToken.value

  if (scanner.look('symbol')) {
    const symbolToken = scanner.consume('symbol')
    if (symbolToken.value === '?' || symbolToken.value === '!') {
      event += symbolToken.value
    } else {
      throw scanner.syntaxError()
    }
  }

  while (scanner.look('whitespace')) {
    scanner.consume('whitespace')
  }

  scanner.consume({ value: '->' })

  while (scanner.look('whitespace')) {
    scanner.consume('whitespace')
  }

  let target = scanner.consume('identifier').value

  if (scanner.look('symbol')) {
    const symbolToken = scanner.consume('symbol')
    if (symbolToken.value === '?' || symbolToken.value === '!') {
      target += symbolToken.value
    } else {
      throw scanner.syntaxError()
    }
  }

  let node = {
    type: 'transition',
    event,
    target,
    line: eventToken.line,
    column: eventToken.column
  }

  return node
}

const directiveNode = (scanner) => {
  const typeToken = scanner.consume('directive')

  while (scanner.look('whitespace')) {
    scanner.consume('whitespace')
  }

  let node = null

  if (typeToken.value === '@include') {
    node = {
      type: 'directive',
      directiveType: typeToken.value,
      fileName: scanner.consume('string').value,
      line: typeToken.line,
      column: typeToken.column
    }
  } else {
    node = {
      type: 'directive',
      directiveType: typeToken.value,
      line: typeToken.line,
      column: typeToken.column
    }
  }

  return node
}

export const makeParser = () => {
  const parse = (tokens, id = 'statechart') => {
    const scanner = makeScanner(tokens)
    return implicitStateNode(scanner, id)
  }
  return { parse }
}
