
import { TailwindEngine } from './src/core/tailwindcss/engine';
import { resolveColorUtility } from './src/core/tailwindcss/utilities/colors';
import { resolveColor } from './src/core/tailwindcss/resolvers';

console.log('Testing resolveColor:');
console.log(resolveColor('[hsl(var(--primary))]'));

console.log('Testing resolveColorUtility:');
console.log(JSON.stringify(resolveColorUtility('border', '[hsl(var(--primary))]'), null, 2));

const testClasses = [
    'border-t',
    'border-b-2',
    'border-border',
];

testClasses.forEach(cls => {
    console.log(`Parsing "${cls}":`);
    const result = TailwindEngine.toStyles(cls);
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('-------------------');
});
