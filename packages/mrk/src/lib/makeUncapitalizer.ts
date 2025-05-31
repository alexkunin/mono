export function makeUncapitalizer(): <T extends string>(input: T) => Uncapitalize<T> {
    return <T extends string>(input: T) => input.charAt(0).toLowerCase() + input.slice(1) as Uncapitalize<T>;
}
