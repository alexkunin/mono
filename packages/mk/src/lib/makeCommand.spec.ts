import { describe, it, expect } from 'vitest';
import { makeCommand } from './makeCommand';

function createRecorder() {
    const order: string[] = [];
    return {
        order,
        push: (label: string) => () => order.push(label),
    };
}

describe('makeCommand', () => {
    it('dispatches started then completed', async () => {
        const record = createRecorder();
        const command = makeCommand(async (n: number) => {
            record.push('handler')();
            return n + 1;
        });

        command.started.subscribe(record.push('started'));
        command.completed.subscribe(record.push('completed'));

        await command(1);

        expect(record.order).toEqual(['started', 'handler', 'completed']);
    });

    it('dispatches started then failed', async () => {
        const record = createRecorder();
        const command = makeCommand(async () => {
            record.push('handler')();
            throw new Error('boom');
        });

        command.started.subscribe(record.push('started'));
        command.failed.subscribe(record.push('failed'));

        await expect(command(undefined as never)).rejects.toThrow('boom');
        expect(record.order).toEqual(['started', 'handler', 'failed']);
    });
});
