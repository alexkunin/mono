import { makePrefixer } from './makePrefixer';

describe('makePrefixer', () => {
    it('should add a prefix to a string', () => {
        expect(makePrefixer('hello')('world')).toBe('helloworld');
        expect(makePrefixer('')('world')).toBe('world');
        expect(makePrefixer('hello')('')).toBe('hello');
        expect(makePrefixer('')('')).toBe('');
    });
});
