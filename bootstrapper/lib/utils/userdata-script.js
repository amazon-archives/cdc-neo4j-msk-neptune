// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const UserDataScript = () => {
  const setupDockerScript = (neo4jEc2, node) => {
    const installDocker = [
      "sudo su #",
      "cd /",
      "yum update -y",
      "amazon-linux-extras install docker -y",
      "service docker start",
      "usermod -a -G docker ec2-user",
      "chkconfig docker on",
      "yum install -y git",
    ];
    neo4jEc2.addUserData(installDocker.join("\n"));

    const installDockerCompose = [
      'curl -L "https://github.com/docker/compose/releases/download/1.25.4/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
      "chmod +x /usr/local/bin/docker-compose",
      "ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose",
    ];
    neo4jEc2.addUserData(installDockerCompose.join("\n"));

    const runAfterDeploy = [
      "echo export AWS_REGION=" +
        process.env.CDK_DEFAULT_REGION +
        " >> /etc/profile.d/user-data-export.sh",
      "echo export SOURCE_TOPIC_NODES=\"'" +
        node.tryGetContext("SOURCE_TOPIC_NODES") +
        "'\" >> /etc/profile.d/user-data-export.sh",
      "echo export SOURCE_TOPIC_RELATIONSHIPS=" +
        node.tryGetContext("SOURCE_TOPIC_RELATIONSHIPS") +
        " >> /etc/profile.d/user-data-export.sh",
      "echo export KAFKA_TOPIC=" +
        node.tryGetContext("KAFKA_TOPIC") +
        " >> /etc/profile.d/user-data-export.sh",
      "source /etc/profile.d/user-data-export.sh",
      "rm -rf streaming-neo4j-msk-neptune/ && git clone https://github.com/sahays/streaming-neo4j-msk-neptune.git",
      "cd /streaming-neo4j-msk-neptune/ && chmod +x startup.sh && . startup.sh",
    ];
    neo4jEc2.addUserData(runAfterDeploy.join("\n"));
  };

  return { setupDockerScript };
};

module.exports = { UserDataScript };
