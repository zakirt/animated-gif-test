# Animated GIF test

Utility for testing whether GIF file is animated, or not.
The repo contains several examples of how the utility can be used in Node.js and browser environments.

## Installing the project

1. Clone, or download the repo to your local drive.
2. Run `npm i` inside the projects's root directory to install the dependencies.

## Running inside the browser

The project is using [parcel bundel NPM module](https://www.npmjs.com/package/parcel-bundler) to bundle the script.
See `index.html` and `index.js` files for example of checking GIF for animation inside the browser.

To bundle and run the script, use the following command:

```
npm run build
```

The site will launch on `localhost:1234`.

## Testing in Node.js environment

The unit tests contain examples of how `isAnimatedGif()` function can be used with Node.js's file reading utilitites.

To run tests use the following command:

```
npm test
```