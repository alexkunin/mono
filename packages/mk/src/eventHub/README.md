# EventHub

Simple wrapper over `EventTarget` providing typed events.

## Usage

```ts
import { EventHub } from '@alexkunin/mk';

const hub = new EventHub<string>('my-event');

const unsubscribe = hub.subscribe(data => console.log(data));

hub.dispatch('hello');
unsubscribe();
```
