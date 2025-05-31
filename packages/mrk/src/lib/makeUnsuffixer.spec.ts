import { makeUnsuffixer } from './makeUnsuffixer';

describe('makeUnsuffixer', () => {
    it('should strip a suffix from a string', () => {
        expect(makeUnsuffixer('world')('helloworld')).toBe('hello');
        expect(makeUnsuffixer('world')('hello')).toBe(false);
        expect(makeUnsuffixer('')('hello')).toBe('hello');
        expect(makeUnsuffixer('')('')).toBe('');
    });
});
