export function makePrefixer<P extends string>(prefix: P): <T extends string>(input: T) => `${ P }${ T }` {
    return input => `${ prefix }${ input }`;
}
