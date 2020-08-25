'use strict';

const isAnimatedGif = require('./src/isAnimatedGif');

const gifUpload = document.getElementById('gifUpload');
gifUpload.addEventListener('change', onUploadGif);

function onUploadGif({ target }) {
    const file = target.files[0];
    if (file && file.type === 'image/gif') {
        readGifFile(file).then((animated) => outputGifTestResult(animated));
    }
}

function readGifFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.addEventListener('load', (ev) => resolve(isAnimatedGif(ev.target.result)));
        reader.readAsArrayBuffer(file);
    });
}

function outputGifTestResult(animated) {
    const output = document.getElementById('output');
    output.textContent = animated
        ? 'Uploaded GIF file contains animation'
        : 'No animation found in uploaded GIF file';
}