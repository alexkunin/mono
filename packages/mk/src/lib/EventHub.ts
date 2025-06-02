import { z } from 'zod';

export class EventHub<T> {
    constructor(
        private readonly eventType: string,
        private readonly detailSchema?: z.ZodType<T>,
        private readonly eventTarget = new EventTarget(),
    ) {
    }

    private makeHandler(callback: (detail: T) => void) {
        return (event: Event) => {
            if (!(event instanceof CustomEvent)) {
                return;
            }

            const parsed = this.detailSchema?.safeParse(event.detail) ?? { success: true, data: event.detail as T };
            if (!parsed.success) {
                return;
            }

            callback(parsed.data);
        };
    }

    dispatch(detail: T): void {
        this.eventTarget.dispatchEvent(new CustomEvent(this.eventType, { detail }));
    }

    subscribe(callback: (detail: T) => void): () => void {
        const handler = this.makeHandler(callback);
        this.eventTarget.addEventListener(this.eventType, handler);
        return () => this.eventTarget.removeEventListener(this.eventType, handler);
    }
}
