const makeScanner = (str) => {
  let i = 0
  let c = str[i]
  let line = 1
  let column = 0

  const reset = () => {
    i = 0
    c = str[i]
    line = 1
    column = 0
  }

  const advance = (step = 1) => {
    for (let k = 0; k < step; k += 1) {
      let char = str[i + k]
      if (char === '\n') {
        line += 1
        column = 0
      } else {
        column += 1
      }
    }

    i += step
    c = str[i]

    return c
  }

  const look = (text) => {
    return str.substr(i, text.length) === text
  }

  return {
    get line ()  { return line },
    get column () { return column },
    get index () { return i },
    get c () { return c },
    get text () { return str },
    reset,
    advance,
    look
  }
}

export const makeTokenizer = (str) => {
  const scanner = makeScanner(str)
  const commentToken = {
    canRead () { return scanner.c === '#' },
    read () {
      let buffer = scanner.c

      let c = scanner.advance()
      while (!scanner.look('\n') && !scanner.look('\r\n')) {
        buffer += c
        c = scanner.advance()
      }

      return {
        type: 'comment',
        value: buffer.slice(1),
        raw: buffer
      }
    }
  }

  const newlineToken = {
    canRead () { return scanner.c === '\n' || scanner.look('\r\n') },
    read () {
      let nl = scanner.c
      if (scanner.look('\r\n')) {
        nl += scanner.advance()
      }

      scanner.advance()

      return {
        type: 'newline',
        value: nl,
        raw: nl
      }
    }
  }

  const whitespaceToken = {
    canRead () { return scanner.c === ' ' },
    read () {
      scanner.advance()
      return {
        type: 'whitespace',
        value: ' ',
        raw: ' '
      }
    }
  }

  const stringToken = {
    canRead () { return scanner.c === '"' || scanner.c === "'" },
    read () {
      let buffer = ''
      let quote = scanner.c
      let isTerminated = false
      let c = scanner.advance()

      while (c) {
        if (c === '\n' || scanner.look('\r\n') || c === '\r') {
          break
        } else if (c === '\\') {
          c = scanner.advance()
          if (!c) {
            isTerminated = false
            break
          }
          switch (c) {
            case 'b':
              c = '\b'
              break
            case 'f':
              c = '\f'
              break
            case 'n':
              c = '\n'
              break
            case 'r':
              c = '\r'
              break
            case 't':
              c = '\t'
              break
            case 'u':
              if (scanner.index >= text.len) {
                isTerminated = false
              }
              c = parseInt(scanner.text.substr(scanner.index + 1, 4), 16)
              if (!isFinite(c) || c < 0) {
                isTerminated = false
              }
              c = String.fromCharCode(c)
              scanner.advance(4)
              break
          }
          buffer += c
          c = scanner.advance()
        } else if (c === quote) {
          isTerminated = true
          c = scanner.advance()
          break
        } else {
          buffer += c
          c = scanner.advance()
        }
      }

      if (!isTerminated) {
        throw new Error(`LexicalError: Unterminated string "${buffer}"`)
      }

      return {
        type: 'string',
        value: buffer,
        raw: `${quote}${buffer}${quote}`
      }
    }
  }

  const operatorToken = {
    canRead () { return scanner.look('->') },
    read () {
      scanner.advance(2)
      return {
        type: 'operator',
        value: '->',
        raw: '->'
      }
    }
  }

  const symbolToken = {
    symbols: '?&*!',
    canRead () { return this.symbols.indexOf(scanner.c) >= 0 },
    read () {
      const c = scanner.c
      scanner.advance()
      return {
        type: 'symbol',
        value: c,
        raw: c
      }
    }
  }

  const identifierToken = {
    canRead () {
      const c = scanner.c
      return (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        c === '_' ||
        c === '-'
    },
    read () {
      let id = ''
      let c = scanner.c
      while ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === ' ' || c === '.' || c === '_' || c === '-') {
        if (c === ' ') {
          const k = scanner.text[scanner.index + 1]
          if ((k >= 'a' && k <= 'z') || (k >= 'A' && k <= 'Z') || (k >= '0' && k <= '9')) {
            id += c + k
            c = scanner.advance(2)
          } else {
            break
          }
        } else {
          id += c
          c = scanner.advance()
        }
      }

      return {
        type: 'identifier',
        value: id.trim(),
        raw: id
      }
    }
  }

  const directiveToken = {
    canRead () {
      const i = scanner.index
      const text = scanner.text
      const c = scanner.c
      return c === '@' &&
        (text[i + 1] >= 'a' && text[i + 1] <= 'z') ||
        (text[i + 1] >= 'A' && text[i + 1] <= 'Z')
    },
    read () {
      let buffer = '@'

      let c = scanner.advance()
      while ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
        buffer += c
        c = scanner.advance()
      }

      return {
        type: 'directive',
        value: buffer,
        raw: buffer
      }
    }
  }

  const tokenReaders = [
    commentToken,
    newlineToken,
    whitespaceToken,
    stringToken,
    directiveToken,
    operatorToken,
    symbolToken,
    identifierToken
  ]
  const tokenReaderCount = tokenReaders.length

  const tokenize = () => {
    scanner.reset()
    let tokens = []
    let line = scanner.line
    let column = scanner.column
    let noMatch = true
    let token = null

    while (scanner.c) {
      line = scanner.line
      column = scanner.column
      noMatch = true

      for (let t = 0; t < tokenReaderCount && noMatch; t += 1) {
        if (tokenReaders[t].canRead()) {
          token = tokenReaders[t].read()
          token.line = line
          token.column = column
          tokens.push(token)
          noMatch = false
        }
      }

      if (noMatch) {
        throw new Error(
          `LexicalError: Unknown charcter: ${scanner.c} [L:${line} C:${column}]`
        )
      }
    }

    return tokens
  }

  return { tokenize }
}







export function tokenize (str) {
  let i = 0
  let c = str[i]
  let line = { index: 0, number: 1 }
  let tokens = []

  const advance = (step = 1) => {
    i += step
    c = str[i]
    return c
  }

  const lookAhead = (text) => {
    return str.substr(i, text.length) === text
  }

  while (c) {
    // Comment
    if (c === '#') {
      let buffer = c
      let start = i
      c = advance()
      while (c && c !== '\n' && c !== '\r') {
        buffer += c
        c = advance()
      }

      tokens.push({
        type: 'comment',
        index: start,
        line: line.number,
        column: Math.max(0, start - line.index - 1),
        value: buffer.slice(1),
        raw: buffer
      })
    // Newline
    } else if (c === '\n' || lookAhead('\r\n')) {
      let value = c
      line = { index: i, number: line.number + 1 }
      if (c === '\r') value += advance()
      tokens.push({
        type: 'newline',
        index: line.index,
        line: line.number - 1,
        column: Math.max(0, i - line.index - 1),
        value,
        raw: value
      })
      advance()
    // Whitespace
    } else if (c === ' ') {
      tokens.push({
        type: 'whitespace',
        index: i,
        line: line.number,
        column: Math.max(0, i - line.index - 1),
        value: ' ',
        raw: ' '
      })
      advance()
    // String
    } else if (c === '"' || c === "'") {
      let buffer = ''
      let startIndex = i
      let startLine = line
      let quote = c
      let isTerminated = false

      c = advance()

      while (c) {
        if (c === '\n' || lookAhead('\r\n') || c === '\r') {
          break
        } else if (c === '\\') {
          c = advance()
          if (!c) {
            isTerminated = false
            break
          }
          switch (c) {
            case 'b':
              c = '\b'
              break
            case 'f':
              c = '\f'
              break
            case 'n':
              c = '\n'
              break
            case 'r':
              c = '\r'
              break
            case 't':
              c = '\t'
              break
            case 'u':
              if (ctx.index >= text.len) {
                isTerminated = false
              }
              c = parseInt(text.substr(ctx.index + 1, 4), 16)
              if (!isFinite(c) || c < 0) {
                isTerminated = false
              }
              c = String.fromCharCode(c)
              ctx.advance(4)
              break
          }
          buffer += c
          c = advance()
        } else if (c === quote) {
          isTerminated = true
          c = advance()
          break
        } else {
          buffer += c
          c = advance()
        }
      }

      if (!isTerminated) {
        throw new Error(`LexicalError: Unterminated string "${buffer}" [L:${startLine.number} C:${startIndex - line.index}]`)
      }

      tokens.push({
        type: 'string',
        index: startIndex,
        line: startLine.number,
        column: Math.max(0, startIndex - line.index - 1),
        value: buffer,
        raw: quote + buffer + quote
      })
    // Operators: ->
    } else if (lookAhead('->')) {
      tokens.push({
        type: 'operator',
        index: i,
        line: line.number,
        column: Math.max(0, i - line.index - 1),
        value: '->',
        raw: '->'
      })
      advance(2)
    // Keywords
    } else if (lookAhead('prefix')) {
      tokens.push({
        type: 'keyword',
        index: i,
        line: line.number,
        column: Math.max(0, i - line.index - 1),
        value: 'prefix',
        raw: 'prefix'
      })
      advance(6)
    // Directive
    } else if (c === '@' && (str[i + 1] >= 'a' && str[i + 1] <= 'z') || (str[i + 1] >= 'A' && str[i + 1] <= 'Z')) {
      let id = '@'
      let start = i

      advance()

      while ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
        id += c
        c = advance()
      }

      tokens.push({
        type: 'directive',
        index: start,
        line: line.number,
        column: Math.max(0, start - line.index - 1),
        value: id,
        raw: id
      })
    // Identifier
    } else if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === '_' || c === '-' || c === '/') {
      let id = ''
      let start = i
      while ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === ' ' || c === '.' || c === '_' || c === '-' || c === '/' || c === ':') {
        if (c === ' ') {
          const k = str[i + 1]
          if ((k >= 'a' && k <= 'z') || (k >= 'A' && k <= 'Z') || (k >= '0' && k <= '9')) {
            id += k + c
            c = advance()
          } else {
            break
          }
        } else {
          id += c
          c = advance()
        }
      }

      tokens.push({
        type: 'identifier',
        index: start,
        line: line.number,
        column: Math.max(0, start - line.index - 1),
        value: id.trim(),
        raw: id
      })
    // Symbols
    } else if (c === '?' || c === '&' || c === '*' || c === '!') {
      tokens.push({
        type: 'symbol',
        index: i,
        line: line.number,
        column: Math.max(0, i - line.index - 1),
        value: c,
        raw: c
      })
      advance()
    // Lexical Error!
    } else {
      throw new Error(`LexicalError: Unrecognized character "${c}" [L:${line.number} C:${i - line.index}]`)
    }
  }

  return tokens
}
