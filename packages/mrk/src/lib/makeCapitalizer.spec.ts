import { makeCapitalizer } from './makeCapitalizer';

describe('makeCapitalizer', () => {
    it('should capitalize the first letter of a string', () => {
        expect(makeCapitalizer()('hello')).toBe('Hello');
        expect(makeCapitalizer()('helloWorld')).toBe('HelloWorld');
        expect(makeCapitalizer()('')).toBe('');
        expect(makeCapitalizer()('a')).toBe('A');
        expect(makeCapitalizer()('1abc')).toBe('1abc');
    });
});
