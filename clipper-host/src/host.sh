#!/bin/bash
DIR="$( cd "$(dirname ${BASH_SOURCE[0]})" && pwd)"
ELECTRON_RUN_AS_NODE=1 $DIR/../../node_modules/.bin/electron $DIR/index.js