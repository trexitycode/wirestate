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
    get line () { return line },
    get column () { return column },
    get index () { return i },
    get c () { return c },
    get text () { return str },
    reset,
    advance,
    look
  }
}

export const makeTokenizer = () => {
  const commentToken = {
    canRead (scanner) { return scanner.c === '#' },
    read (scanner) {
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
    canRead (scanner) { return scanner.c === '\n' || scanner.look('\r\n') },
    read (scanner) {
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
    canRead (scanner) { return scanner.c === ' ' },
    read (scanner) {
      scanner.advance()
      return {
        type: 'whitespace',
        value: ' ',
        raw: ' '
      }
    }
  }

  const stringToken = {
    canRead (scanner) { return scanner.c === '"' || scanner.c === "'" },
    read (scanner) {
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
              if (scanner.index >= scanner.text.len) {
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
    canRead (scanner) { return scanner.look('->') },
    read (scanner) {
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
    canRead (scanner) { return this.symbols.indexOf(scanner.c) >= 0 },
    read (scanner) {
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
    canRead (scanner) {
      const c = scanner.c
      return (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        c === '_' ||
        c === '-'
    },
    read (scanner) {
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
    canRead (scanner) {
      const i = scanner.index
      const text = scanner.text
      const c = scanner.c
      return c === '@' &&
        ((text[i + 1] >= 'a' && text[i + 1] <= 'z') ||
        (text[i + 1] >= 'A' && text[i + 1] <= 'Z'))
    },
    read (scanner) {
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

  const tokenize = (text) => {
    const scanner = makeScanner(text)
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
        if (tokenReaders[t].canRead(scanner)) {
          token = tokenReaders[t].read(scanner)
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
