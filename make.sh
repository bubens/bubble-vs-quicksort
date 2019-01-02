#!/bin/bash

SCRIPTS="./src/sorting.ts" 

DEST="./rel"
FILE="sorting.js"

if [ ! -d "$DEST" ];
  then
    mkdir $DEST;
  else
    rm $DEST/*;
fi

tsc --module amd --target "ES2016" --outFile "$DEST/$FILE" --strict --sourceMap $SCRIPTS &&
echo "Success!";