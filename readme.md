# mongoose-model-decorators

ES2016 decorator functions for building Mongoose models.

[Installation](#installation) - [Usage](#usage) - [API](#api) -
[Translations](#translations) - [Licence](#licence)

## Installation

```bash
npm install --save mongoose-model-decorators
```

Currently, there is no official Babel transformer for decorators. To use the
`@Model` decorator syntax, you need to add the [`decorators-legacy` transformer](https://github.com/loganfsmyth/babel-plugin-transform-decorators-legacy)
to your `.babelrc` or other Babel configuration.

```bash
npm install --save-dev babel-plugin-transform-decorators-legacy
```

## Usage

```js
import mongoose from 'mongoose'
import { Model } from 'mongoose-model-decorators'

@Model
class Channel {
  static schema = {
    channelName: { type: String, index: true },
    channelTopic: String,
    users: Array,
    favorited: { type: Boolean, default: false }
  }

  get summary () {
    const users = this.users.length
    return `${this.channelName} : ${this.channelTopic} (${users} active)`
  }
}

Channel.findOne({ channelName: '#mongoose' }).then(channel =>
  console.log(channel.summary)
  // → "#mongoose: Now with class syntax! (7 active)"
})
```

## API

### `@Schema`, `@Schema()`

Creates a [Mongoose Schema](http://mongoosejs.com/docs/guide.html) from a Class
definition.

Define your schema in a static `schema` property. The contents of that property
will be passed to the Mongoose Schema constructor.

```js
@Schema
class User {
  static schema = {
    name: String,
    age: Number,
    email: { type: String, required: true }
  }
}
```

### `@Schema(options={})`

Creates a [Mongoose Schema](http://mongoosejs.com/docs/guide.html) from a Class
definition.

The possible `options` are passed straight to the [Mongoose Schema constructor](http://mongoosejs.com/docs/guide.html#options).

Options defined in the `options` object take precedence over options that were
defined as static properties on the Schema class. Thus:

```js
@Schema({ collection: 'vip_users' })
class User {
  static autoIndex = false
  static collection = 'users'
}
```

…results in `{ autoIndex: false, collection: 'vip_users' }` being passed to
Mongoose.

### `@Model`, `@Model()`, `@Model(options={})`

Creates a Mongoose schema from a class definition, and defines it on the global
mongoose connection. If you pass any options, they're passed straight through
to `@Schema`.

```js
@Model({ collection: 'best_users' })
class User {
  // …
}
```

is equivalent to:

```js
@Schema({ collection: 'best_users' })
class UserSchema {
  // …
}
require('mongoose').model('User', new UserSchema)
```

### `createSchema(Class)`, `createSchema(options={})(Class)`

Alias to `@Schema`. This one reads a bit nicer if you're not using decorators:

```js
const UserSchema = createSchema(UserClass)
```

### `createModel(Class)`, `createModel(options={})(Class)`

Alias to `@Model`. Reads a bit nicer if you're not using decorators:

```js
const UserModel = createModel({ collection: 'best_users' })(UserClass)
```

## Usage without decorators support

If your project configuration doesn't support decorators, you can still use most
mongoose-model-decorators translations. Instead of using the `@Decorator`
syntax, you can call the decorator as a function, passing the class definition:

```js
import { createSchema, createModel } from 'mongoose-model-decorators'
class UserTemplate {
  static schema = {
    // ...
  }

  getFriends() {
    // ...
  }
}
// then use any of:
const UserSchema = createSchema(UserTemplate)
const UserSchema = createSchema()(UserTemplate)
const UserSchema = createSchema(options)(UserTemplate)
// or even:
const UserSchema = createSchema(class {
  // ...
})
// or for models:
const User = createModel(UserTemplate)
const User = createModel()(UserTemplate)
const User = createModel(options)(UserTemplate)
// or even:
createModel(class User {
  // ...
})
```

## Translations

`mongoose-model-decorators` translates as many ES2015 class things to their
Mongoose Schema and Model equivalents as possible, as transparently as possible.

<table>
  <thead>
    <tr>
      <th> Feature </th>
      <th> mongoose-model-decorators </th>
      <th> plain Mongoose </th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td> Instance methods </td>
      <td>
        <pre lang="js">
methodName () {
  console.log('hi!')
}</pre>
      </td>
      <td>
        <pre lang="js">
schema.method('methodName', function methodName () {
  console.log('hi!')
})</pre>
      </td>
    </tr>
    <tr>
      <td> Instance getters </td>
      <td>
        <pre lang="js">
get propName () {
  return 10
}</pre>
      </td>
      <td>
        <pre lang="js">
schema.virtual('propName').get(function () {
  return 10
})</pre>
      </td>
    </tr>
    <tr>
      <td> Instance setters </td>
      <td>
        <pre lang="js">
set propName (val) {
  console.log('set', val)
}</pre>
      </td>
      <td>
        <pre lang="js">
schema.virtual('propName').set(function (val) {
  console.log('set', val)
})</pre>
      </td>
    </tr>
    <tr>
      <td> Pre/post hooks </td>
      <td>
        <pre lang="js">
@pre('validate')
makeSlug () {
  this.slug = slugify(this.username)
}
</pre>
      </td>
      <td>
        <pre lang="js">
schema.pre('validate', function makeSlug () {
  this.slug = slugify(this.username)
})
</pre>
      </td>
    </tr>
    <tr>
      <td> Static methods </td>
      <td>
        <pre lang="js">
static methodName () {
  console.log('static!')
}</pre>
      </td>
      <td>
        <pre lang="js">
schema.static('methodName', function methodName () {
  console.log('static!')
})</pre>
      </td>
    </tr>
    <tr>
      <td> Static properties </td>
      <td>
        <pre lang="js">static prop = 'SOME_CONSTANT'</pre>
      </td>
      <td>
        <pre lang="js">
schema.on('init', function (ModelClass) {
  Object.defineProperty(ModelClass, 'prop', {
    value: 'SOME_CONSTANT'
  })
})</pre>
        Static properties are a bit hacky, because Mongoose doesn't have a
        shorthand for them (only for static methods). They work well though :)<br>
        <strong>NB: static properties that are also Schema options are also copied.</strong>
      </td>
    </tr>
    <tr>
      <td> Static getters and setters </td>
      <td>
        <pre lang="js">
static get propName () {
  return 20
}
static set propName () {
  throw new Error('Don\'t set this :(')
}</pre>
      </td>
      <td>
        <pre lang="js">
schema.on('init', function (ModelClass) {
  Object.defineProperty(ModelClass, 'propName', {
    get: function () {
      return 20
    },
    set: function () {
      throw new Error('Don\'t set this :(')
    }
  })
})</pre>
      </td>
    </tr>
  </tbody>
</table>

## Licence

[MIT](./LICENSE)
