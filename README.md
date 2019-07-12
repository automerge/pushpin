# PushPin

[A collaborative corkboard app.](http://inkandswitch.github.io/pushpin)

[Join our Slack to ask questions, share ideas, or meet other users!](https://communityinviter.com/apps/automerge/automerge)

Built with Electron, React, automerge and the Dat p2p stack.

A project initiated by [Ink & Switch](https://inkandswitch.com/).

## Running from Source

```console
$ yarn
$ yarn start
```

To enable debug logging, e.g.:

```console
$ DEBUG=* yarn start
$ DEBUG=pushpin:* yarn start
$ DEBUG=pushpin:card,hypermerge:* yarn start
```

To run multiple clients and test syncing:

```console
$ yarn run start2
```

This is an alias for:

```console
$ NAME=userA yarn start & NAME=userB yarn start
```

To start with the dev tools open, set OPEN_DEV_TOOLS on your CLI as follows:
```console
$ OPEN_DEV_TOOLS=true yarn start
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

In the top left is your avatar image. Give yourself a name and a profile picture, then invite someone else to see your work by clicking the clipboard in the search box to copy the URL.

They'll have to paste that link into their search bar and with that, you'll be connected.

You can navigate new places quickly by pressing "/" and then typing part of the name of the board you want to go to or the person you want to share your current view with.

You can also see who's online in the top right corner of your workspace.

## Hacking on PushPin

PushPin is built to be easily extended. You could add new kinds of cards like movies or music, a fancier text editor, a PDF viewer, a deck of cards, or a drum machine. You could replace our card layout with your own code, or build a 3d game using WebGL. The sky's the limit.

See [HACKING](HACKING.md) for a getting started guide.

## Packaging

Create a package for your platform with `yarn dist`.

## Docs

The source for docs are in `src/docs.html` and hosted on GitHub pages at https://inkandswitch.github.io/pushpin.

To update the docs, edit `docs.html`, run `yarn run build-docs`, and push to GitHub.

## Contributing

Please do! Bug reports and pull requests are welcome.

## Credits

This project was written by
 * Roshan Choxi
 * Ignatius Gilfedder
 * Mark McGranaghan
 * Jeff Peterson
 * Peter van Hardenberg
and was produced under the auspices of [Ink & Switch](inkandswitch.com).

Special thanks to Martin Kleppmann (automerge) and Mathias Buus (hypercore) for their advice and contributions.

## Upgrade Hackage Notes

### sodium-native
Compiling sodium-native is a pain. Go into node_modules/sodium-native and run `node preinstall` if you have trouble.

### automerge
There's a regression in Automerge where types are being wrapped in a proxy preventing instanceof Text from working correctly. Until a fix arrives, edit node_modules/hypermerge/node_modules/automerge/frontend/context.js#69 and change value instanceof Text to value.constructor.name === "Text".
