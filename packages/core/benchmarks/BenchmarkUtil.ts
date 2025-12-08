export interface BenchmarkResult {
    name: string;
    duration: number;
    ops: number;
}

export class SimpleBenchmark {
    static measure(name: string, fn: () => void, iterations = 1000): BenchmarkResult {
        const start = performance.now();

        // 🔄 Run the function multiple times
        for (let i = 0; i < iterations; i++) {
            fn();
        }

        const end = performance.now();
        const duration = end - start;
        const ops = Math.round((iterations / duration) * 1000);

        console.log(`${name}: ${duration.toFixed(2)}ms for ${iterations} runs`);
        console.log(`${ops} operations per second`);

        return { name, duration, ops };
    }

    // 预热200次后,进行测量
    static measureWithWarmup(name: string, fn: () => void, iterations = 1000): BenchmarkResult {
        for (let i = 0; i < 1000; i++) fn();
        return SimpleBenchmark.measure(name, fn, iterations);
    }
}

/**
 * 种子随机数生成器,确保每次测试时生成的随机数相同
 * @param seed 随机数种子
 */
export function seededRandom(seed: number): () => number {
    let currentSeed = seed;
    return function () {
        currentSeed = (currentSeed * 9301 + 49297) % 233280;
        return currentSeed / 233280;
    };
}
