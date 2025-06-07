# makeContainer

Utility for building service containers with lazy or eager resolution.

## Usage

```ts
import { makeContainer } from '@alexkunin/mk';

const container = makeContainer(builder => builder
  .lazy('a', () => ({ value: 'A' }))
  .eager('b', ({ a }) => ({ uses: a.value }))
);

console.log(container.b.uses); // "A"
```
