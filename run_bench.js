import { execSync } from 'child_process';
import { writeFileSync } from 'fs';

try {
    const output = execSync('npx vitest run src/core/velocity/__tests__/benchmark_compare.test.ts --reporter=basic', { encoding: 'utf8' });
    writeFileSync('benchmark_results.txt', output);
} catch (e) {
    writeFileSync('benchmark_results.txt', e.stdout + '\n' + e.stderr);
}
