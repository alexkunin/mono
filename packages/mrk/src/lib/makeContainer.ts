const invalidContainerKeys = new Set([
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf',
    '__proto__',
    '__defineGetter__',
    '__defineSetter__',
    '__lookupGetter__',
    '__lookupSetter__',
] as const);

export type InvalidContainerKey = typeof invalidContainerKeys extends Set<infer K> ? K : never;
export type ValidContainerKey = Exclude<string, InvalidContainerKey>;

type EmptyContainer = Record<ValidContainerKey, never>;

type Container<T extends Record<ValidContainerKey, unknown> = EmptyContainer> = T;

type MergedContainer<A extends Record<ValidContainerKey, unknown>, B extends Record<ValidContainerKey, unknown>> =
    A extends EmptyContainer ? B :
        B extends EmptyContainer ? A :
            Container<A & B>;

export interface Builder<T extends Record<ValidContainerKey, unknown> = EmptyContainer> {
    isValidContainerKey(key: unknown): key is ValidContainerKey;

    define<K extends ValidContainerKey, V>(key: K, factory: (container: Container<T>) => V): BuilderImplementation<MergedContainer<T, { [P in K]: V }>>;
}

class BuilderImplementation<T extends Record<ValidContainerKey, unknown> = EmptyContainer> implements Builder<T> {
    constructor(
        private readonly container: Container<T>,
    ) {
    }

    isValidContainerKey(key: unknown): key is ValidContainerKey {
        return typeof key === 'string' && !invalidContainerKeys.has(key as InvalidContainerKey);
    }

    define<K extends ValidContainerKey, V>(key: K, factory: (container: Container<T>) => V): BuilderImplementation<MergedContainer<T, { [P in K]: V }>> {
        if (!this.isValidContainerKey(key)) {
            throw new Error(`Cannot redefine built-in property "${ key }"`);
        }

        if (key in this.container) {
            throw new Error(`Service "${ key }" is already defined`);
        }

        Object.defineProperty(this.container, key, {
            get: () => {
                const value = factory(this.container);
                Object.defineProperty(this.container, key, {
                    value,
                    writable: false,
                    configurable: false,
                    enumerable: true,
                });
                return value;
            },
            enumerable: true,
            configurable: true,
        });

        return new BuilderImplementation<MergedContainer<T, { [P in K]: V }>>(
            this.container as MergedContainer<T, { [P in K]: V }>,
        );
    }
}

export function makeContainer<T extends Record<ValidContainerKey, unknown>>(definitionFactory: (builder: Builder) => Builder<Container<T>>): Container<T> {
    const container = Object.create(null);
    const builder = new BuilderImplementation(container);
    definitionFactory(builder);
    return container as Container<T>;
}
