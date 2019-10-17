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
  # TODO: support system-wide native host when installing as admin
  mkdir -p ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts
  cp ../dist/com.pushpin.pushpin.json ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts
else
  echo "Unsupport OS: ${OSTYPE}" >&2
  exit 1
fi
