export class SemanticError extends Error {
  constructor (message = 'Semantic error', { fileName = 'Unknown', line = 0, column = 0 } = {}) {
    super(message)
    this.name = 'SemanticError'
    this.fileName = fileName
    this.line = line
    this.column = column
  }
}

export class SyntaxError extends Error {
  constructor (message = 'Syntax error', { fileName = 'Unknown', line = 0, column = 0 } = {}) {
    super(message)
    this.name = 'SyntaxError'
    this.fileName = fileName
    this.line = line
    this.column = column
  }
}

export class LexicalError extends Error {
  constructor (message = 'Lexical error', { fileName = 'Unknown', line = 0, column = 0 } = {}) {
    super(message)
    this.name = 'LexicalError'
    this.fileName = fileName
    this.line = line
    this.column = column
  }
}
