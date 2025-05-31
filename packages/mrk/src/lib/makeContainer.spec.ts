import { describe } from 'vitest';
import { Builder, EmptyContainer, makeContainer } from './makeContainer';

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

});
