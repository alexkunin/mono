export function makeUnprefixer<P extends string>(prefix: P): <T extends string>(input: T) => T extends `${ P }${ infer R }` ? R : false;
export function makeUnprefixer(prefix: string): (input: string) => string | false {
    return input => input.startsWith(prefix) ? input.slice(prefix.length) : false;
}
