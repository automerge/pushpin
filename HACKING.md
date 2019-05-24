![alt_text](docs/iconPushpinLogo.5bbf3057.svg "PushPin logo")


PushPin is a dynamic playground for creating and sharing your ideas. PushPin works online, offline, and with or without access to the broader internet. PushPin is designed to be extended, and we want you to give that a try.

You can make PushPin into almost anything by replacing the right pieces. You could keep it as a "pushpin" style board by adding new kinds of content, or you could replace the board.jsx at the root of the workspace and build almost anything else from a drum machine to a wiki.

# Installing PushPin

Before you begin, you're going to need to install PushPin on your computer.

Go to [github.com/inkandswitch/pushpin](https://github.com/inkandswitch/pushpin) and check out the repository there.

From the checked-out copy, run the following commands:


```
$ npm install
$ npm start
```


By default, your PushPin data will be written to a platform-specific location. You can find the data directory by opening the app and running `> require('./constants).USER_DATA`  If you get in trouble and the app won't run anymore, you can change your username with `export NAME=userB` (or any other name.) If you've somehow corrupted your application data so badly the app won't start please don't delete it! We'd like to see what happened and make the app resilient to that failure mode.


# Extending PushPin

There are a two simple concepts to understand that make PushPin work:

Everything you see in PushPin is Content; where** **Content is a Hypermerge Document (the data) combined with a React Component (the code). Content classes can be loaded from anywhere but are by convention added to `./src/index.jsx` and register themselves with the `ContentTypes `API at the end of their file.

Let's start with a basic example of a PushPin component.


### Thread

Open `./src/components/thread.jsx` in your preferred editor.

You can see that the Thread code looks mostly like a simple React component. That's because it is! The Toggle component gets it state from a Hypermerge document. The document is available inside the component by creating a "handle" to the document from `hypermergeUrl` property. 


## Hypermerge Document

A Hypermerge document is a live, versioned data structure. You can read its contents, change it, and subscribe to it to hear its changes. Every change made to a Hypermerge document is captured and distributed to other instances of the document whether they are within your local document or another user's copy anywhere else in the world.

A document is an instance of an Automerge document. It's a data structure that includes its own full history, along with all the identities of the authors that edited it. You can treat it like a basic Javascript object, and store and nest numbers, strings, arrays, or maps. To read it, just index into it like any other Javascript object.

To update your document, create a handle from the hypermergeUrl, and then modify it via the `change() `function. Inside the callback, mutate the data structure how you like, and Automerge will record the changes you make and append them to your personal work log for distribution to other clients.

Those changes are also written into a Hypercore. Hypercore is an append-only log which is subsequently distributed using Hyperdiscovery to any other client who has the key to request it. Each entry in a hypercore is signed with the previous element's hash and a private key only the author has access to. This ensures that hypercores can be validated and distributed by anyone regardless of their contents.

When a new user wants to submit changes to your hypermerge document, they offer a hypercore to your client that will include their work. Your client accepts those changes and, as they arrive, surfaces all changes made either locally or remotely to your React component within the onChange handler.


## React Component

React components are essentially bundles of state and rendering logic. They define new pseudo-tags in your application. In our environment, we take components like `TextContent`, `ImageContent`, and `Thread `and nest them inside other components like the `Board` or the `Workspace` which provide navigation or other infrastructure.

To make them work with Hypermerge, the generic <`Content/>` component will look up a React component to instantiate based on the type field of the pushpin URL. Then it will pass in the docID as a property to the component.

From there, the component creates a handle to the Hypermerge document and listens to it for changes.

_This is not really standard React style. Sorry about that!_

In order to keep this as close as possible to the promise of React (the component you render is a pure function of the props and internal state objects) we provide a little boilerplate for the most common case -- a single React document per component. This works great for almost every part of our system, except for a few complicated cases like the omnibox and particularly board invitations

If you want to use more than one document handle in a single component, check the invitations-view or look at `.src/components/workspace/share.jsx` for reasonably simple sample code. Essentially, you'll create a handle for each document you want to listen to and create onChange handlers for each that will update your component's state.

_Some future version of PushPin will hopefully replace this design with something that looks more like the mapStateToProps approach used by Redux._


## The PushPin Data Model

Out of the box, PushPin consists of a number of nested documents. The outermost document is your workspace, which contains references to everything below it. The image below shows approximately how this works but probably has some out of date class or field names, so don't treat it as canonical.

![alt_text](docs/data-architecture.png "data architecture")



## Everything is Content

All of the elements described above are instantiated as "Content" blocks in the application. That means that there is a place in the application with a tag that looks like this:

	


```
<Content url="pushpin://board/23409ad08d7c6a7d7fe793561/D3x"/>
<Content url="pushpin://title-bar/23409ad08d7c6a7d7fe793561"/>
```


In theory, anywhere you see a content node, any kind of content can be loaded. In practice, we are still developing the programming models and APIs to make this ergonomic. For example, you can place a `<Content type="board"/>` inside another board, but the code for drag-and-drop and the context menu to create new cards might not do what you want.

**Context**

You can ignore the context property of a content object when you're getting started, and it is optional for components. By default, without specifying a context like `<Content context="title-bar"/>` the system will load the default component for a particular document type. When registering a component, if you don't specify a "context" property, that component will be used any time a more specific context is not available.

That said, it can be handy to render different versions of a document type under different circumstances. For example, when placed on another board, the "board" component appears as a link. When rendered as a search result in the omnibox, it appears as a list entry, and when rendered at the root of the workspace, it is an actual board for arranging cards upon. Similarly, user avatars appear somewhat differently throughout the application.

To see examples of this in action, see the `./src/components/contact` directory.

_If you have suggestions about how to improve this model, please let us know!_


## Making your own Content type



1.  Duplicate and rename  `./src/components/thread.jsx`.  \
For example: `./src/components/helloworld.jsx`
1.  Rename the component `Class`: \
`export default class HelloWorld extends` […]
1.  Edit `index.jsx` to load your component: \
`import './components/helloworld.jsx'`
1.  Write some code that renders something interesting! Implement some actions that modify data to share with the world. If you want to use ephemeral data, look for the heartbeat code around avatars as an example, or how selections work on board.jsx.
1.  Add CSS styles as required using an inline CSS as per thread-content.jsx or just stick them in app.css. Feel free to improve on this if you have a better idea.
1.  Modify the component registry at the bottom of your component file to describe your component. Consider what (if anything) the min, max, and default Width and Height should be and set those as class properties.


### The Component Registry

The component registry is a simple dictionary of components. Every component gets a class, a name, an icon (we use [line-awesome](https://icons8.com/line-awesome/cheatsheet) for icons), and a text string of its name for showing users. In addition there are some special properties you can add optionally:

`context: (string: default "default") `-- see "Context" above

`resizable: (bool: default true)` -- should the component have a resize thumb?

`unlisted: (bool: default false)` -- list this in the board's context menu?


## Good luck!

PushPin is a number of things: a useful tool, an experiment in programming models, and a proof of concept of a technical stack. Hopefully it's also a bunch of fun to play with and experiment on and we look forward to seeing what you build with it. Pull requests are very welcome (we could always use more useful components) and bug reports will be at least considered.

*Please reach out to @pvh if you have questions, ideas, or suggestions. Let me know if you get stuck, or if you're wondering how to begin. I'd love to hear about what you're doing.*
