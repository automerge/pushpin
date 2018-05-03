# PushPin

A collaborative corkboard app.

Built with Electron and the Dat p2p stack.

## Running

```console
$ npm install
$ npm start
```

To enable debug logging, e.g.:

```console
$ DEBUG=* npm start
$ DEBUG=pushpin:* npm start
$ DEBUG=pushpin:card npm start
```

To run multiple clients and test syncing:

```console
$ npm run start2
```

This is an alias for:

```console
$ NAME=userA npm start & NAME=userB npm start
```

User data is stored in `./data/<NAME>`, this example will create `./data/userA` and `./data/userB` directories. You can remove a user directory to reset a user's data, or remove the entire data directory to reset all user data.

