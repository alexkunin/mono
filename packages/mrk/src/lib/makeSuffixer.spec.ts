import { makeSuffixer } from './makeSuffixer';

describe('makeSuffixer', () => {
    it('should add a suffix to a string', () => {
        expect(makeSuffixer('world')('hello')).toBe('helloworld');
        expect(makeSuffixer('')('hello')).toBe('hello');
        expect(makeSuffixer('world')('')).toBe('world');
        expect(makeSuffixer('')('')).toBe('');
    });
});
