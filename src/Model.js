import mongoose from 'mongoose'

import Schema from './Schema'

export default function Model (nameOverride, maybeOptions = {}) {
  let name = typeof nameOverride === 'string' ? nameOverride : null
  let options = typeof nameOverride === 'object' ? nameOverride : maybeOptions

  function makeModel (Class) {
    const makeSchema = Schema(options || {})
    return mongoose.model(name || Class.name, makeSchema(Class))
  }

  // @Model
  if (typeof nameOverride === 'function') {
    return makeModel(nameOverride)
  }

  return makeModel
}
