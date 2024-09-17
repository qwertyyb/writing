import { EventEmitterAsyncResource } from "node:events";

const event = new EventEmitterAsyncResource({ name: 'test' })

event.on('hello', () => {
  setImmediate(() => {
    console.log('event hell')
  })
})

console.log('before hello')
event.emit('hello')
console.log('after hello')