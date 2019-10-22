#!/bin/bash

# I don't think this does anything?
cd $(dirname $0)

# Install the manifest file.
# TODO: use system-wide location if root.
# TODO: linux!
if [[ "$OSTYPE" == "linux-gnu" ]]; then
  echo "Linux is not supported" >&2
  exit 1
elif [[ "$OSTYPE" == "darwin"* ]]; then
  if [ "$(whoami)" = "root" ]; then
    TARGET_DIR="/Library/Google/Chrome/NativeMessagingHosts"
  else
    TARGET_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
  fi

  mkdir -p "$TARGET_DIR"
  cp ../dist/com.pushpin.pushpin.json "$TARGET_DIR"
else
  echo "Unsupport OS: ${OSTYPE}" >&2
  exit 1
fi
