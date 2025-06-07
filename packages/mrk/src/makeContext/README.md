# makeContext

Creates a React context with lazy initialization.

## Usage

```tsx
import { makeContext } from '@alexkunin/mrk';

const [ Provider, useCtx ] = makeContext(() => ({ value: 'foo' }));

<Provider>
  <Child />
</Provider>

function Child() {
  const ctx = useCtx();
  return <span>{ctx.value}</span>;
}
```
