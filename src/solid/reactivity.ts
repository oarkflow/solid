type Listener = () => void;
type Computation = () => void;

let currentListener: Listener | null = null;
const listeners = new WeakMap<object, Set<Listener>>();

export function createSignal<T>(value: T): [() => T, (newValue: T) => void] {
  const signal = { value };
  
  const getter = () => {
    if (currentListener) {
      if (!listeners.has(signal)) {
        listeners.set(signal, new Set());
      }
      listeners.get(signal)!.add(currentListener);
    }
    return signal.value;
  };
  
  const setter = (newValue: T) => {
    signal.value = newValue;
    const signalListeners = listeners.get(signal);
    if (signalListeners) {
      signalListeners.forEach(listener => listener());
    }
  };
  
  return [getter, setter];
}

export function createEffect(computation: Computation) {
  const execute = () => {
    currentListener = execute;
    computation();
    currentListener = null;
  };
  execute();
}

export function createMemo<T>(computation: () => T): () => T {
  const [value, setValue] = createSignal<T>(undefined as T);
  createEffect(() => setValue(computation()));
  return value;
}