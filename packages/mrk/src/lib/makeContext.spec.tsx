import { render } from '@testing-library/react';

import { makeContext } from './makeContext';

describe('makeContext', () => {

    it('should provide values from initializer function', () => {
        const [ Provider, hook ] = makeContext(() => ({
            foo: 'bar',
        }));

        const Consumer = () => {
            const context = hook();
            return context.foo;
        };

        const { queryByText } = render(
            <Provider>
                <Consumer/>
            </Provider>,
        );

        expect(queryByText('bar')).toBeTruthy();
    });

    it('should provide values from config object', () => {
        const [ Provider, hook ] = makeContext((value: string) => ({
            foo: value,
        }));

        const Consumer = () => {
            const context = hook();
            return context.foo;
        };

        const { queryByText } = render(
            <Provider config={ 'bar' }>
                <Consumer/>
            </Provider>,
        );

        expect(queryByText('bar')).toBeTruthy();
    });

    it('should not require optional config object', () => {
        const [ Provider, hook ] = makeContext((value?: string) => ({
            foo: value ?? 'bar',
        }));

        const Consumer = () => {
            const context = hook();
            return context.foo;
        };

        const { queryByText } = render(
            <Provider>
                <Consumer/>
            </Provider>,
        );

        expect(queryByText('bar')).toBeTruthy();
    });

    it('should process config object even if not required', () => {
        const [ Provider, hook ] = makeContext((value?: string) => ({
            foo: value ?? 'bar',
        }));

        const Consumer = () => {
            const context = hook();
            return context.foo;
        };

        const { queryByText } = render(
            <Provider config={ 'bar' }>
                <Consumer/>
            </Provider>,
        );

        expect(queryByText('bar')).toBeTruthy();
    });

    it('should throw if hook used outside provider', () => {
        const [ , hook ] = makeContext(() => ({
            foo: 'bar',
        }));

        const Consumer = () => {
            hook();
            return null;
        };

        expect(() => render(<Consumer/>)).toThrow('Context is null');
    });

});
