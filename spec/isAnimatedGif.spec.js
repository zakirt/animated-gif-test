'use strict';

const isAnimatedGif = require('../src/isAnimatedGif');

describe('isAnimatedGif', () => {
    let gifBufferMock;

    it('throws TypeError if the buffer is not a valid GIF', () => {
        const buffer = new ArrayBuffer(10);
        const message = 'isAnimatedGif(): buffer does not\
 contain valid GIF 89a file representation.';
        expect(() => isAnimatedGif(buffer)).toThrowError(new TypeError(message));
    });

    it('returns true if the GIF is animated', () => {
        gifBufferMock = createMockGifBuffer();
        const result = isAnimatedGif(gifBufferMock);
        expect(result).toBe(true);
    });

    it('returns false for non-animated GIF', () => {
        gifBufferMock = createMockGifBuffer(false);
        const result = isAnimatedGif(gifBufferMock);
        expect(result).toBe(false);
    });

    function createMockGifBuffer(animated = true) {
        const arr = [
            ...createGifHeader(),
            ...createLogicalScreenDescriptor(),
            ...createGraphicsControlExtension(animated)
        ];
        const typedArray = Uint8Array.from(arr);
        return typedArray.buffer;
    }

    function createGifHeader() {
        const header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]; // GIF89a
        return header;
    }

    function createLogicalScreenDescriptor() {
        const offset = 4; // descriptor - 3 bytes
        const arr = [];
        arr[offset] = 0x91;
        return arr;
    }

    function createGraphicsControlExtension(animated) {
        const arr = [];
        let offset = 2;
        if (animated) {
            arr[offset] = 0x21; // extension introducer
            arr[offset + 1] = 0xF9; // graphics control label
            // delay time
            offset += 4;        // skip 4 bytes to delay time
            arr[offset++] = 0x64;
            arr[offset] = 0;
        }
        return arr;
    }
});