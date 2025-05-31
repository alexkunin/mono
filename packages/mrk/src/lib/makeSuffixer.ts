export function makeSuffixer<S extends string>(suffix: S): <T extends string>(input: T) => `${ T }${ S }` {
    return <T extends string>(input: T) => `${ input }${ suffix }`;
}
