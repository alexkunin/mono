import { fireEvent, render } from '@testing-library/react';
import { useCallback, useState } from 'react';

import { makeEventHub } from './makeEventHub';

describe('makeProvider', () => {

    it('should allow parametrized subscribing', () => {
        const [ Provider, useDispatch, useEvent ] = makeEventHub<{
            myEvent: { foo: string };
        }>();

        const Sender = () => {
            const dispatch = useDispatch();
            return <button data-testid="button" onClick={ () => dispatch('myEvent', { foo: 'bar' }) }/>;
        };

        const Subscriber = () => {
            const [ value, setValue ] = useState<string>();
            useEvent('myEvent', useCallback(({ foo }) => setValue(foo), []));
            return value;
        };

        const { getByTestId, queryByText } = render(
            <Provider>
                <Sender/>
                <Subscriber/>
            </Provider>,
        );

        fireEvent.click(getByTestId('button'));
        expect(queryByText('bar')).toBeTruthy();
    });

    it('should allow to use generated dispatcher', () => {
        const [ Provider, { useDispatchMy }, useEvent ] = makeEventHub<{
            my: { foo: string };
        }>();

        const Sender = () => {
            const dispatchMyEvent = useDispatchMy();
            return <button data-testid="button" onClick={ () => dispatchMyEvent({ foo: 'bar' }) }/>;
        };

        const Subscriber = () => {
            const [ value, setValue ] = useState<string>();
            useEvent('my', useCallback(({ foo }) => setValue(foo), []));
            return value;
        };

        const { getByTestId, queryByText } = render(
            <Provider>
                <Sender/>
                <Subscriber/>
            </Provider>,
        );

        fireEvent.click(getByTestId('button'));
        expect(queryByText('bar')).toBeTruthy();
    });


    it('should allow to use generated subscriber', () => {
        const [ Provider, useDispatch, { useMyEvent } ] = makeEventHub<{
            my: { foo: string };
        }>();

        const Sender = () => {
            const dispatch = useDispatch();
            return <button data-testid="button" onClick={ () => dispatch('my', { foo: 'bar' }) }/>;
        };

        const Subscriber = () => {
            const [ value, setValue ] = useState<string>();
            useMyEvent(useCallback(({ foo }) => setValue(foo), []));
            return value;
        };

        const { getByTestId, queryByText } = render(
            <Provider>
                <Sender/>
                <Subscriber/>
            </Provider>,
        );

        fireEvent.click(getByTestId('button'));
        expect(queryByText('bar')).toBeTruthy();
    });

});
