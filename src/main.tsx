import { createSignal, render, createElement, type FC } from './solid';
import './index.css';

const Demo: FC = () => {
    const [count, setCount] = createSignal(0);
    const [text, setText] = createSignal('Hello');
    const [color, setColor] = createSignal('#007bff');

    return (
        <div>
            <header style={{ background: color(), padding: '20px', color: 'white' }}>
                <h1>Complete DOM Framework</h1>
            </header>

            <main style={{ padding: '20px' }}>
                <section>
                    <h2>Interactive Elements</h2>

                    <button onClick={() => setCount(count() + 1)}>Count: {count}</button>

                    <div style={{ margin: '20px 0' }}>
                        <input
                            type="text"
                            value={text}
                            onInput={(e: any) => setText(e.target.value)}
                            placeholder="Enter text..."
                        />
                        <input
                            type="color"
                            value={color}
                            onChange={(e: any) => setColor(e.target.value)}
                        />
                    </div>

                    <p>Current text: <strong>{text}</strong></p>
                    <p>Count: <em>{count}</em></p>

                    <table>
                        <thead>
                            <tr>
                                <th>Property</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Count</td>
                                <td>{count}</td>
                            </tr>
                            <tr>
                                <td>Text</td>
                                <td>{text}</td>
                            </tr>
                        </tbody>
                    </table>
                </section>
            </main>
        </div>
    );
};

render(<Demo />, document.getElementById('root')!);
