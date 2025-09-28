#!/bin/bash -ex

docker run --rm -it \
    -p 5173:5173 \
    -v $(pwd):$(pwd) \
    -w $(pwd) \
    node:24 \
    npm run dev -- --host 0.0.0.0