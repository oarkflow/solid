
const COUNT = 50000;

function benchUnshift() {
    const arr = [];
    const start = performance.now();
    for (let i = 0; i < COUNT; i++) {
        arr.unshift(i);
    }
    const end = performance.now();
    console.log(`Unshift: ${(end - start).toFixed(2)}ms`);
}

function benchPushReverse() {
    const arr = [];
    const start = performance.now();
    for (let i = 0; i < COUNT; i++) {
        arr.push(i);
    }
    arr.reverse();
    const end = performance.now();
    console.log(`Push + Reverse: ${(end - start).toFixed(2)}ms`);
}

function benchDirectAssignment() {
    const start = performance.now();
    const arr = new Array(COUNT);
    for (let i = COUNT - 1; i >= 0; i--) {
        arr[i] = i;
    }
    const end = performance.now();
    console.log(`Direct Assignment (Pre-alloc): ${(end - start).toFixed(2)}ms`);
}

console.log(`Benchmarking ${COUNT} items...`);
benchUnshift();
benchPushReverse();
benchDirectAssignment();
