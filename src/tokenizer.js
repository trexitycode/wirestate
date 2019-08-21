import { LexicalError } from './errors'

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

  const backTrack = (step = 1) => {
    for (let k = step; k > 0; k -= 1) {
      let char = str[i - k]
      if (char === '\n') {
        line -= 1
        column = 0
      } else {
        column -= 1
      }
    }

    i -= step
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
    at (index) {
      if (index >= str.length) return this.EOF
      return str[index]
    },
    EOF: '--EOF--',
    reset,
    advance,
    backTrack,
    look
  }
}

export const makeTokenizer = ({ wireStateFile = '' } = {}) => {
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

  const indentToken = {
    canRead (scanner) { return scanner.c === '\n' || scanner.look('\r\n') },
    read (scanner) {
      if (scanner.look('\r\n')) {
        scanner.advance()
      }

      scanner.advance()

      let value = ''
      while (scanner.c === ' ') {
        value += scanner.c
        scanner.advance()
      }

      return {
        type: 'indent',
        value: value,
        raw: value
      }
    }
  }

  const whitespaceToken = {
    canRead (scanner) { return scanner.c === ' ' || scanner.c === '\t' },
    read (scanner) {
      let value = ''
      while (scanner.c === ' ' || scanner.c === '\t') {
        value += scanner.c
        scanner.advance()
      }

      return {
        type: 'whitespace',
        value: value,
        raw: value
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
            // isTerminated = false
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
                // isTerminated = false
                break
              }
              c = parseInt(scanner.text.substr(scanner.index + 1, 4), 16)
              if (!isFinite(c) || c < 0) {
                // isTerminated = false
                break
              }
              c = String.fromCharCode(c)
              scanner.advance(4)
              break
          }
          buffer += c
          c = scanner.advance()
        } else if (c === quote) {
          isTerminated = true
          scanner.advance()
          break
        } else {
          buffer += c
          c = scanner.advance()
        }
      }

      if (!isTerminated) {
        throw new LexicalError(`Unterminated string "${buffer}"`, { line: scanner.line, column: scanner.column, fileName: wireStateFile })
      }

      return {
        type: 'string',
        value: buffer,
        raw: `${quote}${buffer}${quote}`
      }
    }
  }

  const symbolToken = {
    symbols: [ '->', '|' ],
    canRead (scanner) {
      return this.symbols.some(s => scanner.look(s))
    },
    read (scanner) {
      const value = this.symbols.find(s => scanner.look(s))

      scanner.advance(value.length)

      return {
        type: 'symbol',
        value,
        raw: value
      }
    }
  }

  const keywordToken = {
    keywords: [ 'as' ],
    canRead (scanner) {
      return this.keywords.some(kw => {
        const nextChar = scanner.at(scanner.index + kw.length)
        // Keyword followed by whitespace
        return scanner.look(kw) && (nextChar === ' ' || nextChar === scanner.EOF)
      })
    },
    read (scanner) {
      const value = this.keywords.find(kw => scanner.look(kw))

      scanner.advance(value.length)

      return {
        type: 'keyword',
        value,
        raw: value
      }
    }
  }

  const operatorToken = {
    operators: '?&*!.{},',
    canRead (scanner) { return this.operators.indexOf(scanner.c) >= 0 },
    read (scanner) {
      const c = scanner.c
      scanner.advance()
      return {
        type: 'operator',
        value: c,
        raw: c
      }
    }
  }

  const identifierToken = {
    canRead (scanner) {
      const c = scanner.c
      return (
        (c >= 'a' && c <= 'z') ||
        (c >= 'A' && c <= 'Z') ||
        (c >= '0' && c <= '9') ||
        c === '_' ||
        c === '-'
      )
    },
    read (scanner) {
      let id = ''
      let c = scanner.c
      while ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c === ' ' || c === '_' || c === '-') {
        if (c === ' ') {
          scanner.advance()
          // Don't cosume the space if it is immediately followed by a symbol or a keyword
          if (symbolToken.canRead(scanner) || keywordToken.canRead(scanner)) {
            scanner.backTrack()
            break
          } else {
            scanner.backTrack()
            id += c
            c = scanner.advance()
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
    indentToken,
    stringToken,
    directiveToken,
    symbolToken,
    operatorToken,
    whitespaceToken,
    keywordToken,
    identifierToken
  ]
  const tokenReaderCount = tokenReaders.length

  const tokenize = (text) => {
    const scanner = makeScanner(text)
    let tokens = []
    let line = 0
    let column = 0
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
        throw new LexicalError(`Unknown charcter: ${scanner.c}`, { line, column, fileName: wireStateFile })
      }
    }

    return tokens
  }

  return { tokenize }
}
