type Composition<T extends unknown[]> =
    T extends [ (input: infer A) => infer B ]
        ? (input: A) => B
        : T extends [ (input: infer A) => infer B, ...infer Rest ]
            ? Rest extends [ (input: B) => unknown, ...unknown[] ]
                ? (input: A) => Composition<Rest>
                : never
            : never;

export function makeTransformer<
    T extends ((input: any) => any)[]
>(...transformers: T): T extends [] ? <R>(input: R) => R : Composition<T> {
    return ((input: unknown) => transformers.reduce((acc, transformer) => transformer(acc), input)) as T extends [] ? <R>(input: R) => R : Composition<T>;
}
