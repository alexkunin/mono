import { createContext, FunctionComponent, PropsWithChildren, ReactNode, useContext, useRef } from 'react';

const emptyValue = Symbol('emptyValue');

type ProviderProps<Config> =
    [ Config ] extends [ void ] ? PropsWithChildren :
        undefined extends Config ? PropsWithChildren<{ config?: Config }> :
            PropsWithChildren<{ config: Config }>;

type Provider<Config> = FunctionComponent<ProviderProps<Config>>;

type Hook<Context> = () => Context;

export function makeContext<Value, Config>(init: (config: Config) => Value): [ Provider<Config>, Hook<Value> ] {
    const Context = createContext<Value | typeof emptyValue>(emptyValue);

    function ValueProvider(props: ProviderProps<Config>): ReactNode {
        const contextRef = useRef<Value | typeof emptyValue>(emptyValue);

        if (contextRef.current === emptyValue) {
            contextRef.current = init((props as { config: Config }).config);
        }

        return (
            <Context.Provider value={ contextRef.current }>
                { props.children }
            </Context.Provider>
        );
    }

    function useValue() {
        const context = useContext(Context);

        if (context === emptyValue) {
            throw new Error('Context is null');
        }

        return context;
    }

    return [ ValueProvider, useValue ];
}
