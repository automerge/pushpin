# PushPin

A collaborative corkboard app.

Built with Electron and the Dat p2p stack.

A project by [Ink & Switch](https://inkandswitch.com/). 

If you think this is cool, wait until you see what we're working on next. Why not [reach out](hello@inkandswitch.com)? We're always excited to meet folks with similar interests.

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

## Using PushPin

PushPin is an offline-first collaborative cork board. You can make new text notes by double-clicking, and drag-and-drop or paste in text, images, and URLs to a board. 

You can also drag boards and contacts from the search bar onto a board, right click to create new elements like conversation threads or change the background color of a board.

Edit a board title with the little pencil icon next to its name. Press enter to keep your changes.

In the top left is your avatar image. Give yourself a name and a profile picture, then invite someone else to see your work by clicking the clipboard in the search box to copy the URL.

They'll have to paste that link into their search bar and with that, you'll be connected.

You can navigate new places quickly by pressing "/" and then typing part of the name of the board you want to go to or the person you want to share your current view with.

You can also see who's online in the top right corner of your workspace.

## Hacking on PushPin

PushPin is built to be easily extended. You could add new kinds of cards like movies or music, a fancier text editor, a PDF viewer, a deck of cards, or a drum machine. You could replace our card layout with your own code, or build a 3d game using WebGL. The sky's the limit. See [HACKING.md] for a getting started guide.

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

## Contributing

Please do! Bug reports and pull requests are welcome.
