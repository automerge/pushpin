# PushPin

[A collaborative corkboard app.](http://inkandswitch.github.io/pushpin)

[Join our Slack to ask questions, share ideas, or meet other users!](https://communityinviter.com/apps/automerge/automerge)

Built with Electron, React, automerge and the Dat p2p stack.

A project initiated by [Ink & Switch](https://inkandswitch.com/).

## Running from Source

```console
$ nvm use 12
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
"/Users/mmcgrana/Library/Application Support/pushpin/pushpin-v11/mark"
```

You can remove a user directory to reset a user's data, or remove the entire data directory to reset all user data.

## Using PushPin

PushPin is an offline-first collaborative cork board. You can make new text notes by double-clicking, and drag-and-drop or paste in text, images, and URLs to a board.

You can also drag boards and contacts from the search bar onto a board, right click to create new elements like conversation threads or change the background color of a board.

In the top left is your avatar image. Give yourself a name and a profile picture, then invite someone else to see your work by clicking the clipboard in the search box to copy the URL.

They'll have to paste that link into their search bar and with that, you'll be connected.

You can navigate new places quickly by pressing "/" and then typing part of the name of the board you want to go to or the person you want to share your current view with.

You can also see who's online in the top right corner of your workspace.

## Clipper Chrome Extension

Pushpin integrates with the [Clipper chrome extension](https://github.com/pvh/eleanor) to save content from webpages into Pushpin. To set up Clipper, follow the steps in the Clipper README to install the extension.

To build and install the Clipper extension:
```
yarn build:clipper-host
yarn install:clipper-host
```

You should now be able to clip content using the Clipper extension and have it show up in your Omnibox!

## Keeping Your Data Available

[pushpin-peer](https://github.com/mjtognetti/pushpin-peer) is a simple data peer you can use to ensure your pushpin data is available. You can run pushpin peer on a server or in the cloud.

**Important note:**
Due to hypermerge limitations (which we're working on!), syncing between pushpin and pushpin-peer may not work exactly as you would expect. Pushpin will only replicate documents to pushpin-peer which you have actively opened within the pushpin app (i.e. loaded onto a board or navigated to). We're working on improving replication to remove this constraint!

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

- Roshan Choxi
- Ignatius Gilfedder
- Mark McGranaghan
- Jeff Peterson
- Peter van Hardenberg
  and was produced under the auspices of [Ink & Switch](inkandswitch.com).

Special thanks to Martin Kleppmann (automerge) and Mathias Buus (hypercore) for their advice and contributions.

## Upgrade Hackage Notes

### sodium-native

Compiling sodium-native is a pain. Go into node_modules/sodium-native and run `node preinstall` if you have trouble.

### package.json resolutions

- `"automerge": "github:automerge/automerge#opaque-strings"`
  - Automerge's typescript declarations mess up opaque string types (`string & { foo: bar }`) when
    freezing objects, so we have a branch that supports it. Can remove after that branch is merged
    to automerge.
- `"sharp": "^0.23.1"`
  - `"icon-tool-mac": "^1.3.1"` depends on a version of `sharp` that is incompatible with node v12. `sharp@^0.23.1` supports node 12. Can remove if `icon-tool-mac` updates its dependencies.
