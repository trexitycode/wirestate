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
