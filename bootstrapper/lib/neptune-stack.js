// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const cdk = require("@aws-cdk/core");

const { Role, ServicePrincipal, ManagedPolicy } = require("@aws-cdk/aws-iam");
const {
  CfnDBCluster,
  CfnDBSubnetGroup,
  CfnDBInstance,
  CfnDBParameterGroup,
  CfnDBClusterParameterGroup
} = require("@aws-cdk/aws-neptune");
const { SecurityGroup, Peer, Port, Protocol } = require("@aws-cdk/aws-ec2");

class NeptuneStack extends cdk.Stack {
  NeptuneDBClusterIdentifier = "NeptuneDBCluster";
  NeptuneDBCluster;
  NeptunePort;

  constructor(scope, id, props) {
    super(scope, id, props);

    const { customVpc, env } = props;
    this.NeptunePort = parseInt(env.neptunePort);
    this.NeptuneDBCluster = this.createNeptuneCluster(customVpc);
    this.emitOutput();
  }

  emitOutput() {
    new cdk.CfnOutput(this, "NeptuneDBClusterIdentifier", {
      value: this.NeptuneDBClusterIdentifier,
      description: "Neptune cluster identifier"
    });
  }

  createNeptuneCluster(customVpc) {
    const neptuneSg = new SecurityGroup(this, "NeptuneSG", {
      vpc: customVpc,
      allowAllOutbound: true
    });

    neptuneSg.addIngressRule(
      Peer.ipv4(this.node.tryGetContext("SG_FROM_IP")),
      new Port({
        protocol: Protocol.TCP,
        stringRepresentation: "neptune console",
        fromPort: this.NeptunePort,
        toPort: this.NeptunePort
      })
    );
    neptuneSg.addIngressRule(
      Peer.ipv4(this.node.tryGetContext("SG_FROM_IP")),
      new Port({
        protocol: Protocol.TCP,
        stringRepresentation: "neptune ssh",
        fromPort: 22,
        toPort: 22
      })
    );
    const subnetIds = [];
    customVpc.publicSubnets.forEach((x) => {
      subnetIds.push(x.subnetId);
    });
    const neptuneDsg = new CfnDBSubnetGroup(this, "NeptuneDBSubnetGroup", {
      dbSubnetGroupDescription: "vpc subnets for Neptune cluster",
      subnetIds: subnetIds
    });
    const dbcpg = new CfnDBClusterParameterGroup(
      this,
      "NeptuneDBClusterParameterGroup",
      {
        family: "neptune1",
        parameters: {
          neptune_enable_audit_log: 1
        },
        description: "some dbcpg"
      }
    );
    const dbCluster = new CfnDBCluster(this, "NeptuneDBCluster", {
      dbSubnetGroupName: neptuneDsg.dbSubnetGroupName,
      dbClusterIdentifier: this.NeptuneDBClusterIdentifier,
      iamAuthEnabled: false,
      dbClusterParameterGroupName: dbcpg.dbClusterParameterGroupName,
      vpcSecurityGroupIds: [neptuneSg.securityGroupName]
    });
    dbCluster.addOverride("Properties.DBClusterParameterGroupName", {
      Ref: "NeptuneDBClusterParameterGroup"
    });
    dbCluster.addOverride("Properties.DBSubnetGroupName", {
      Ref: "NeptuneDBSubnetGroup"
    });
    const dbpg = new CfnDBParameterGroup(this, "NeptuneDBParameterGroup", {
      family: "neptune1",
      parameters: {
        neptune_query_timeout: 20000
      },
      description: "some dbpg"
    });
    const neptuneDb = new CfnDBInstance(this, "NeptuneDBInstance", {
      dbInstanceClass: this.node.tryGetContext("NEPTUNE_DB_INSTANCE_TYPE"),
      dbParameterGroupName: dbpg.dbParameterGroupName
    });
    neptuneDb.addOverride("Properties.DBClusterIdentifier", {
      Ref: "NeptuneDBCluster"
    });
    neptuneDb.addOverride("Properties.DBParameterGroupName", {
      Ref: "NeptuneDBParameterGroup"
    });

    return dbCluster;
  }
}

module.exports = { NeptuneStack };
