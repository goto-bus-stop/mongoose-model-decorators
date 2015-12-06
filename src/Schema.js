import { Schema as MongooseSchema } from 'mongoose'

import { pluginsSymbol } from './Plugin'

const optionNames = `strict bufferCommands capped versionKey
                     discriminatorKey minimize autoIndex shardKey
                     read validateBeforeSave _id id typeKey`.split(/\s+/g)

const ignoreMethods = { constructor: true }
const ignoreStatics = { length: true, name: true, prototype: true, schema: true }

optionNames.forEach(name => ignoreStatics[name] = true)

const makeSchema = options => Class => {
  return function SchemaConstructor () {
    const types = Class.schema
    const methods = Object.getOwnPropertyNames(Class.prototype).filter(name => !ignoreMethods[name])
    const statics = Object.getOwnPropertyNames(Class).filter(name => !ignoreStatics[name])
    const classOptions = optionNames
      .filter(name => name in Class)
      .reduce((opts, name) => {
        opts[name] = Class[name]
        return opts
      }, {})

    // options passed to the decorator constructor override options defined in
    // the class body
    const schema = new MongooseSchema(types, { ...classOptions, ...options })
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
    if (statics.length > 0) {
      schema.on('init', Model => {
        statics.forEach(name => {
          Object.defineProperty(Model, name,
            Object.getOwnPropertyDescriptor(Class, name)
          )
        })
      })
    }

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