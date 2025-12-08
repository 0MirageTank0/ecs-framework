// 测试组件
import { Component, Entity, EntitySystem, Matcher, Scene } from '../src';

class PositionComponent extends Component {
    public x: number = 0;
    public y: number = 0;
    constructor(x: number = 0, y: number = 0) {
        super();
        this.x = x;
        this.y = y;
    }
}

class VelocityComponent extends Component {
    public dx: number = 0;
    public dy: number = 0;
    constructor(dx: number = 0, dy: number = 0) {
        super();
        this.dx = dx;
        this.dy = dy;
    }
}

class HealthComponent extends Component {
    public value: number = 100;
    constructor(value: number = 100) {
        super();
        this.value = value;
    }
}

class RenderComponent extends Component {
    public visible: boolean = true;
}

// 测试系统
class MovementSystem extends EntitySystem {
    public updateCount = 0;
    public processedEntityCount = 0;

    constructor() {
        super(Matcher.empty().all(PositionComponent, VelocityComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        this.updateCount++;
        this.processedEntityCount = entities.length;

        for (const entity of entities) {
            const pos = entity.getComponent(PositionComponent);
            const vel = entity.getComponent(VelocityComponent);
            if (pos && vel) {
                pos.x += vel.dx;
                pos.y += vel.dy;
            }
        }
    }
}

class RenderSystem extends EntitySystem {
    public updateCount = 0;

    constructor() {
        super(Matcher.empty().all(PositionComponent, RenderComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        this.updateCount++;
        // 模拟渲染操作
        for (const entity of entities) {
            const pos = entity.getComponent(PositionComponent);
            const render = entity.getComponent(RenderComponent);
            if (pos && render && render.visible) {
                // 模拟渲染
            }
        }
    }
}

class HealthSystem extends EntitySystem {
    public updateCount = 0;

    constructor() {
        super(Matcher.empty().all(HealthComponent));
    }

    protected override process(entities: readonly Entity[]): void {
        this.updateCount++;
        for (const entity of entities) {
            const health = entity.getComponent(HealthComponent);
            if (health && health.value <= 0) {
                // 实体死亡处理
            }
        }
    }
}

// 基准测试类
class BenchmarkRunner {
    // private results: Map<string, never[]> = new Map();

    runAllBenchmarks(): void {
        console.log('开始运行 ECS 基准测试...\n');

        this.runBasicUpdatePerformance();
        this.runMultiSystemPerformance();
        this.runFrequentAddPerformance();
        this.runFrequentRemovePerformance();
        this.runMixedOperationsPerformance();
        this.runExtremeScenarioPerformance();
        this.runCacheEfficiencyTest();

        console.log('\n所有基准测试已完成');
        // this.displaySummary();
    }

    private runBasicUpdatePerformance(): void {
        console.log('=== 基础update性能测试 ===');
        const entityCounts = [100, 1000, 5000, 10000];
        const results: never[] = [];

        for (const count of entityCounts) {
            // 创建新场景
            const testScene = new Scene();
            const system = new MovementSystem();
            testScene.addSystem(system);

            // 创建实体
            const entities: Entity[] = [];
            for (let i = 0; i < count; i++) {
                const entity = testScene.createEntity(`entity_${i}`);
                entity.addComponent(new PositionComponent(i, i));
                entity.addComponent(new VelocityComponent(1, 1));
                entities.push(entity);
            }

            // 预热
            system.update();

            // 测试多次update的平均性能
            const iterations = 100;
            const startTime = performance.now();

            for (let i = 0; i < iterations; i++) {
                system.update();
            }

            const totalTime = performance.now() - startTime;
            const avgTime = totalTime / iterations;

            results.push({
                实体数: count.toLocaleString(),
                '平均Update时间(毫秒)': avgTime.toFixed(3),
                '总时间(毫秒)': totalTime.toFixed(2)
            } as never);

            // 清理资源
            testScene.end();
        }

        console.table(results);
    }

    private runMultiSystemPerformance(): void {
        console.log('\n=== 多系统场景性能测试 ===');

        const entityCount = 5000;
        const testScene = new Scene();

        // 添加多个系统
        const movementSystem = new MovementSystem();
        const renderSystem = new RenderSystem();
        const healthSystem = new HealthSystem();

        testScene.addSystem(movementSystem);
        testScene.addSystem(renderSystem);
        testScene.addSystem(healthSystem);

        // 创建实体，组件组合多样化
        for (let i = 0; i < entityCount; i++) {
            const entity = testScene.createEntity(`entity_${i}`);
            entity.addComponent(new PositionComponent(i, i));

            if (i % 2 === 0) {
                entity.addComponent(new VelocityComponent(1, 1));
            }

            if (i % 3 === 0) {
                entity.addComponent(new RenderComponent());
            }

            if (i % 5 === 0) {
                entity.addComponent(new HealthComponent(100));
            }
        }

        // 预热
        movementSystem.update();
        renderSystem.update();
        healthSystem.update();

        // 测试性能
        const iterations = 100;
        const startTime = performance.now();

        for (let i = 0; i < iterations; i++) {
            movementSystem.update();
            renderSystem.update();
            healthSystem.update();
        }

        const totalTime = performance.now() - startTime;
        const avgTime = totalTime / iterations;

        const results = [
            {
                指标: '总实体数',
                数值: entityCount
            },
            {
                指标: 'MovementSystem匹配实体数',
                数值: movementSystem.processedEntityCount
            },
            {
                指标: '平均每帧update时间(ms)',
                数值: avgTime.toFixed(3)
            },
            {
                指标: '总时间(ms)',
                数值: totalTime.toFixed(2)
            }
        ];

        console.table(results);

        testScene.end();
    }

    private runFrequentAddPerformance(): void {
        console.log('\n=== 频繁添加组件场景性能测试 ===');

        const testScene = new Scene();
        const system = new MovementSystem();
        testScene.addSystem(system);

        // 创建基础实体（只有Position，不匹配系统）
        const entities: Entity[] = [];
        const entityCount = 2000;

        for (let i = 0; i < entityCount; i++) {
            const entity = testScene.createEntity(`entity_${i}`);
            entity.addComponent(new PositionComponent(i, i));
            entities.push(entity);
        }

        // 测试：边添加Velocity组件边update
        const operationCount = 500;
        const addTimes: number[] = [];
        const updateTimes: number[] = [];

        for (let i = 0; i < operationCount; i++) {
            // 添加组件
            const addStart = performance.now();
            const entity = entities[i % entities.length];
            if (entity && !entity.hasComponent(VelocityComponent)) {
                entity.addComponent(new VelocityComponent(1, 1));
            }
            addTimes.push(performance.now() - addStart);

            // Update系统
            const updateStart = performance.now();
            system.update();
            updateTimes.push(performance.now() - updateStart);
        }

        const avgAddTime = addTimes.reduce((a, b) => a + b, 0) / addTimes.length;
        const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
        const maxUpdateTime = Math.max(...updateTimes);
        const minUpdateTime = Math.min(...updateTimes);

        const results = [
            {
                指标: '操作次数',
                数值: operationCount
            },
            {
                指标: '平均添加组件时间(ms)',
                数值: avgAddTime.toFixed(4)
            },
            {
                指标: '平均update时间(ms)',
                数值: avgUpdateTime.toFixed(4)
            },
            {
                指标: '最大update时间(ms)',
                数值: maxUpdateTime.toFixed(4)
            },
            {
                指标: '最小update时间(ms)',
                数值: minUpdateTime.toFixed(4)
            },
            {
                指标: '最终匹配实体数',
                数值: system.processedEntityCount
            }
        ];

        console.table(results);

        testScene.end();
    }

    private runFrequentRemovePerformance(): void {
        console.log('\n=== 频繁移除组件场景性能测试 ===');

        const testScene = new Scene();
        const system = new MovementSystem();
        testScene.addSystem(system);

        // 创建完整的实体（都匹配系统）
        const entities: Entity[] = [];
        const entityCount = 2000;

        for (let i = 0; i < entityCount; i++) {
            const entity = testScene.createEntity(`entity_${i}`);
            entity.addComponent(new PositionComponent(i, i));
            entity.addComponent(new VelocityComponent(1, 1));
            entities.push(entity);
        }

        // 预热
        system.update();

        // 测试：边移除Velocity组件边update
        const operationCount = 500;
        const removeTimes: number[] = [];
        const updateTimes: number[] = [];

        for (let i = 0; i < operationCount; i++) {
            // 移除组件
            const removeStart = performance.now();
            const entity = entities[i % entities.length];
            if (entity && entity.hasComponent(VelocityComponent)) {
                entity.removeComponentByType(VelocityComponent);
            }
            removeTimes.push(performance.now() - removeStart);

            // Update系统
            const updateStart = performance.now();
            system.update();
            updateTimes.push(performance.now() - updateStart);
        }

        const avgRemoveTime = removeTimes.reduce((a, b) => a + b, 0) / removeTimes.length;
        const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
        const maxUpdateTime = Math.max(...updateTimes);
        const minUpdateTime = Math.min(...updateTimes);

        const results = [
            {
                指标: '操作次数',
                数值: operationCount
            },
            {
                指标: '平均移除组件时间(ms)',
                数值: avgRemoveTime.toFixed(4)
            },
            {
                指标: '平均update时间(ms)',
                数值: avgUpdateTime.toFixed(4)
            },
            {
                指标: '最大update时间(ms)',
                数值: maxUpdateTime.toFixed(4)
            },
            {
                指标: '最小update时间(ms)',
                数值: minUpdateTime.toFixed(4)
            },
            {
                指标: '最终匹配实体数',
                数值: system.processedEntityCount
            }
        ];

        console.table(results);

        testScene.end();
    }

    private runMixedOperationsPerformance(): void {
        console.log('\n=== 混合增删操作性能测试 ===');

        const testScene = new Scene();
        const system = new MovementSystem();
        testScene.addSystem(system);

        // 创建基础实体
        const entities: Entity[] = [];
        const entityCount = 5000;

        for (let i = 0; i < entityCount; i++) {
            const entity = testScene.createEntity(`entity_${i}`);
            entity.addComponent(new PositionComponent(i, i));

            // 50%的实体有Velocity
            if (i % 2 === 0) {
                entity.addComponent(new VelocityComponent(1, 1));
            }
            entities.push(entity);
        }

        // 预热
        system.update();

        // 测试：随机增删组件并update
        const operationCount = 1000;
        const operationTimes: number[] = [];
        const updateTimes: number[] = [];

        for (let i = 0; i < operationCount; i++) {
            const opStart = performance.now();
            const entity = entities[Math.floor(Math.random() * entities.length)];

            if (!entity) continue;

            // 随机添加或移除
            if (Math.random() < 0.5) {
                // 添加
                if (!entity.hasComponent(VelocityComponent)) {
                    entity.addComponent(new VelocityComponent(1, 1));
                }
            } else {
                // 移除
                if (entity.hasComponent(VelocityComponent)) {
                    entity.removeComponentByType(VelocityComponent);
                }
            }
            operationTimes.push(performance.now() - opStart);

            // Update
            const updateStart = performance.now();
            system.update();
            updateTimes.push(performance.now() - updateStart);
        }

        const avgOpTime = operationTimes.reduce((a, b) => a + b, 0) / operationTimes.length;
        const avgUpdateTime = updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length;
        const maxUpdateTime = Math.max(...updateTimes);

        // 计算标准差
        const mean = avgUpdateTime;
        const variance = updateTimes.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / updateTimes.length;
        const stdDev = Math.sqrt(variance);

        const results = [
            {
                指标: '总实体数',
                数值: entityCount
            },
            {
                指标: '操作次数',
                数值: operationCount
            },
            {
                指标: '平均组件操作时间(ms)',
                数值: avgOpTime.toFixed(4)
            },
            {
                指标: '平均update时间(ms)',
                数值: avgUpdateTime.toFixed(4)
            },
            {
                指标: '最大update时间(ms)',
                数值: maxUpdateTime.toFixed(4)
            },
            {
                指标: '标准差(ms)',
                数值: stdDev.toFixed(4)
            },
            {
                指标: '最终匹配实体数',
                数值: system.processedEntityCount
            }
        ];

        console.table(results);

        testScene.end();
    }

    private runExtremeScenarioPerformance(): void {
        console.log('\n=== 极端场景性能测试 ===');

        const testScene = new Scene();
        const system = new MovementSystem();
        testScene.addSystem(system);

        // 创建大量实体
        const entities: Entity[] = [];
        const entityCount = 10000;

        for (let i = 0; i < entityCount; i++) {
            const entity = testScene.createEntity(`entity_${i}`);
            entity.addComponent(new PositionComponent(i, i));

            if (i % 3 === 0) {
                entity.addComponent(new VelocityComponent(1, 1));
            }
            entities.push(entity);
        }

        // 预热
        system.update();

        // 高频混合操作
        const batchSize = 50; // 每批次操作数
        const batchCount = 10; // 批次数

        const batchResults: Array<{
            operations: number;
            avgUpdateTime: number;
            maxUpdateTime: number;
        }> = [];

        for (let batch = 0; batch < batchCount; batch++) {
            const updateTimes: number[] = [];

            for (let i = 0; i < batchSize; i++) {
                // 随机操作多个实体
                for (let j = 0; j < 3; j++) {
                    const entity = entities[Math.floor(Math.random() * entities.length)];
                    if (!entity) continue;

                    if (Math.random() < 0.5) {
                        if (!entity.hasComponent(VelocityComponent)) {
                            entity.addComponent(new VelocityComponent(1, 1));
                        }
                    } else {
                        if (entity.hasComponent(VelocityComponent)) {
                            entity.removeComponentByType(VelocityComponent);
                        }
                    }
                }

                const updateStart = performance.now();
                system.update();
                updateTimes.push(performance.now() - updateStart);
            }

            batchResults.push({
                operations: batchSize * 3,
                avgUpdateTime: updateTimes.reduce((a, b) => a + b, 0) / updateTimes.length,
                maxUpdateTime: Math.max(...updateTimes)
            });
        }

        // 统计结果
        const overallAvg = batchResults.reduce((sum, r) => sum + r.avgUpdateTime, 0) / batchResults.length;
        const overallMax = Math.max(...batchResults.map((r) => r.maxUpdateTime));

        const results = [
            {
                指标: '总实体数',
                数值: entityCount
            },
            {
                指标: '总操作批次',
                数值: batchCount
            },
            {
                指标: '每批次操作数',
                数值: batchSize * 3
            },
            {
                指标: '平均update时间(ms)',
                数值: overallAvg.toFixed(4)
            },
            {
                指标: '最大update时间(ms)',
                数值: overallMax.toFixed(4)
            },
            {
                指标: '最终匹配实体数',
                数值: system.processedEntityCount
            }
        ];

        console.table(results);

        // 显示各批次的性能变化
        console.log('\n各批次性能变化:');
        const batchTableData = batchResults.map((result, index) => ({
            批次: index + 1,
            '平均时间(毫秒)': result.avgUpdateTime.toFixed(4),
            '最大时间(毫秒)': result.maxUpdateTime.toFixed(4)
        }));
        console.table(batchTableData);

        testScene.end();
    }

    private runCacheEfficiencyTest(): void {
        console.log('\n=== 缓存效率测试 ===');

        const testScene = new Scene();
        const system = new MovementSystem();
        testScene.addSystem(system);

        const entityCount = 2000;
        for (let i = 0; i < entityCount; i++) {
            const entity = testScene.createEntity(`entity_${i}`);
            entity.addComponent(new PositionComponent(i, i));
            entity.addComponent(new VelocityComponent(1, 1));
        }

        // 测试2：每次update前都修改一个实体（缓存失效场景）
        const invalidateIterations = 500;
        const entities = testScene.querySystem?.getAllEntities() || [];
        const invalidateStart = performance.now();

        for (let i = 0; i < invalidateIterations; i++) {
            const entity = entities[i % entities.length];
            if (entity) {
                // 触发缓存失效
                entity['_componentCache'] = null;
            }
            system.update();
        }
        const invalidateTime = performance.now() - invalidateStart;
        const invalidateAvg = invalidateTime / invalidateIterations;

        // 测试1：无组件变化时的连续update（最佳缓存场景）
        const stableIterations = 500;
        const stableStart = performance.now();
        for (let i = 0; i < stableIterations; i++) {
            system.update();
        }
        const stableTime = performance.now() - stableStart;
        const stableAvg = stableTime / stableIterations;

        const results = [
            {
                场景: '实体数',
                值: entityCount
            },
            {
                场景: '稳定场景（缓存命中）- 总时间(ms)',
                值: stableTime.toFixed(2)
            },
            {
                场景: '稳定场景（缓存命中）- 平均update时间(ms)',
                值: stableAvg.toFixed(4)
            },
            {
                场景: '缓存失效场景 - 总时间(ms)',
                值: invalidateTime.toFixed(2)
            },
            {
                场景: '缓存失效场景 - 平均update时间(ms)',
                值: invalidateAvg.toFixed(4)
            },
            {
                场景: '性能差异(%)',
                值: ((invalidateAvg / stableAvg - 1) * 100).toFixed(1)
            }
        ];

        console.table(results);

        testScene.end();
    }
}

const runner = new BenchmarkRunner();
runner.runAllBenchmarks();
