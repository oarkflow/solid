# Reactive Framework

A minimal TypeScript framework with fine-grained reactivity and direct DOM compilation.

## Features

- **Fine-grained reactivity**: Only updates exact DOM parts that change
- **No virtual DOM**: Direct DOM manipulation for optimal performance
- **Familiar API**: JSX and React-like hooks
- **TypeScript**: Full type safety

## API

### Reactivity

```typescript
import { createSignal, createEffect, createMemo } from 'reactive-framework';

// Create reactive state
const [count, setCount] = createSignal(0);

// Create side effects
createEffect(() => {
  console.log('Count:', count());
});

// Create computed values
const doubled = createMemo(() => count() * 2);
```

### Components

```typescript
import { h, render } from 'reactive-framework';

function Counter() {
  const [count, setCount] = createSignal(0);
  
  return h('div', null,
    h('span', null, 'Count: ', count),
    h('button', { onClick: () => setCount(count() + 1) }, '+')
  );
}

render(Counter(), document.getElementById('root')!);
```

## Build

```bash
npm run build
```