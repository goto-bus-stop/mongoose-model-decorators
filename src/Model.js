import mongoose from 'mongoose'

import Schema from './Schema'

export default function Model (nameOverride, maybeOptions = {}) {
  let name = typeof nameOverride === 'string' ? nameOverride : null
  let options = typeof nameOverride === 'object' ? nameOverride : maybeOptions

  function makeModel (Class) {
    const SchemaConstructor = Schema(options || {})(Class)
    return mongoose.model(name || Class.name, new SchemaConstructor())
  }

  // @Model
  if (typeof nameOverride === 'function') {
    return makeModel(nameOverride)
  }

  return makeModel
}
