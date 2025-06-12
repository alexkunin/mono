import { describe } from 'vitest';
import { Builder, EmptyContainer, makeContainer } from './makeContainer.js';

describe('makeContainer', () => {
    it('should allow to lazy a service', () => {
        const container = makeContainer(builder => builder
            .lazy('a', () => ({ service: 'a' })),
        );

        expect(container.a).toEqual({ service: 'a' });
    });

    it('should allow instantiate services lazily', () => {
        const spy = vi.fn();

        const container = makeContainer(builder => builder
            .lazy('a', () => {
                spy();
                return { service: 'a' };
            }),
        );

        expect(spy).not.toHaveBeenCalled();
        expect(container.a).toEqual({ service: 'a' });
        expect(spy).toHaveBeenCalledTimes(1);
        expect(container.a).toEqual({ service: 'a' });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should allow to lazy services with dependencies', () => {
        const spy = vi.fn();

        const container = makeContainer(builder => builder
            .lazy('a', () => ({ service: 'a' }))
            .lazy('b', c => {
                spy();
                return { service: `b depends on ${ c.a.service }` };
            }),
        );

        expect(spy).not.toHaveBeenCalled();
        expect(container.a).toEqual({ service: 'a' });
        expect(spy).not.toHaveBeenCalled();
        expect(container.b).toEqual({ service: 'b depends on a' });
        expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should not allow to redefine a service', () => {
        expect(() =>
            makeContainer(builder => builder
                .lazy('a', () => ({ service: 'a' }))
                .lazy('a', () => ({ service: 'b' })),
            ),
        ).toThrowError('Service "a" is already defined');
    });

    it('should not allow to redefine toString etc.', () => {
        expect(() =>
            makeContainer(builder => builder
                .lazy('toString', () => 'custom toString'),
            ),
        ).toThrowError('Cannot redefine built-in property "toString"');
        expect(() =>
            makeContainer(builder => builder
                .lazy('__proto__', () => 'custom __proto__'),
            ),
        ).toThrowError('Cannot redefine built-in property "__proto__"');
    });

    it('should allow to define services eagerly', () => {
        const container = makeContainer(builder => builder
            .eager('a', () => ({ service: 'a' })),
        );

        expect(container.a).toEqual({ service: 'a' });
    });

    it('should allow to define async services eagerly', async () => {
        const container = await makeContainer(builder => builder
            .eager('a', async () => ({ service: 'a' })),
        );

        expect(container.a).toEqual({ service: 'a' });
    });

    it('should allow lazy services to depend on eager services', () => {
        const container = makeContainer(builder => builder
            .eager('a', () => ({ service: 'a' }))
            .lazy('b', c => ({ service: `b depends on ${ c.a.service }` })),
        );

        expect(container.a).toEqual({ service: 'a' });
        expect(container.b).toEqual({ service: 'b depends on a' });
    });

    it('should allow lazy services to depend on async eager services', async () => {
        const container = await makeContainer((builder: Builder<EmptyContainer, 'sync'>) => builder
            .eager('a', async () => ({ service: 'a' }))
            .lazy('b', c => ({ service: `b depends on ${ c.a.service }` })));

        expect(container.a).toEqual({ service: 'a' });
        expect(container.b).toEqual({ service: 'b depends on a' });
    });

    it('should allow to compose containers', () => {
        const containerA = makeContainer(builder => builder
            .lazy('a', () => ({ service: 'a' })),
        );

        const containerB = makeContainer(builder => builder
            .eager('b', () => ({ service: 'b' })),
        );

        const composedContainer = makeContainer(builder => builder
            .import(containerA)
            .import(containerB),
        );

        expect(composedContainer.a).toEqual({ service: 'a' });
        expect(composedContainer.b).toEqual({ service: 'b' });
    });

    it('should preserve laziness when composing containers', () => {
        const spyA = vi.fn();

        const containerA = makeContainer(builder => builder
            .lazy('a', () => {
                spyA();
                return { service: 'a' };
            }),
        );

        const composedContainer = makeContainer(builder => builder
            .import(containerA),
        );

        expect(spyA).not.toHaveBeenCalled();
        expect(composedContainer.a).toEqual({ service: 'a' });
        expect(spyA).toHaveBeenCalledTimes(1);
    });

    it('should not be possible to compose containers with the same key', () => {
        expect(() =>
            makeContainer(builder => builder
                .lazy('a', () => ({ service: 'a' }))
                .import(makeContainer(builder => builder
                    .lazy('a', () => ({ service: 'b' })),
                )),
            ),
        ).toThrowError('Service "a" is already defined');
    });

    it('should allow to depend on a service from imported container', () => {
        const containerA = makeContainer(builder => builder
            .lazy('a', () => ({ service: 'a' })),
        );

        const containerB = makeContainer(builder => builder
            .import(containerA)
            .lazy('b', ({ a }) => ({ service: `b depends on ${ a.service }` })),
        );

        expect(containerB.a).toEqual({ service: 'a' });
        expect(containerB.b).toEqual({ service: 'b depends on a' });
    });

    describe('declare', () => {
        it('should allow to provide lazy implementation of declared service', () => {
            const container = makeContainer(builder => builder
                .declare('a').as<{ service: 'a' }>()
                .lazy('a', () => ({ service: 'a' })),
            );

            expect(container.a).toEqual({ service: 'a' });
        });

        it('should not allow to provide eager implementation of declared service', () => {
            expect(() =>
                makeContainer(builder => builder
                    .declare('a').as<{ service: 'a' }>()
                    .eager('a', () => ({ service: 'a' })),
                ),
            ).toThrowError('Declared service "a" cannot be provided eagerly');
        });

        it('should throw if declared service is eagerly used before provided', () => {
            expect(() =>
                makeContainer(builder => builder
                    .declare('a').as<{ service: 'a' }>()
                    .eager('b', ({ a }) => ({ service: `b depends on ${ a.service }` })),
                ),
            ).toThrowError('Declared service "a" is not provided');
        });

        it('should throw if declared service is requested but not provided', () => {
            const container = makeContainer(builder => builder
                .declare('a').as<{ service: 'a' }>(),
            );
            expect(() => container.a).toThrowError('Declared service "a" is not provided');
        });

        it('should throw if declared service is provided twice', () => {
            expect(() =>
                makeContainer(builder => builder
                    .declare('a').as<{ service: 'a' }>()
                    .lazy('a', () => ({ service: 'a1' }))
                    .lazy('a', () => ({ service: 'a2' })),
                ),
            ).toThrowError('Service "a" is already defined');
        });

        it('should allow to provide service for imported container', () => {
            const containerA = makeContainer(builder => builder
                .declare('a').as<{ service: 'a' }>(),
            );

            const containerB = makeContainer(builder => builder
                .import(containerA)
                .lazy('b', ({ a }) => ({ service: `b depends on ${ a.service }` })),
            );

            const composedContainer = makeContainer(builder => builder
                .import(containerB)
                .lazy('a', () => ({ service: 'a' })),
            );

            expect(composedContainer.a).toEqual({ service: 'a' });
            expect(composedContainer.b).toEqual({ service: 'b depends on a' });
        });

        it('should not allow to declared service more than once', () => {
            expect(() =>
                makeContainer(builder => builder
                    .declare('a').as<{ service: 'a' }>()
                    .declare('a').as<{ service: 'a' }>(),
                ),
            ).toThrowError('Service "a" is already declared');
        });

        it('should not allow to declare service with the same name as existing service', () => {
            expect(() =>
                makeContainer(builder => builder
                    .lazy('a', () => ({ service: 'a' }))
                    .declare('a').as<{ service: 'a' }>(),
                ),
            ).toThrowError('Service "a" is already defined');
        });
    });
});
