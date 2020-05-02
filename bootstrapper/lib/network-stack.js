// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const cdk = require("@aws-cdk/core");
const { SecurityGroup, Protocol, Port, Peer } = require("@aws-cdk/aws-ec2");
const { Vpc, SubnetType } = require("@aws-cdk/aws-ec2");

class NetworkStack extends cdk.Stack {
  CustomVpc;
  InstanceSg;
  MskSg;

  constructor(scope, id, props) {
    super(scope, id, props);

    const { env } = props;

    this.CustomVpc = new Vpc(this, "vpc", {
      cidr: this.node.tryGetContext("VPC_CIDR"),
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public",
          subnetType: SubnetType.PUBLIC
        }
      ]
    });

    this.InstanceSg = this.createInstanceSg(this.CustomVpc);
    this.MskSg = this.createMskSg(this.CustomVpc, this.InstanceSg);
    // both ways
    this.allowFromMsk();
    this.createNeptuneSg(this.CustomVpc, this.InstanceSg, env);
  }

  createNeptuneSg(customVpc, instanceSg, env) {
    const sg = new SecurityGroup(this, "neptune-sg", {
      vpc: customVpc,
      allowAllOutbound: true
    });
    sg.connections.allowFrom(
      instanceSg,
      new Port({
        protocol: Protocol.TCP,
        fromPort: parseInt(env.neptunePort),
        toPort: parseInt(env.neptunePort),
        stringRepresentation: "neptune_port from ec2"
      }),
      "from ec2"
    );
    return sg;
  }

  allowFromMsk() {
    this.InstanceSg.connections.allowFrom(
      this.MskSg,
      new Port({
        protocol: Protocol.TCP,
        fromPort: 0,
        toPort: 65535,
        stringRepresentation: "all ports from MSK"
      }),
      "from MSK"
    );
  }

  createMskSg(customVpc, instanceSg) {
    const sg = new SecurityGroup(this, "msk-sg", {
      vpc: customVpc,
      allowAllOutbound: true
    });
    sg.connections.allowFrom(
      instanceSg,
      new Port({
        protocol: Protocol.TCP,
        fromPort: 0,
        toPort: 65535,
        stringRepresentation: "all ports from ec2"
      }),
      "from ec2"
    );
    return sg;
  }

  createInstanceSg(customVpc) {
    const instanceSg = new SecurityGroup(this, "neo4j-sg", {
      vpc: customVpc,
      allowAllOutbound: true
    });
    instanceSg.addIngressRule(
      Peer.anyIpv4(),
      new Port({
        protocol: Protocol.TCP,
        stringRepresentation: "ssh",
        fromPort: 22,
        toPort: 22
      })
    );
    return instanceSg;
  }
}

module.exports = { NetworkStack };
