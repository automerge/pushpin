# src structure

Each folder in this directory represents a major entry point to the application.

## main/

Code in the main folder runs in the main electron process. It handles creating windows, registering protocols, and so on. It is vital not to block this process, because the main process handles routing of OS input events to renderers, and so any work done here will block application interactions. (Or so we have been told by the VSCode team as of early 2019.)

## renderer/

The majority of the code for Pushpin lives here, including all the UI and the front-end for the storage engine. Code here prioritizes minimum latency, so that the application always feels snappy and responsive. For web-friendly workloads, consider offloading from the main thread to a WebWorker. As of early 2019, it's not possible to use binary Node libraries in WebWorkers or ServiceWorkers, and the RPC mechanism (sendMessage) was described at Google's Chrome Dev Summit (late 2018) as introducing up to a 10ms latency tax.

## background/

Not a webworker but a hidden Chrome window, running independently of all other aspects of the project. This process is designed for and intended to handle expensive system work like networking, encryption, compression, and CRDT application operations away from the main thread. The background process includes a bit of extra debugging information that lets a user see network peers, currently open documents, and so on.
