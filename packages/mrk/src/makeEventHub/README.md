# makeEventHub

Generates React hooks for dispatching and subscribing to custom events.

## Usage

```tsx
import { makeEventHub } from '@alexkunin/mrk';

const [ Provider, useDispatch, useEvent ] = makeEventHub<{
  ping: string;
}>();

function App() {
  return (
    <Provider>
      <Sender />
      <Listener />
    </Provider>
  );
}

function Sender() {
  const dispatch = useDispatch();
  return <button onClick={() => dispatch('ping', 'pong')} />;
}

function Listener() {
  useEvent('ping', msg => console.log(msg));
  return null;
}
```
