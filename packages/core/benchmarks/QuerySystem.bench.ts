// 测试组件
import { Component, ComponentRegistry, Entity, QuerySystem, Scene } from '../src';

class PositionComponent extends Component {
    constructor(
        public x: number = 0,
        public y: number = 0
    ) {
        super();
    }
}

class VelocityComponent extends Component {
    constructor(
        public vx: number = 0,
        public vy: number = 0
    ) {
        super();
    }
}

class HealthComponent extends Component {
    constructor(
        public health: number = 100,
        public maxHealth: number = 100
    ) {
        super();
    }
}

class RenderComponent extends Component {
    constructor(
        public visible: boolean = true,
        public layer: number = 0
    ) {
        super();
    }
}

class AIComponent extends Component {
    constructor(public behavior: string = 'idle') {
        super();
    }
}

// 性能统计工具
class PerformanceStats {
    private measurements: Map<string, number[]> = new Map();

    record(label: string, duration: number): void {
        if (!this.measurements.has(label)) {
            this.measurements.set(label, []);
        }
        this.measurements.get(label)!.push(duration);
    }

    getStats(label: string): { avg: number; min: number; max: number; total: number; count: number } {
        const values = this.measurements.get(label) || [];
        if (values.length === 0) {
            return { avg: 0, min: 0, max: 0, total: 0, count: 0 };
        }
        const total = values.reduce((sum, val) => sum + val, 0);
        return {
            avg: total / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            total,
            count: values.length
        };
    }

    printReport(): void {
        console.log('\n' + '='.repeat(80));
        console.log('QuerySystem 性能测试报告');
        console.log('='.repeat(80));

        for (const [label] of Array.from(this.measurements.entries())) {
            const stats = this.getStats(label);
            console.log(`\n【${label}】`);
            console.log(`  平均耗时: ${stats.avg.toFixed(3)}ms`);
            console.log(`  最小耗时: ${stats.min.toFixed(3)}ms`);
            console.log(`  最大耗时: ${stats.max.toFixed(3)}ms`);
            console.log(`  总耗时:   ${stats.total.toFixed(3)}ms`);
            console.log(`  执行次数: ${stats.count}`);
        }
        console.log('\n' + '='.repeat(80));
    }
}

// 基准测试套件
class QuerySystemBenchmark {
    private stats = new PerformanceStats();
    private scene: Scene;
    private querySystem: QuerySystem;

    constructor() {
        this.scene = new Scene();
        this.querySystem = new QuerySystem();
    }

    // 测试1: 大量实体的初始化和查询
    async testMassiveEntityCreation(entityCount: number): Promise<void> {
        console.log(`\n>>> 测试1: 创建并查询 ${entityCount} 个实体`);

        const entities: Entity[] = [];

        // 创建实体
        const createStart = performance.now();
        for (let i = 0; i < entityCount; i++) {
            const entity = this.scene.createEntity(`Entity_${i}`);

            // 为实体添加不同的组件组合
            entity.addComponent(new PositionComponent(i, i));

            if (i % 2 === 0) {
                entity.addComponent(new VelocityComponent(1, 1));
            }

            if (i % 3 === 0) {
                entity.addComponent(new HealthComponent(100));
            }

            if (i % 5 === 0) {
                entity.addComponent(new RenderComponent());
            }

            if (i % 7 === 0) {
                entity.addComponent(new AIComponent('patrol'));
            }

            entities.push(entity);
        }
        const createDuration = performance.now() - createStart;
        this.stats.record('创建实体', createDuration);
        console.log(`  创建 ${entityCount} 个实体耗时: ${createDuration.toFixed(3)}ms`);

        // 批量添加到QuerySystem
        const addStart = performance.now();
        this.querySystem.setEntities(entities);
        const addDuration = performance.now() - addStart;
        this.stats.record('批量添加到QuerySystem', addDuration);
        console.log(`  添加到QuerySystem耗时: ${addDuration.toFixed(3)}ms`);

        // 执行多种查询
        const queries = [
            { name: 'Position组件', types: [PositionComponent] },
            { name: 'Position+Velocity', types: [PositionComponent, VelocityComponent] },
            { name: 'Position+Health', types: [PositionComponent, HealthComponent] },
            { name: 'Position+Velocity+Health', types: [PositionComponent, VelocityComponent, HealthComponent] },
            {
                name: 'All Components',
                types: [PositionComponent, VelocityComponent, HealthComponent, RenderComponent, AIComponent]
            }
        ];

        for (const query of queries) {
            const queryStart = performance.now();
            const result = this.querySystem.queryAll(...query.types);
            const queryDuration = performance.now() - queryStart;
            this.stats.record(`查询-${query.name}`, queryDuration);
            console.log(`  查询[${query.name}]: ${queryDuration.toFixed(3)}ms (找到 ${result.count} 个实体)`);
        }

        // 获取统计信息
        const sysStats = this.querySystem.getStats();
        console.log(`\n  QuerySystem统计:`);
        console.log(`    总实体数: ${sysStats.entityCount}`);
        console.log(`    Archetype数: ${sysStats.indexStats.componentIndexSize}`);
        console.log(`    总查询数: ${sysStats.queryStats.totalQueries}`);
        console.log(`    缓存命中率: ${sysStats.queryStats.cacheHitRate}`);
    }

    // 测试2: 频繁添加/删除组件
    async testFrequentComponentChanges(entityCount: number, operationCount: number): Promise<void> {
        console.log(`\n>>> 测试2: ${entityCount}个实体进行${operationCount}次组件增删操作`);

        // 准备实体
        const entities: Entity[] = [];
        for (let i = 0; i < entityCount; i++) {
            const entity = this.scene.createEntity(`FreqEntity_${i}`);
            entity.addComponent(new PositionComponent(i, i));
            entities.push(entity);
        }
        this.querySystem.setEntities(entities);

        // 执行频繁的组件添加/删除操作
        const opStart = performance.now();
        for (let i = 0; i < operationCount; i++) {
            const entity = entities[i % entityCount];

            // 添加组件
            if (!entity.hasComponent(VelocityComponent)) {
                entity.addComponent(new VelocityComponent(1, 1));
                this.querySystem.updateEntity(entity);
            }

            // 删除组件
            if (i % 3 === 0) {
                const vel = entity.getComponent(VelocityComponent);
                if (vel) {
                    entity.removeComponent(vel);
                    this.querySystem.updateEntity(entity);
                }
            }

            // 每100次操作执行一次查询
            if (i % 100 === 0) {
                this.querySystem.queryAll(PositionComponent, VelocityComponent);
            }
        }
        const opDuration = performance.now() - opStart;
        this.stats.record('频繁组件变更', opDuration);

        console.log(`  完成 ${operationCount} 次组件操作耗时: ${opDuration.toFixed(3)}ms`);
        console.log(`  平均每次操作: ${(opDuration / operationCount).toFixed(6)}ms`);
        console.log(`  操作吞吐量: ${(operationCount / (opDuration / 1000)).toFixed(0)} ops/sec`);
    }

    // 测试3: 频繁添加/删除实体
    async testFrequentEntityChanges(batchSize: number, iterations: number): Promise<void> {
        console.log(`\n>>> 测试3: 每轮添加/删除${batchSize}个实体，共${iterations}轮`);

        const baseEntities: Entity[] = [];
        for (let i = 0; i < 1000; i++) {
            const entity = this.scene.createEntity(`BaseEntity_${i}`);
            entity.addComponent(new PositionComponent(i, i));
            baseEntities.push(entity);
        }
        this.querySystem.setEntities(baseEntities);

        let totalAddTime = 0;
        let totalRemoveTime = 0;
        let totalQueryTime = 0;

        for (let iter = 0; iter < iterations; iter++) {
            // 添加实体
            const addStart = performance.now();
            const newEntities: Entity[] = [];
            for (let i = 0; i < batchSize; i++) {
                const entity = this.scene.createEntity(`TempEntity_${iter}_${i}`);
                entity.addComponent(new PositionComponent(i, i));
                entity.addComponent(new VelocityComponent(1, 1));
                newEntities.push(entity);
                this.querySystem.addEntity(entity);
            }
            const addDuration = performance.now() - addStart;
            totalAddTime += addDuration;

            // 查询
            const queryStart = performance.now();
            this.querySystem.queryAll(PositionComponent, VelocityComponent);
            const queryDuration = performance.now() - queryStart;
            totalQueryTime += queryDuration;

            // 删除实体
            const removeStart = performance.now();
            for (const entity of newEntities) {
                this.querySystem.removeEntity(entity);
            }
            const removeDuration = performance.now() - removeStart;
            totalRemoveTime += removeDuration;
        }

        this.stats.record('批量添加实体', totalAddTime);
        this.stats.record('批量删除实体', totalRemoveTime);
        this.stats.record('实体变动后查询', totalQueryTime);

        console.log(`  总添加时间: ${totalAddTime.toFixed(3)}ms (平均 ${(totalAddTime / iterations).toFixed(3)}ms/批)`);
        console.log(
            `  总删除时间: ${totalRemoveTime.toFixed(3)}ms (平均 ${(totalRemoveTime / iterations).toFixed(3)}ms/批)`
        );
        console.log(
            `  总查询时间: ${totalQueryTime.toFixed(3)}ms (平均 ${(totalQueryTime / iterations).toFixed(3)}ms/次)`
        );
    }

    // 测试4: 响应式查询性能
    async testReactiveQueryPerformance(entityCount: number): Promise<void> {
        console.log(`\n>>> 测试4: 响应式查询性能测试 (${entityCount}个实体)`);

        const entities: Entity[] = [];
        for (let i = 0; i < entityCount; i++) {
            const entity = this.scene.createEntity(`ReactiveEntity_${i}`);
            entity.addComponent(new PositionComponent(i, i));
            if (i % 2 === 0) {
                entity.addComponent(new VelocityComponent(1, 1));
            }
            entities.push(entity);
        }
        this.querySystem.setEntities(entities);

        // 创建多个响应式查询
        const reactiveQueries = [
            this.querySystem.createReactiveQuery([PositionComponent]),
            this.querySystem.createReactiveQuery([PositionComponent, VelocityComponent]),
            this.querySystem.createReactiveQuery([HealthComponent])
        ];

        let changeCount = 0;
        for (const query of reactiveQueries) {
            query.subscribe(() => {
                changeCount++;
            });
        }

        // 执行实体变更
        const changeStart = performance.now();
        for (let i = 0; i < 1000; i++) {
            const entity = entities[i % entityCount];

            if (!entity.hasComponent(HealthComponent)) {
                entity.addComponent(new HealthComponent(100));
                this.querySystem.updateEntity(entity);
            } else {
                const health = entity.getComponent(HealthComponent);
                if (health) {
                    entity.removeComponent(health);
                    this.querySystem.updateEntity(entity);
                }
            }
        }
        const changeDuration = performance.now() - changeStart;
        this.stats.record('响应式查询更新', changeDuration);

        console.log(`  1000次变更耗时: ${changeDuration.toFixed(3)}ms`);
        console.log(`  触发通知次数: ${changeCount}`);
        console.log(`  平均每次变更: ${(changeDuration / 1000).toFixed(6)}ms`);

        // 清理
        for (const query of reactiveQueries) {
            this.querySystem.destroyReactiveQuery(query);
        }
    }

    // 测试5: 缓存效率测试
    async testCacheEfficiency(entityCount: number, queryCount: number): Promise<void> {
        console.log(`\n>>> 测试5: 缓存效率测试 (${entityCount}个实体, ${queryCount}次查询)`);

        const entities: Entity[] = [];
        for (let i = 0; i < entityCount; i++) {
            const entity = this.scene.createEntity(`CacheEntity_${i}`);
            entity.addComponent(new PositionComponent(i, i));
            if (i % 2 === 0) entity.addComponent(new VelocityComponent(1, 1));
            if (i % 3 === 0) entity.addComponent(new HealthComponent(100));
            entities.push(entity);
        }
        this.querySystem.setEntities(entities);

        // 重复相同查询测试缓存命中
        const queryStart = performance.now();
        for (let i = 0; i < queryCount; i++) {
            this.querySystem.queryAll(PositionComponent, VelocityComponent);
        }
        const queryDuration = performance.now() - queryStart;
        this.stats.record('重复查询(缓存)', queryDuration);

        const stats = this.querySystem.getStats();
        console.log(`  ${queryCount}次重复查询耗时: ${queryDuration.toFixed(3)}ms`);
        console.log(`  平均每次查询: ${(queryDuration / queryCount).toFixed(6)}ms`);
        console.log(`  缓存命中率: ${stats.queryStats.cacheHitRate}`);
        console.log(`  查询吞吐量: ${(queryCount / (queryDuration / 1000)).toFixed(0)} queries/sec`);
    }

    // 执行所有测试
    async runAll(): Promise<void> {
        console.log('\n');
        console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
        console.log('║                  QuerySystem 性能基准测试                                  ║');
        console.log('╚═══════════════════════════════════════════════════════════════════════════╝');

        try {
            // 小规模测试
            await this.testMassiveEntityCreation(1000);
            this.cleanup();

            await this.testFrequentComponentChanges(500, 5000);
            this.cleanup();

            // 中等规模测试
            await this.testMassiveEntityCreation(5000);
            this.cleanup();

            await this.testFrequentEntityChanges(100, 50);
            this.cleanup();

            // 大规模测试
            await this.testMassiveEntityCreation(10000);
            this.cleanup();

            await this.testReactiveQueryPerformance(2000);
            this.cleanup();

            await this.testCacheEfficiency(5000, 10000);
            this.cleanup();

            // 压力测试
            console.log('\n>>> 压力测试: 超大规模实体');
            await this.testMassiveEntityCreation(50000);
            this.cleanup();

            // 打印总结报告
            this.stats.printReport();
        } catch (error) {
            console.error('测试失败:', error);
            throw error;
        }
    }

    private cleanup(): void {
        // 清理资源
        ComponentRegistry.reset();
        this.scene = new Scene();
        this.querySystem = new QuerySystem();
    }
}

async function main() {
    const benchmark = new QuerySystemBenchmark();
    await benchmark.runAll();

    console.log('所有基准测试完成\n');
}

// 运行测试
main().catch(console.error);
