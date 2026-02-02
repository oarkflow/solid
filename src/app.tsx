import { createSignal, render, createElement, type FC } from './solid';

const TodoApp: FC = () => {
    const [todos, setTodos] = createSignal<string[]>([]);
    const [input, setInput] = createSignal('Hello there');

    const addTodo = () => {
        const value = input().trim();
        if (value) {
            setTodos([...todos(), value]);
            setInput('');
        }
    };

    const removeTodo = (index: number) => {
        setTodos(todos().filter((_, i) => i !== index));
    };

    return (
        <div>
            <h1>Todo App</h1>
            <div className="input-group">
                <input
                    type="text"
                    value={input}
                    onInput={(e: any) => setInput(e.target.value)}
                    onKeyPress={(e: any) => e.key === 'Enter' && addTodo()}
                    placeholder="Add a todo..."
                />
                <button onClick={addTodo}>Add</button>
            </div>
            <ul>
                {() => todos().map((todo, index) =>
                    <li key={index}>
                        <span>{todo}</span>
                        <button className="remove-btn" onClick={() => removeTodo(index)}>×</button>
                    </li>
                )}
            </ul>
            <div className="stats">Total: {() => todos().length} todos</div>
        </div>
    );
};

render(<TodoApp />, document.getElementById('root')!);
