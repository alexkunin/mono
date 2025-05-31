import { makeUncapitalizer } from './makeUncapitalizer';

describe('makeUncapitalizer', () => {
    it('should uncapitalize the first letter of a string', () => {
        expect(makeUncapitalizer()('Hello')).toBe('hello');
        expect(makeUncapitalizer()('HelloWorld')).toBe('helloWorld');
        expect(makeUncapitalizer()('')).toBe('');
        expect(makeUncapitalizer()('A')).toBe('a');
        expect(makeUncapitalizer()('1abc')).toBe('1abc');
    });
});
