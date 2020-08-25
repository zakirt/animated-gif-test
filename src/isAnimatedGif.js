'use strict';

module.exports = isAnimatedGif;

const GIF_HEADER_LENGTH = 6;
const GIF_LOGICAL_SCREEN_DESCRIPTOR_LENGTH = 7;

/**
 * Checks whether array buffer contains animated GIF.
 * @param {ArrayBuffer} buffer
 * @returns {boolean} true if GIF is animated, false otherwise
 */
function isAnimatedGif(buffer) {
    if (!hasValidGifHeader(buffer)) {
        const message = 'isAnimatedGif(): buffer does not'
            + ' contain valid GIF 89a file representation.';
        throw new TypeError(message);
    }
    const offset = getStartOffset();
    const dataView = new DataView(buffer, offset);
    const globalColorTableSize = getGlobalColorTableSize(dataView);
    const delayTime = getDelayTime(dataView, globalColorTableSize);
    return !!delayTime;
}

function getStartOffset() {
    return GIF_HEADER_LENGTH + GIF_LOGICAL_SCREEN_DESCRIPTOR_LENGTH - 3;
}

function hasValidGifHeader(buffer) {
    const typedArray = new Uint8Array(buffer, 0, GIF_HEADER_LENGTH);
    const str = String.fromCharCode(...typedArray);
    return str === 'GIF89a';
}

function getGlobalColorTableSize(dataView) {
    const globalColorTable = dataView.getUint8(0);
    return hasGlobalColorTableFlag()
        ? calcGlobalColorTableSize(globalColorTable)
        : 0;
}

function hasGlobalColorTableFlag(globalColorTable) {
    return globalColorTable & 0x80;
}

function calcGlobalColorTableSize(globalColorTable) {
    // grab the last 3 bits, to calculate the global color table size -> RGB * 2^(N+1)
    // N is the value in the last 3 bits.
    const globalColorTableSize = 3 * Math.pow(2, (globalColorTable & 0x7) + 1);
    return globalColorTableSize;
}

function getDelayTime(dataView, globalColorTableSize) {
    try {
        const gce = getGraphicsControlExtension(dataView, globalColorTableSize);
        if (isAnimationBlocksPresent(gce)) {
            // skip to the 2 bytes with the delay time
            return dataView.getUint16(gce.offset + 4);
        }
        return 0;
    } catch (e) {
        return 0;
    }
}

function getGraphicsControlExtension(dataView, globalColorTableSize) {
    const offset = globalColorTableSize + 3;
    const extensionIntroducer = dataView.getUint8(offset);
    const graphicsControlLabel = dataView.getUint8(offset + 1);
    return {
        extensionIntroducer,
        graphicsControlLabel,
        offset
    };
}

function isAnimationBlocksPresent({ extensionIntroducer, graphicsControlLabel }) {
    return (extensionIntroducer & 0x21) && (graphicsControlLabel & 0xF9);
}