import { describe } from 'vitest';
import { makeContainer } from './makeContainer';

describe('makeContainer', () => {
    it('should allow to define a service', () => {
        const container = makeContainer(builder => builder
            .define('a', () => ({ service: 'a' })),
        );

        expect(container.a).toEqual({ service: 'a' });
    });

    it('should allow instantiate services lazily', () => {
        const spy = vi.fn();

        const container = makeContainer(builder => builder
            .define('a', () => {
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

    it('should allow to define services with dependencies', () => {
        const spy = vi.fn();

        const container = makeContainer(builder => builder
            .define('a', () => ({ service: 'a' }))
            .define('b', c => {
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
                .define('a', () => ({ service: 'a' }))
                .define('a', () => ({ service: 'b' })),
            ),
        ).toThrowError('Service "a" is already defined');
    });

    it('should not allow to redefine toString etc.', () => {
        expect(() =>
            makeContainer(builder => builder
                .define('toString', () => 'custom toString'),
            ),
        ).toThrowError('Cannot redefine built-in property "toString"');
        expect(() =>
            makeContainer(builder => builder
                .define('__proto__', () => 'custom __proto__'),
            ),
        ).toThrowError('Cannot redefine built-in property "__proto__"');
    });
});
