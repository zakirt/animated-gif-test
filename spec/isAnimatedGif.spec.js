'use strict';

const fs = require('fs');
const path = require('path');
const isAnimatedGif = require('../src/isAnimatedGif');

describe('isAnimatedGif', () => {
    let gifBufferMock;

    it('throws TypeError if the buffer is not a valid GIF', () => {
        const buffer = new ArrayBuffer(10);
        const message = 'isAnimatedGif(): buffer does not contain valid GIF format.';
        expect(() => isAnimatedGif(buffer)).toThrowError(new TypeError(message));
    });

    it('should throw TypeError if the file does not contain a valid GIF 89a version', () => {
        eachGifFileInDirectory('spec/files/invalid', (filePath) => {
            const buffer = fs.readFileSync(filePath);
            const message = 'isAnimatedGif(): buffer does not contain valid GIF format.';
            expect(() => isAnimatedGif(buffer)).toThrowError(new TypeError(message));
        });
    });

    it('should not throw an error for invalid GIF versions', () => {
        const buffer = buildMinimalNonAnimatedGif87a();
        expect(() => isAnimatedGif(buffer, {
            enforce89aCheck: false
        })).not.toThrowError();
    });

    it('returns true if the buffer confains GIF with animated', () => {
        gifBufferMock = buildAnimatedGif();
        let result = isAnimatedGif(gifBufferMock);
        expect(result).toBe(true);
        gifBufferMock = buildAnimatedGifWithGlobalColorTable();
        result = isAnimatedGif(gifBufferMock);
        expect(result).toBe(true);
    });

    it('returns false if the buffer does not contain GIF with animation', () => {
        const gifBufferMocks = [
            buildMinimalNonAnimatedGif(),
            buildGifWithoutExtensionIntroducer(),
            buildGifWithoutGraphicsLabel(),
            buildWithoutDisposalMethod()
        ];
        gifBufferMocks.forEach((buffer) => {
            let result = isAnimatedGif(buffer);
            expect(result).toBe(false);
        });
    });

    it('returns true for animated GIF 89a files', () => {
        eachGifFileInDirectory('spec/files/animated', (filePath) => {
            const buffer = fs.readFileSync(filePath);
            expect(isAnimatedGif(buffer)).toBe(true);
        });
    });

    it('returns true for anmated GIF file without a valid GIF 89a header, \
      but valid GIF 89a structure', () => {
        eachGifFileInDirectory('spec/files/animated87a', (filePath) => {
            const buffer = fs.readFileSync(filePath);
            expect(isAnimatedGif(buffer, { enforce89aCheck: false })).toBe(true);
        });
    });

    it('returns false for GIF files that do not contain animation', () => {
        eachGifFileInDirectory('spec/files/non-animated', (filePath) => {
            const buffer = fs.readFileSync(filePath);
            expect(isAnimatedGif(buffer)).toBe(false);
        });
    });

    function eachGifFileInDirectory(dirPath, callback) {
        const filePath = path.resolve(dirPath);
        const files = fs.readdirSync(filePath);
        files
            .filter((file) => path.extname(file) === '.gif')
            .forEach((file) => callback(`${filePath}/${file}`));
    }

    function createMockGifBufferBuilder() {
        const buffer = [];
        const mockBuilder = {
            addHeaderBlock(is89a = true) {
                let header;
                if (is89a) {
                    header = [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]; // GIF89a
                } else {
                    header = [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]; // GIF87a
                }
                buffer.push(...header);
                return this;
            },
            addLogicalScreenDescriptor({ hasGlobalColorTable = false } = {}) {
                const arr = [];
                let offset = 4;
                arr[offset++] = hasGlobalColorTable ? 0x91 : 0x0; // dummy values
                if (hasGlobalColorTable) {
                    offset += 12; // we'll assume 0x91
                }
                arr[offset++] = 0x0;
                arr[offset++] = 0x0;
                buffer.push(...arr);
                return this;
            },
            addGraphicsControlExtension({
                extensionIntroducer = 0x0,
                graphicsControlLabel = 0x0,
                byteSize = 0x4,
                packedField = 0x0,
                delayTime = 0x0,
                transparentColorIndex = 0x0
            }) {
                const arr = [
                    extensionIntroducer,
                    graphicsControlLabel,
                    byteSize,
                    packedField,
                    delayTime,
                    transparentColorIndex,
                    0x0 // block terminator (always 0)
                ];
                buffer.push(...arr);
                return this;
            },
            build() {
                const typedArray = Uint8Array.from(buffer);
                return typedArray.buffer;
            }
        };
        return mockBuilder;
    }

    function buildMinimalNonAnimatedGif() {
        const builder = createMockGifBufferBuilder();
        return builder
            .addHeaderBlock()
            .addLogicalScreenDescriptor()
            .build();
    }

    function buildMinimalNonAnimatedGif87a() {
        const builder = createMockGifBufferBuilder();
        return builder
            .addHeaderBlock(false)
            .addLogicalScreenDescriptor()
            .build();
    }

    function buildGifWithoutExtensionIntroducer() {
        const builder = createMockGifBufferBuilder();
        return builder
            .addHeaderBlock()
            .addLogicalScreenDescriptor()
            .addGraphicsControlExtension({
                graphicsControlLabel: 0xF9
            })
            .build();
    }

    function buildGifWithoutGraphicsLabel() {
        const builder = createMockGifBufferBuilder();
        return builder
            .addHeaderBlock()
            .addLogicalScreenDescriptor()
            .addGraphicsControlExtension({
                extensionIntroducer: 0x21
            })
            .build();
    }

    function buildWithoutDisposalMethod() {
        const builder = createMockGifBufferBuilder();
        return builder
            .addHeaderBlock()
            .addLogicalScreenDescriptor()
            .addGraphicsControlExtension({
                extensionIntroducer: 0x21,
                graphicsControlLabel: 0xF9,
                // disposal method is in bits 00011100,
                // and we're only setting bit 00000001
                packedField: 0x0
            })
            .build();
    }

    function buildAnimatedGif() {
        const builder = createMockGifBufferBuilder();
        return builder
            .addHeaderBlock()
            .addLogicalScreenDescriptor()
            .addGraphicsControlExtension({
                extensionIntroducer: 0x21,
                graphicsControlLabel: 0xF9,
                packedField: 0x4
            })
            .build();
    }

    function buildAnimatedGifWithGlobalColorTable() {
        const builder = createMockGifBufferBuilder();
        return builder
            .addHeaderBlock()
            .addLogicalScreenDescriptor({
                hasGlobalColorTable: true
            })
            .addGraphicsControlExtension({
                extensionIntroducer: 0x21,
                graphicsControlLabel: 0xF9,
                packedField: 0x4
            })
            .build();
    }
});