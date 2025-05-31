export function makeCapitalizer(): <T extends string>(input: T) => Capitalize<T> {
    return <T extends string>(input: T) => input.charAt(0).toUpperCase() + input.slice(1) as Capitalize<T>;
}
