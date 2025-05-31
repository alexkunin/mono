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

    lazy<K extends ValidContainerKey, V>(key: K, factory: (container: Container<T>) => V): Builder<MergedContainer<T, { [P in K]: V }>, Mode>;

    eager<K extends ValidContainerKey, V>(key: K, factory: (container: Container<T>) => V): Builder<MergedContainer<T, { [P in K]: Awaited<V> }>, V extends Awaited<V> ? Mode : 'async'>;
}

const isPromise = <T>(value: unknown): value is Promise<T> => {
    return !!value && typeof value === 'object' && 'then' in value;
};

class BuilderImplementation {
    constructor(
        private definitions: {
            key: ValidContainerKey;
            factory: (container: Record<string, unknown>) => unknown;
            meta: {
                eager: boolean;
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
            meta: { eager },
        });

        return this;
    }

    lazy(key: ValidContainerKey, factory: (container: Record<string, unknown>) => unknown): this {
        return this.internalDefine(key, factory, { eager: false });
    }

    eager(key: ValidContainerKey, factory: (container: Record<string, unknown>) => unknown): this {
        return this.internalDefine(key, factory, { eager: true });
    }

    build(): Record<string, unknown> | Promise<Record<string, unknown>> {
        function build(
            definitions: BuilderImplementation['definitions'],
            container: Record<string, unknown> = {},
        ): Record<string, unknown> | Promise<Record<string, unknown>> {
            if (definitions.length === 0) {
                return container;
            }

            const [ current, ...rest ] = definitions;

            if (Object.prototype.hasOwnProperty.call(container, current.key)) {
                throw new Error(`Service "${ current.key }" is already defined`);
            }

            if (current.meta.eager) {
                const value = current.factory(container);
                if (isPromise(value)) {
                    return value.then(resolvedValue => {
                        container[current.key] = resolvedValue;
                        return build(rest, container);
                    });
                } else {
                    container[current.key] = value;
                    return build(rest, container);
                }
            } else {
                Object.defineProperty(container, current.key, {
                    get: () => {
                        const value = current.factory(container);
                        Object.defineProperty(container, current.key, {
                            value,
                            writable: true,
                            configurable: true,
                        });
                        return value;
                    },
                    enumerable: true,
                    configurable: true,
                });
                return build(rest, container);
            }
        }

        return build(this.definitions);
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
