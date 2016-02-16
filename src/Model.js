import mongoose from 'mongoose'

import Schema from './Schema'

export default function Model (nameOverride, maybeOptions = {}) {
  let name = typeof nameOverride === 'string' ? nameOverride : null
  let options = typeof nameOverride === 'object' ? nameOverride : maybeOptions

  function makeModel (Class) {
    // Connections can be defined as an option or as a static property.
    // Options have precedence. Default to the global mongoose 'connection'.
    const connection = options.connection || Class.connection || mongoose
    const SchemaConstructor = Schema(options || {})(Class)
    return connection.model(name || Class.name, new SchemaConstructor())
  }

  // @Model
  if (typeof nameOverride === 'function') {
    return makeModel(nameOverride)
  }

  return makeModel
}
