import * as Automerge from 'automerge'
import Delta from 'quill-delta'

export function textToDelta(text: Automerge.Text): Delta {
  const ops: any[] = []
  let controlState: any = {}
  let currentString: any = ''
  let attributes: any = {}

  text.toSpans().forEach((span: any) => {
    if (isControlMarker(span)) {
      controlState = accumulateAttributes(span.attributes, controlState)
    } else {
      const next = attributeStateToAttributes(controlState)

      // if the next span has the same calculated attributes as the current span
      // don't bother outputting it as a separate span, just let it ride
      if (typeof span === 'string' && isEquivalent(next, attributes)) {
        currentString += span
        return
      }

      if (currentString) {
        ops.push(opFrom(currentString, attributes))
      }

      // If we've got a string, we might be able to concatenate it to another
      // same-attributed-string, so remember it and go to the next iteration.
      if (typeof span === 'string') {
        currentString = span
        attributes = next
      } else {
        // otherwise we have an embed "character" and should output it immediately.
        // embeds are always one-"character" in length.
        ops.push(opFrom(span, next))
        currentString = ''
        attributes = {}
      }
    }
  })

  // at the end, flush any accumulated string out
  if (currentString) {
    ops.push(opFrom(currentString, attributes))
  }

  return new Delta(ops)
}

export function applyDeltaToText(text: Automerge.Text, delta: Delta): void {
  let offset = 0

  delta.forEach((op) => {
    if (op.retain) {
      ;[text, offset] = applyRetainOp(text, offset, op)
    } else if (op.delete) {
      ;[text, offset] = applyDeleteOp(text, offset, op)
    } else if (op.insert) {
      ;[text, offset] = applyInsertOp(text, offset, op)
    }
  })
}
function applyDeleteOp(text, offset, op) {
  let length = op.delete
  while (length > 0) {
    if (isControlMarker(text.get(offset))) {
      offset += 1
    } else {
      // we need to not delete control characters, but we do delete embed characters
      text.deleteAt(offset, 1)
      length -= 1
    }
  }
  return [text, offset]
}

function applyRetainOp(text, offset, op) {
  let length = op.retain

  if (op.attributes) {
    console.log(op)
    text.insertAt(offset, { attributes: op.attributes })
    offset += 1
  }

  while (length > 0) {
    const char = text.get(offset)
    offset += 1
    if (!isControlMarker(char)) {
      length -= 1
    }
  }

  if (op.attributes) {
    text.insertAt(offset, { attributes: inverseAttributes(op.attributes) })
    offset += 1
  }

  return [text, offset]
}

function applyInsertOp(text, offset, op) {
  const originalOffset = offset

  if (typeof op.insert === 'string') {
    text.insertAt(offset, ...op.insert.split(''))
    offset += op.insert.length
  } else {
    // we have an embed or something similar
    text.insertAt(offset, op.insert)
    offset += 1
  }

  if (op.attributes) {
    text.insertAt(originalOffset, { attributes: op.attributes })
    offset += 1
  }
  if (op.attributes) {
    text.insertAt(offset, { attributes: inverseAttributes(op.attributes) })
    offset += 1
  }
  return [text, offset]
}

function inverseAttributes(attributes: any) {
  const invertedAttributes = {}
  Object.keys(attributes).forEach((key) => {
    invertedAttributes[key] = null
  })
  return invertedAttributes
}

function accumulateAttributes(span, accumulatedAttributes) {
  Object.entries(span).forEach(([key, value]) => {
    if (!accumulatedAttributes[key]) {
      accumulatedAttributes[key] = []
    }
    if (value === null) {
      accumulatedAttributes[key].shift()
    } else {
      accumulatedAttributes[key].unshift(value)
    }
  })
  return accumulatedAttributes
}

function opFrom(text: any, attributes: any) {
  const op: any = { insert: text }
  if (Object.keys(attributes).length > 0) {
    op.attributes = attributes
  }
  return op
}

function isControlMarker(pseudoCharacter) {
  return typeof pseudoCharacter === 'object' && pseudoCharacter.attributes
}

function isEquivalent(a: any, b: any) {
  const aProps = Object.getOwnPropertyNames(a)
  const bProps = Object.getOwnPropertyNames(b)

  if (aProps.length !== bProps.length) {
    return false
  }

  for (let i = 0; i < aProps.length; i += 1) {
    const propName = aProps[i]
    if (a[propName] !== b[propName]) {
      return false
    }
  }

  // If we made it this far, objects
  // are considered equivalent
  return true
}

function attributeStateToAttributes(accumulatedAttributes: any) {
  const attributes = {}
  Object.entries(accumulatedAttributes).forEach(([key, values]: [any, any]) => {
    if (values.length) {
      const [value] = values
      attributes[key] = value
    }
  })
  return attributes
}
