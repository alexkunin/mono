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

export type EmptyContainer = Record<ValidContainerKey, never>;

export type Container<T extends Record<ValidContainerKey, unknown> = EmptyContainer> = T;

export type MergedContainer<A extends Record<ValidContainerKey, unknown>, B extends Record<ValidContainerKey, unknown>> =
    A extends EmptyContainer ? B :
        B extends EmptyContainer ? A :
            Container<A & B>;

export interface Builder<T extends Record<ValidContainerKey, unknown>, Mode extends 'async' | 'sync'> {
    isValidContainerKey(key: unknown): key is ValidContainerKey;

    declare<K extends ValidContainerKey>(key: K): { as<V>(): Builder<MergedContainer<T, { [P in K]: V }>, Mode> };

    lazy<K extends ValidContainerKey, V>(key: K, factory: (container: Container<T>) => V): Builder<MergedContainer<T, { [P in K]: V }>, Mode>;

    eager<K extends ValidContainerKey, V>(key: K, factory: (container: Container<T>) => V): Builder<MergedContainer<T, { [P in K]: Awaited<V> }>, V extends Awaited<V> ? Mode : 'async'>;

    import<R extends Record<ValidContainerKey, unknown>>(container: R): Builder<MergedContainer<T, R>, Mode>;
}

const isPromise = <T>(value: unknown): value is Promise<T> => {
    return !!value && typeof value === 'object' && 'then' in value;
};

const definitionsKey = Symbol('definitions');

class BuilderImplementation {
    constructor(
        private definitions: {
            key: ValidContainerKey;
            factory: (container: Record<string, unknown>) => unknown;
            meta: {
                type: 'eager' | 'lazy' | 'declare';
            };
        }[] = [],
    ) {
    }

    isValidContainerKey(key: unknown): key is ValidContainerKey {
        return typeof key === 'string' && !invalidContainerKeys.has(key as InvalidContainerKey);
    }

    private internalDefine(
        key: ValidContainerKey,
        factory: (container: Record<string, unknown>) => unknown,
        { eager }: { eager: boolean },
    ): this {
        if (!this.isValidContainerKey(key)) {
            throw new Error(`Cannot redefine built-in property "${ key }"`);
        }

        this.definitions.push({
            key,
            factory,
            meta: { type: eager ? 'eager' : 'lazy' },
        });

        return this;
    }

    declare(key: ValidContainerKey): { as(): BuilderImplementation } {
        if (!this.isValidContainerKey(key)) {
            throw new Error(`Cannot redefine built-in property "${ key }"`);
        }

        this.definitions.push({
            key,
            factory: () => ({}),
            meta: { type: 'declare' },
        });

        return { as: () => this };
    }

    lazy(key: ValidContainerKey, factory: (container: Record<string, unknown>) => unknown): this {
        return this.internalDefine(key, factory, { eager: false });
    }

    eager(key: ValidContainerKey, factory: (container: Record<string, unknown>) => unknown): this {
        return this.internalDefine(key, factory, { eager: true });
    }

    import(container: object): this {
        const definitions = (container as { [key in typeof definitionsKey]?: typeof this.definitions })[definitionsKey];
        if (definitions) {
            this.definitions.push(...definitions);
            return this;
        }

        for (const key of Object.keys(container)) {
            if (this.isValidContainerKey(key)) {
                this.definitions.push({
                    key: key as ValidContainerKey,
                    factory: () => (container as Record<ValidContainerKey, unknown>)[key],
                    meta: { type: 'lazy' },
                });
            }
        }
        return this;
    }

    build(): Record<string, unknown> | Promise<Record<string, unknown>> {
        function build(
            definitions: BuilderImplementation['definitions'],
            container: Record<string, unknown>,
            seenKeys: Set<string> = new Set(),
            seenDeclaredKeys: Set<string> = new Set(),
        ): Record<string, unknown> | Promise<Record<string, unknown>> {
            if (definitions.length === 0) {
                return container;
            }

            const [ { factory, key, meta }, ...rest ] = definitions;

            if (seenKeys.has(key)) {
                throw new Error(`Service "${ key }" is already defined`);
            }

            if (meta.type === 'declare') {
                if (seenDeclaredKeys.has(key)) {
                    throw new Error(`Service "${ key }" is already declared`);
                }
                Object.defineProperty(container, key, {
                    get: () => {
                        throw new Error(`Declared service "${ key }" is not provided`);
                    },
                    enumerable: true,
                    configurable: true,
                });
                seenDeclaredKeys.add(key);
                return build(rest, container, seenKeys, seenDeclaredKeys);
            }

            seenKeys.add(key);

            if (meta.type === 'eager') {
                if (seenDeclaredKeys.has(key)) {
                    throw new Error(`Declared service "${ key }" cannot be provided eagerly`);
                }
                const value = factory(container);
                if (isPromise(value)) {
                    return value.then(resolvedValue => {
                        container[key] = resolvedValue;
                        return build(rest, container, seenKeys, seenDeclaredKeys);
                    });
                } else {
                    container[key] = value;
                    return build(rest, container, seenKeys, seenDeclaredKeys);
                }
            } else {
                Object.defineProperty(container, key, {
                    get: () => {
                        const value = factory(container);
                        Object.defineProperty(container, key, {
                            value,
                            writable: true,
                            configurable: true,
                        });
                        return value;
                    },
                    enumerable: true,
                    configurable: true,
                });
                return build(rest, container, seenKeys, seenDeclaredKeys);
            }
        }

        const container: Record<string, unknown> = Object.create(null);

        Object.defineProperty(container, definitionsKey, {
            get: () => {
                return this.definitions;
            },
            enumerable: false,
            configurable: false,
        });

        return build(this.definitions, container);
    }
}

export function makeContainer<
    T extends Record<ValidContainerKey, unknown>,
    Mode extends 'sync' | 'async'
>(
    definitionFactory: (builder: Builder<EmptyContainer, 'sync'>) => Builder<Container<T>, Mode>,
): Mode extends 'sync' ? Container<T> : Promise<Container<T>> {
    const builder = new BuilderImplementation();
    definitionFactory(builder as unknown as Builder<EmptyContainer, 'sync'>);
    return builder.build() as Mode extends 'sync' ? Container<T> : Promise<Container<T>>;
}
