// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const { MskClient } = require("../utils/msk-client");

const {
  getZookeeperConnections,
  getBootstrapServers,
  createKafkaConfiguration
} = MskClient(process.env.AWS_REGION);

const getMskConnectionString = async ({ mskCluster }) => {
  try {
    const broker = await getBootstrapServers(mskCluster);
    const zookeeper = await getZookeeperConnections(mskCluster);
    return { broker, zookeeper };
  } catch (e) {
    console.log(e);
  }
};

const createConfiguration = async () => {
  const config = [
    "auto.create.topics.enable = true",
    "zookeeper.connection.timeout.ms = 1000",
    "log.roll.ms = 604800000"
  ];
  return await createKafkaConfiguration("auto-create-topic", config.join("\n"));
};

module.exports = { getMskConnectionString, createConfiguration };
