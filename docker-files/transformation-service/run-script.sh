#!/bin/sh

# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

{
    rm -rf streaming-neo4j-msk-neptune/
    git clone https://github.com/sahays/streaming-neo4j-msk-neptune.git 
    cd /streaming-neo4j-msk-neptune/transformation-app
    npm install
    node index.js
} 2>&1 | tee run-script.log