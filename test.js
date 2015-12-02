import test from 'ava'
import mongoose, { Schema as MongooseSchema } from 'mongoose'
import Model from './Model'
import Schema from './Schema'

@Schema
class PersonSchema {
  static schema = {
    name: String,
    age: Number
  }

  static randomPerson () {
    return new this({
      name: 'Random Person',
      age: Math.floor(Math.random() * 100)
    })
  }

  incrementAge () {
    this.age = this.nextAge
  }

  get nextAge () {
    return this.age + 1
  }
  set nextAge (age) {
    this.age = age - 1
  }
}

@Model
class PersonModel {
  static schema = {
    name: String,
    age: Number
  }
}

let modelN = 0
function modelify(schema) {
  return mongoose.model(`Model_${modelN++}`, schema)
}

test('@Schema converts an ES2016 class to a mongoose.Schema', t => {
  const schema = new PersonSchema()
  t.ok(schema !== null)
  t.ok(schema instanceof MongooseSchema)
  t.end()
})

test('@Schema keeps instance methods', t => {
  const schema = new PersonSchema()
  t.is(typeof schema.methods.incrementAge, 'function')

  const Person = modelify(schema)
  const person = new Person({ name: 'Instance methods', age: 12 })
  t.is(person.age, 12)
  person.incrementAge()
  t.is(person.age, 13)
  t.end()
})

test('@Schema keeps static methods', t => {
  const schema = new PersonSchema()
  t.is(typeof schema.statics.randomPerson, 'function')
  t.end()
})

test('@Schema adds virtuals for instance getters and setters', t => {
  const schema = new PersonSchema()
  t.is(typeof schema.virtuals.nextAge, 'object')
  t.is(schema.virtuals.nextAge.getters.length, 1)
  t.is(schema.virtuals.nextAge.setters.length, 1)

  const Person = modelify(schema)
  const person = new Person({ name: 'Virtual Types', age: 19 })
  t.is(person.nextAge, 20)
  person.nextAge = 25
  t.is(person.age, 24)

  t.end()
})

test('`this` in static methods passed to @Schema binds to the generated Model class', t => {
  const Person = modelify(new PersonSchema())
  t.ok(Person.randomPerson() instanceof Person)
  t.end()
})

test('@Model(className) registers a new model with mongoose', t => {
  @Model('ModelTest0')
  class Anon {
    static schema = { value: String }
  }
  t.ok(mongoose.modelNames().indexOf('ModelTest0') !== -1)

  t.end()
})

test('@Model and @Model() infer the model name from the decorated class', t => {
  @Model
  class ModelTest1 {
    static schema = { a: String }
  }
  t.ok(mongoose.modelNames().indexOf('ModelTest1') !== -1)

  @Model()
  class ModelTest2 {
    static schema = { b: String }
  }
  t.ok(mongoose.modelNames().indexOf('ModelTest2') !== -1)

  t.end()
})

test('@Model(options) are passed to the schema constructor', t => {
  @Model({ typeKey: 'tests!' })
  class ModelTestWithOptions {
    static schema = { c: String }
  }

  const retrievedOptions = mongoose.modelSchemas.ModelTestWithOptions.options
  t.is(retrievedOptions.typeKey, 'tests!')

  t.end()
})
