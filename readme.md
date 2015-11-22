# mongoose-model-decorators

ES2016 decorator functions for building Mongoose models.

## Usage

```js
import mongoose from 'mongoose'
import { Plugin, Model } from 'mongoose-model-decorators'
// or:
// import Plugin from 'mongoose-model-decorators/Plugin'
// import Model from 'mongoose-model-decorators/Model'
import timestamps from 'mongoose-time'

@Model
@Plugin(timestamps())
class Channel {
  // the schema definition is passed straight to the mongoose Schema constructor:
  static schema = {
    channelName: { type: String, index: true },
    channelTopic: String,
    users: Array,
    favorited: { type: Boolean, default: false }
  }

  // getters and setters are added as virtual fields:
  get summary () {
    const users = this.users.length
    return `${this.channelName} : ${this.channelTopic} (${users} active)`
  }

  get createdSummary () {
    // a created_at field is added by the timestamps() plugin
    return `A channel since ${this.created_at}`
  }

  // instance methods are added to the schema:
  favorite () {
    this.favorited = true
    return this.save()
  }

  // as are static methods:
  static favorites () {
    // `this` is bound to the Model class in static methods, so you can use the
    // usual Model functions:
    return this.where('favorited', true)
  }
}

Channel.findOne({ channelName: '#mongoose' }).then(channel => {
  console.log(channel.summary, channel.createdSummary)
  return channel.favorite()
}).then(() =>
  console.log('channel favorited!')
)

// later…

Channel.favorites().then(channels => {
  const names = channels.map(c => c.channelName)
  console.log(`favorites: ${names.join(', ')}`)
})
```

## API

[TODO]

## Licence

[MIT](./LICENSE)
