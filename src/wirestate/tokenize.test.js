import { tokenize } from './tokenize'
import { parse } from './parse'

/*
* = initial
? = transient
  Note, the machine is not meant to spend much time in transient states and have
  no visual feedback when entering them. They are used to model synchronous logic.
  Also, traditionally all transitions end with ? as well.
& = parallel

Additions to Sketch.systems syntax:
! = final
@include = can be used as a state's child state,
  and will represent a file that will be parsed and all states in this file will be added as child states.
  If a `prefix` is specified then all direct states in the file will have their IDs prefixed to help
  ensure unique state IDs in the entire machine. The file being included must be a valid state machine.

  Example:

  My State
    @include "./somefile.states"
    @include "./modal.states" prefix My State
*/

const state = `
Home*
  one -> One?

One?
  is user logged in? -> Six

Six
  a -> Two!

  Two!
  Three*
    # When all Four's child states reach their final state Four will be done
    done.state.Four -> Seven

    Four
      @include "./file.states" prefix Four:

Seven

`

const tokens = tokenize(state)
console.log({ tokens })

const ast = parse(tokens)
console.log(JSON.stringify({ ast }, null, 2))
