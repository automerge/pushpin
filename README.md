# PushPin

A collaborative corkboard app.

Built with Electron and the Dat p2p stack.

## Running from Source

```console
$ npm install
$ npm start
```

To enable debug logging, e.g.:

```console
$ DEBUG=* npm start
$ DEBUG=pushpin:* npm start
$ DEBUG=pushpin:card,hypermerge:* npm start
```

To run multiple clients and test syncing:

```console
$ npm run start2
```

This is an alias for:

```console
$ NAME=userA npm start & NAME=userB npm start
```

User data is stored in a platform-dependent, shared location outside of the
source code directory. To get the path to your data directory, run in the
console:

```javascript
> require('./constants').USER_PATH
"/Users/mmcgrana/Library/Application Support/Electron/pushpin-v01/mark"
```

You can remove a user directory to reset a user's data, or remove the entire data directory to reset all user data.


## Packaging

To produce a standalone package:

```console
$ electron-forge package
$ open out/PushPin-darwin-x64/PushPin.app  # on Mac, e.g.
```

Note that data directory will be different for the packaged app, even for the
same user name.

## Docs

The source for docs are in `src/docs.html` and hosted on GitHub pages at https://inkandswitch.github.io/pushpin.

To update the docs, edit `docs.html`, run `npm run build-docs`, and push to GitHub.


