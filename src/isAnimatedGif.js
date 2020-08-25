'use strict';

module.exports = isAnimatedGif;

const GIF_HEADER_LENGTH = 6;
const GIF_LOGICAL_SCREEN_DESCRIPTOR_LENGTH = 7;

/**
 * Checks whether array buffer contains animated GIF.
 * @param {ArrayBuffer|Buffer} buffer
 * @param {Object} [options] additional flags for handling GIF animation test
 * @param {boolean} options.enforce89aCheck enforces GIF89a version check in the file header.
 * defaults to true.
 * @returns {boolean} true if GIF is animated, false otherwise
 */
function isAnimatedGif(buffer, { enforce89aCheck = true } = { enforce89aCheck: true }) {
    buffer = convertToArrayBufferIfNeeded(buffer);
    throwIfNotValidGif(buffer, enforce89aCheck);
    const offset = getStartOffset();
    const dataView = new DataView(buffer, offset);
    const isAnimated = isContainingAnimationData(dataView);
    return isAnimated;
}

function convertToArrayBufferIfNeeded(buffer) {
    if (buffer instanceof ArrayBuffer) {
        return buffer;
    }
    return new Uint8Array(buffer).buffer;
}

function throwIfNotValidGif(buffer, enforce89aCheck) {
    if (!hasValidGifHeader(buffer, enforce89aCheck)) {
        const message = 'isAnimatedGif(): buffer does not contain valid GIF format.';
        throw new TypeError(message);
    }
}

function getStartOffset() {
    return GIF_HEADER_LENGTH + GIF_LOGICAL_SCREEN_DESCRIPTOR_LENGTH - 3;
}

function hasValidGifHeader(buffer, enforce89aCheck) {
    const typedArray = new Uint8Array(buffer, 0, GIF_HEADER_LENGTH);
    const str = String.fromCharCode(...typedArray);
    return enforce89aCheck ? (str === 'GIF89a') : str.startsWith('GIF');
}

function getGlobalColorTableSize(dataView) {
    const packedField = dataView.getUint8(0);
    return hasGlobalColorTableFlag(packedField)
        ? calcGlobalColorTableSize(packedField)
        : 0;
}

function hasGlobalColorTableFlag(packedField) {
    return packedField & 0x80;
}

function calcGlobalColorTableSize(globalColorTable) {
    // grab the last 3 bits, to calculate the global color table size -> RGB * 2^(N+1)
    // N is the value in the last 3 bits.
    const N = globalColorTable & 0x7;
    const globalColorTableSize = 3 * 2 ** (N + 1);
    return globalColorTableSize;
}

function isContainingAnimationData(dataView) {
    try {
        const gce = extractGraphicsControlExtension(dataView);
        if (isGceBlocksPresent(gce)) {
            const disposalMethod = extractDisposalMethod(gce.packedField);
            return !!disposalMethod;
        }
        return false;
    } catch (e) {
        if (e instanceof RangeError) {
            return false;
        }
        throw e;
    }
}

function extractDisposalMethod(packedField) {
    const disposalMethod = (packedField >> 2) & 0x7;
    return disposalMethod;
}

function extractGraphicsControlExtension(dataView) {
    const globalColorTableSize = getGlobalColorTableSize(dataView);
    const offset = globalColorTableSize + 3;
    const extensionIntroducer = dataView.getUint8(offset);
    const graphicsControlLabel = dataView.getUint8(offset + 1);
    const packedField = dataView.getUint8(offset + 3);
    return {
        extensionIntroducer,
        graphicsControlLabel,
        packedField
    };
}

function isGceBlocksPresent({ extensionIntroducer, graphicsControlLabel }) {
    return (extensionIntroducer & 0x21) && (graphicsControlLabel & 0xF9);
}