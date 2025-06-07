import { FunctionComponent, PropsWithChildren, useCallback, useEffect } from 'react';
import { EventHub } from '@alexkunin/mk';
import { makeContext } from '../makeContext';

type EventMap = { [K in string]: unknown };

type Provider = FunctionComponent<PropsWithChildren>

type DispatcherHookName<K extends string> = `useDispatch${ Capitalize<K> }`;

type DispatcherHookMap<E extends EventMap> = { [K in keyof E & string as DispatcherHookName<K>]: () => (data: E[K]) => void };

type DispatcherHook<E extends EventMap> = () => <K extends keyof E>(event: K, data: E[K]) => void;

type SubscriberHookName<K extends string> = `use${ Capitalize<K> }Event`;

type SubscriberHookMap<E extends EventMap> = { [K in keyof E & string as SubscriberHookName<K>]: (callback: (data: E[K]) => void) => void };

type SubscriberHook<E extends EventMap> = <K extends keyof E>(event: K, callback: (data: E[K]) => void) => void;

export function makeEventHub<E extends EventMap>(): [ Provider, DispatcherHook<E> & DispatcherHookMap<E>, SubscriberHook<E> & SubscriberHookMap<E> ] {
    const hubs: { [key in keyof E]?: EventHub<E[key]> } = {};
    const [ Provider, hook ] = makeContext(() => new EventTarget());

    const cache = Symbol('cache');

    function useDispatcher<K extends keyof E>() {
        const eventTarget = hook();
        return useCallback((event: K, data: E[K]) => {
            hubs[event] ??= new EventHub<E[K]>(event as string, undefined, eventTarget);
            hubs[event].dispatch(data);
        }, [ eventTarget ]);
    }

    type AugmentedDispatcherHook = DispatcherHook<E> & {
        [cache]: Record<string, (data: unknown) => unknown>;
    };

    const dispatcherHookProxy = new Proxy(
        Object.assign(useDispatcher, { [cache]: {} }) as AugmentedDispatcherHook,
        {
            get(
                target,
                prop,
            ) {
                if (typeof prop !== 'string') {
                    return;
                }
                if (!target[cache][prop]) {
                    const type = prop.replace(/^useDispatch(\w)(\w+)$/, (_, f, t) => f.toLowerCase() + t);
                    target[cache][prop] = function useNamedDispatcher() {
                        const dispatcher = target();
                        return useCallback(<K extends keyof E>(data: E[K]) => dispatcher(type as K, data), [ dispatcher ]);
                    };
                }
                return target[cache][prop];
            },
        },
    ) as unknown as DispatcherHook<E> & DispatcherHookMap<E>;

    function useSubscriber<K extends keyof E>(event: K, handler: (data: E[K]) => void) {
        const eventTarget = hook();

        useEffect(() => {
            hubs[event] ??= new EventHub<E[K]>(event as string, undefined, eventTarget);
            return hubs[event].subscribe(handler);
        }, [ eventTarget, event, handler ]);
    }

    type AugmentedSubscriberHook = SubscriberHook<E> & {
        [cache]: Record<string, (callback: (data: unknown) => void) => unknown>;
    };

    const subscriberHookProxy = new Proxy(
        Object.assign(useSubscriber, { [cache]: {} }) as AugmentedSubscriberHook,
        {
            get(
                target,
                prop,
            ) {
                if (typeof prop !== 'string') {
                    return;
                }
                if (!target[cache][prop]) {
                    const type = prop.replace(/^use(\w)(\w+)Event$/, (_, f, t) => f.toLowerCase() + t);
                    target[cache][prop] = (callback: (data: unknown) => void) => target(type, callback);
                }
                return target[cache][prop];
            },
        },
    ) as unknown as SubscriberHook<E> & SubscriberHookMap<E>;

    return [ Provider, dispatcherHookProxy, subscriberHookProxy ];
}
