#!/bin/bash
exec 2> /tmp/clipper-host.error.log
DIR=${BASH_SOURCE%/*}
ELECTRON_RUN_AS_NODE=1 __NODE_PATH__ $DIR/clipper-host.js