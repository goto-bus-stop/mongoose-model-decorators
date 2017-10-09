import test from 'tape'
import mongoose from 'mongoose'
import Model from './Model'
import Schema, { pre, post } from './Schema'

mongoose.Promise = Promise

// Mock saves, for testing hooks.
mongoose.Model.prototype.save = function (cb) {
  setTimeout(() => cb(null, this), 1)
}

@Schema
class PersonSchema {
  static schema = {
    name: String,
    age: Number
  };

  static randomPerson () {
    return new this({
      name: 'Random Person',
      age: Math.floor(Math.random() * 100)
    })
  }

  static get count () {
    return 10
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

let modelN = 0
function modelify (schema) {
  return mongoose.model(`Model_${modelN++}`, schema)
}

test('@Schema converts an ES2016 class to a mongoose.Schema', (t) => {
  t.plan(2)

  const schema = new PersonSchema()
  t.ok(schema !== null)
  t.ok(schema instanceof mongoose.Schema)
})

test('@Schema keeps instance methods', (t) => {
  t.plan(3)

  const schema = new PersonSchema()
  t.equal(typeof schema.methods.incrementAge, 'function')

  const Person = modelify(schema)
  const person = new Person({ name: 'Instance methods', age: 12 })
  t.equal(person.age, 12)
  person.incrementAge()
  t.equal(person.age, 13)
})

test('@Schema adds virtuals for instance getters and setters', (t) => {
  t.plan(5)

  const schema = new PersonSchema()
  t.equal(typeof schema.virtuals.nextAge, 'object')
  t.equal(schema.virtuals.nextAge.getters.length, 1)
  t.equal(schema.virtuals.nextAge.setters.length, 1)

  const Person = modelify(schema)
  const person = new Person({ name: 'Virtual Types', age: 19 })
  t.equal(person.nextAge, 20)
  person.nextAge = 25
  t.equal(person.age, 24)
})

test('@Schema keeps static methods', (t) => {
  t.plan(1)

  const schema = new PersonSchema()
  t.equal(typeof modelify(schema).randomPerson, 'function')
})

test('@Schema supports static property getter/setters', (t) => {
  t.plan(1)

  const Person = modelify(new PersonSchema())
  t.equal(Person.count, 10)
})

test('`this` in static methods passed to @Schema binds to the generated Model class', (t) => {
  t.plan(1)

  const Person = modelify(new PersonSchema())
  t.ok(Person.randomPerson() instanceof Person)
})

test('Schema options can be defined as static class properties', (t) => {
  t.plan(1)

  const schema = new (
    @Schema
    class {
      static typeKey = 'anotherType';
    }
  )()

  t.equal(schema.options.typeKey, 'anotherType')
})

test('Schema options passed to @Schema override options defined in the class body', (t) => {
  t.plan(2)

  const schema = new (
    @Schema({ typeKey: 'definedInDecorator' })
    class {
      static typeKey = 'definedInClass';
      static versionKey = 'alsoDefinedInClass';
    }
  )()

  t.equal(schema.options.typeKey, 'definedInDecorator')
  t.equal(schema.options.versionKey, 'alsoDefinedInClass')
})

test('@Model(className) registers a new model with mongoose', (t) => {
  t.plan(1)

  @Model('ModelTest0')
  class Anon { // eslint-disable-line no-unused-vars
    static schema = { value: String };
  }
  t.ok(mongoose.modelNames().indexOf('ModelTest0') !== -1)
})

test('@Model and @Model() infer the model name from the decorated class', (t) => {
  t.plan(2)

  @Model
  class ModelTest1 { // eslint-disable-line no-unused-vars
    static schema = { a: String };
  }
  t.ok(mongoose.modelNames().indexOf('ModelTest1') !== -1)

  @Model()
  class ModelTest2 { // eslint-disable-line no-unused-vars
    static schema = { b: String };
  }
  t.ok(mongoose.modelNames().indexOf('ModelTest2') !== -1)
})

test('@Model(options) are passed to the schema constructor', (t) => {
  t.plan(1)

  @Model({ typeKey: 'tests!' })
  class ModelTestWithOptions { // eslint-disable-line no-unused-vars
    static schema = { c: String };
  }

  const retrievedOptions = mongoose.modelSchemas.ModelTestWithOptions.options
  t.equal(retrievedOptions.typeKey, 'tests!')
})

test('@Model({ connection }) registers the model on a non-default connection', (t) => {
  t.plan(2)

  const testConnection = mongoose.createConnection()
  @Model({ connection: testConnection })
  class CustomConnection {
    static schema = { d: String };
  }

  t.equal(testConnection.model('CustomConnection'), CustomConnection)
  t.not(mongoose.model('CustomConnection'), CustomConnection)
})

test('@Model uses "connection" option from static key', (t) => {
  t.plan(2)

  const testConnection = mongoose.createConnection()
  @Model
  class CustomConnection {
    static connection = testConnection;
    static schema = { e: String };
  }

  t.equal(testConnection.model('CustomConnection'), CustomConnection)
  t.not(mongoose.model('CustomConnection'), CustomConnection)
})

test('instanceof works with @Model classes', (t) => {
  t.plan(1)

  @Model
  class User {
    static schema = { name: String };
  }
  t.ok(new User() instanceof User)
})

test('@pre(\'method\') adds a hook to "method"', (t) => {
  t.plan(2)

  let hookRan = false
  @Schema
  class TestSchema {
    @pre('save')
    logSave () {
      hookRan = true
    }
  }

  const TestModel = modelify(new TestSchema())
  t.equal(hookRan, false)
  new TestModel().save()
    .then(() => t.equal(hookRan, true))
    .catch(t.fail)
})

test('@pre(\'method\') hooks that do not call `next()` have the correct `this`', (t) => {
  t.plan(2)

  let hookModel = null
  @Schema
  class TestSchema {
    @pre('save')
    logSave () {
      hookModel = this
    }
  }

  const model = new (
    modelify(new TestSchema())
  )()
  t.equal(hookModel, null)
  model.save()
    .then(() => t.equal(hookModel, model))
    .catch(t.fail)
})

test('@post(\'validate\') should not call `next()`', (t) => {
  t.plan(2)

  let hookModel = null
  @Schema
  class TestSchema {
    @post('validate')
    logValidate () {
      hookModel = this
    }
  }

  const model = new (
    modelify(new TestSchema())
  )()
  t.equal(hookModel, null)
  t.doesNotThrow(model.save.bind(model))
})

test('@post(\'validate\') have the correct `this`', (t) => {
  t.plan(2)

  let hookModel = null
  @Schema
  class TestSchema {
    @post('validate')
    logValidate () {
      hookModel = this
    }
  }

  const model = new (
    modelify(new TestSchema())
  )()
  t.equal(hookModel, null)
  model.save()
    .then(() => t.equal(hookModel, model))
    .catch(t.fail)
})

test('can do anything in `configureSchema` method', (t) => {
  t.plan(1)

  @Schema
  class TestSchema {
    static configureSchema (schema) {
      schema.itWorked = true
    }
  }

  const schema = new TestSchema()
  t.ok(schema.itWorked)
})
