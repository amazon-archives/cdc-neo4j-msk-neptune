// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const { fileToJson } = require("../utils/read-file");
const { overwriteFile } = require("../utils/write-file");
const { getMskConnectionString, createConfiguration } = require("./msk-setup");
const sharedFolder = "/data";

const describeNeptuneStack = fileToJson(
  sharedFolder + "/streaming-blog-neptune-stack.json"
);
const describeMskStack = fileToJson(
  sharedFolder + "/streaming-blog-msk-stack.json"
);
const neptuneStack = describeNeptuneStack.Stacks[0];
const mskStack = describeMskStack.Stacks[0];
const neptuneClusterEnpoint = neptuneStack.Outputs[0].OutputValue;
const mskCluster = mskStack.Outputs[0].OutputValue;

const asyncGetConnectionStrings = async () => {
  try {
    const connectionStrings = await getMskConnectionString({
      mskCluster
    });
    const output = [
      "export BOOTSTRAP_SERVERS=" + connectionStrings.broker,
      "export ZOOKEEPER_CONNECT=" + connectionStrings.zookeeper,
      "export NEPTUNE_HOST=" + neptuneClusterEnpoint // for docker gremlin
    ];
    overwriteFile(sharedFolder + "/setup-env.sh", output.join("\n"));
  } catch (e) {
    console.log(e);
  }
};

const asyncCreateConfiguration = async () => {
  try {
    await createConfiguration();
  } catch (e) {
    console.log(e);
  }
};

asyncGetConnectionStrings();
asyncCreateConfiguration();
