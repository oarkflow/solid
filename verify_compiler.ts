import * as fs from 'fs';
import { compile } from './src/core/velocity/compiler';

const tests = [
    {
        name: 'Static Element',
        input: 'const App = () => <div>Hello World</div>;'
    },
    {
        name: 'Dynamic Content',
        input: 'const App = () => <div>Hello {name}</div>;'
    },
    {
        name: 'Nested Elements',
        input: 'const App = () => <div><span>Header</span><main>{content}</main></div>;'
    }
];

let logOutput = '--- Velocity Compiler Verification ---\n';

function log(...args: any[]) {
    const msg = args.map(a => String(a)).join(' ');
    console.log(msg);
    logOutput += msg + '\n';
}

tests.forEach(test => {
    log(`\n[${test.name}]`);
    log('Input:', test.input);
    try {
        const output = compile(test.input);
        log('Output:\n', output);
    } catch (e) {
        log('Error:', e);
    }
});

fs.writeFileSync('compiler_output.txt', logOutput);
