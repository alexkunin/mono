export function makeUnsuffixer<S extends string>(
    suffix: S,
): <T extends string>(input: T) => T extends `${ infer R }${ S }` ? R : false {
    return input => {
        if (!input.endsWith(suffix)) {
            return false;
        }
        return input.slice(0, input.length - suffix.length) as any;
    };
}
