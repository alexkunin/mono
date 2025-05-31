import { makeTransformer } from './makeTransformer';

describe('makeTransformer', () => {
    it('should compose functions', () => {
        const toUpperCase = (input: string) => input.toUpperCase();
        const addExclamation = (input: string) => `${ input }!`;
        const addQuestionMark = (input: string) => `${ input }?`;
        const transformer = makeTransformer(toUpperCase, addExclamation, addQuestionMark);
        expect(transformer('hello')).toBe('HELLO!?');
    });

    it('should work with no functions', () => {
        const transformer = makeTransformer();
        expect(transformer('hello')).toBe('hello');
    });

    it('should work with one function', () => {
        const toUpperCase = (input: string) => input.toUpperCase();
        const transformer = makeTransformer(toUpperCase);
        expect(transformer('hello')).toBe('HELLO');
    });

    it('should work mixed types', () => {
        const booleanToString = (input: boolean) => input.toString();
        const stringLength = (input: string) => input.length;
        const numberToString = (input: number) => input.toString();
        const addTwelve = (input: number) => input + 12;
        const splitToLetters = (input: string) => input.split('');
        const transformer = makeTransformer(
            booleanToString,
            stringLength,
            addTwelve,
            numberToString,
            splitToLetters,
        );
        expect(transformer(true)).toEqual([ '1', '6' ]);
    });
});
