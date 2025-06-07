import { EventHub } from '../eventHub';

export interface Command<I, O> {
    (input: I): Promise<O>;
    readonly started: EventHub<I>;
    readonly completed: EventHub<{ input: I; result: O }>;
    readonly failed: EventHub<{ input: I; error: unknown }>;
}

export function makeCommand<I, O>(
    handler: (input: I) => Promise<O> | O,
): Command<I, O> {
    const target = new EventTarget();
    const started = new EventHub<I>('started', undefined, target);
    const completed = new EventHub<{ input: I; result: O }>('completed', undefined, target);
    const failed = new EventHub<{ input: I; error: unknown }>('failed', undefined, target);

    async function command(input: I): Promise<O> {
        started.dispatch(input);
        try {
            const result = await handler(input);
            completed.dispatch({ input, result });
            return result;
        } catch (error) {
            failed.dispatch({ input, error });
            throw error;
        }
    }

    return Object.assign(command, { started, completed, failed });
}
