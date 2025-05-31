import { makeUnprefixer } from './makeUnprefixer';

describe('makeUnprefixer', () => {
    it('should strip a prefix from a string', () => {
        expect(makeUnprefixer('hello')('helloworld')).toBe('world');
        expect(makeUnprefixer('world')('hello')).toBe(false);
        expect(makeUnprefixer('')('hello')).toBe('hello');
        expect(makeUnprefixer('')('')).toBe('');
    });
});
