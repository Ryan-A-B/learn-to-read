#!/bin/bash -ex

docker run --rm -it \
    -v $(pwd):$(pwd) \
    -w $(pwd) \
    node:24 \
    npm run build