# mk

This library was generated with [Nx](https://nx.dev).

## Building

Run `nx build mk` to build the library.

## Running unit tests

Run `nx test mk` to execute the unit tests via [Vitest](https://vitest.dev/).

## makeCommand

`makeCommand` wraps an async function and exposes `started`, `completed` and `failed` events using `EventHub`.

```ts
import { makeCommand } from '@alexkunin/mk';

const increment = makeCommand(async (value: number) => value + 1);

increment.started.subscribe(v => console.log('start', v));
increment.completed.subscribe(({ result }) => console.log('done', result));
increment.failed.subscribe(({ error }) => console.error(error));

await increment(1);
```
