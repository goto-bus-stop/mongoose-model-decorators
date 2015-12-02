import { Schema as MongooseSchema } from 'mongoose'

import { pluginsSymbol } from './Plugin'

const ignoreMethods = { constructor: true }
const ignoreStatics = { length: true, name: true, prototype: true, schema: true }

const makeSchema = options => Class => {
  return function SchemaConstructor () {
    const types = Class.schema
    const schema = new MongooseSchema(types, options)
    const methods = Object.getOwnPropertyNames(Class.prototype).filter(name => !ignoreMethods[name])
    const statics = Object.getOwnPropertyNames(Class).filter(name => !ignoreStatics[name])
    methods.forEach(name => {
      const prop = Object.getOwnPropertyDescriptor(Class.prototype, name)
      if (typeof prop.get === 'function') {
        schema.virtual(name).get(prop.get)
      }
      if (typeof prop.set === 'function') {
        schema.virtual(name).set(prop.set)
      }
      if ('value' in prop) {
        schema.method(name, prop.value)
      }
    })
    statics.forEach(name => {
      schema.static(name, Class[name])
    })

    if (Class[pluginsSymbol]) {
      Class[pluginsSymbol].forEach(({ plugin, param }) => {
        schema.plugin(plugin, param)
      })
    }

    return schema
  }
}

export default function Schema (options) {
  // bare @Schema decorator
  if (typeof options === 'function') {
    return makeSchema({})(options)
  }

  // @Schema()
  if (!options) {
    return makeSchema({})
  }

  let plugins = []

  // @Schema(options)
  if (typeof options === 'object' && options.plugins) {
    plugins = options.plugins.map(plugin => Array.isArray(plugin)
      ? { plugin: plugin[0], param: plugin[1] }
      : { plugin: plugin })
  }

  return Class => {
    if (Class[pluginsSymbol]) {
      Class[pluginsSymbol] = [ ...Class[pluginsSymbol], ...plugins ]
    } else {
      Class[pluginsSymbol] = plugins
    }
    return makeSchema(options)(Class)
  }
}
