# makeCommand

Wraps an async function and exposes lifecycle events via `EventHub`.

## Usage

```ts
import { makeCommand } from '@alexkunin/mk';

const increment = makeCommand(async (value: number) => value + 1);

increment.started.subscribe(v => console.log('start', v));
increment.completed.subscribe(({ result }) => console.log('done', result));
increment.failed.subscribe(({ error }) => console.error(error));

await increment(1);
```
