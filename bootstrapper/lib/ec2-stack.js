// Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

const cdk = require("@aws-cdk/core");
const {
  Instance,
  InstanceType,
  AmazonLinuxImage,
  AmazonLinuxGeneration,
  EbsDeviceVolumeType
} = require("@aws-cdk/aws-ec2");
const {
  Policy,
  PolicyStatement,
  Effect,
  ManagedPolicy
} = require("@aws-cdk/aws-iam");
const { UserDataScript } = require("./utils/userdata-script");
const { EmitOutput } = require("./utils/emit-output");

class Ec2Stack extends cdk.Stack {
  S3Bucket;
  S3bucketPolicy;
  Neo4jEc2;

  constructor(scope, id, props) {
    super(scope, id, props);

    const { setupDockerScript } = UserDataScript();
    const { emit } = EmitOutput();
    const { neptuneStack, networkStack, mskStack } = props;
    const { CustomVpc, InstanceSg } = networkStack;

    const neo4jEc2 = this.createEc2(CustomVpc, InstanceSg);
    this.Neo4jEc2 = neo4jEc2;
    this.attachIamPolicies();
    setupDockerScript(neo4jEc2, this.node);
    emit(this, this.Neo4jEc2, neptuneStack, mskStack, networkStack);
  }

  attachIamPolicies() {
    const neptunePolicy = this.makeNeptunePolicy();
    this.Neo4jEc2.role.attachInlinePolicy(neptunePolicy.inlinePolicy);
    this.Neo4jEc2.role.addManagedPolicy(neptunePolicy.managedPolicy);
    this.Neo4jEc2.role.addManagedPolicy(this.makeMskPolicy());
    this.Neo4jEc2.role.addManagedPolicy(this.makeCloudformationPolicy());
    this.Neo4jEc2.role.attachInlinePolicy(this.makeRdsInlinePolicy());
    this.Neo4jEc2.role.attachInlinePolicy(this.makeIamPassRolePolicy());
    this.Neo4jEc2.role.attachInlinePolicy(this.makeKafkaPolicy());
  }

  makeCloudformationPolicy() {
    return ManagedPolicy.fromAwsManagedPolicyName(
      "AWSCloudFormationReadOnlyAccess"
    );
  }

  makeMskPolicy() {
    return ManagedPolicy.fromAwsManagedPolicyName("AmazonMSKReadOnlyAccess");
  }

  makeKafkaPolicy() {
    const kafkaPolicy = new PolicyStatement({
      effect: Effect.ALLOW
    });
    kafkaPolicy.addActions("kafka:CreateConfiguration");
    kafkaPolicy.addActions("kafka:UpdateClusterConfiguration");
    kafkaPolicy.addResources("*");
    return new Policy(this, "ec2Kafka", {
      statements: [kafkaPolicy]
    });
  }

  makeIamPassRolePolicy() {
    const iamPassRolePolicy = new PolicyStatement({
      effect: Effect.ALLOW
    });
    iamPassRolePolicy.addActions("iam:PassRole");
    iamPassRolePolicy.addResources("*");

    return new Policy(this, "ec2IamPassRole", {
      statements: [iamPassRolePolicy]
    });
  }

  makeRdsInlinePolicy() {
    const ec2RdsPolicy = new PolicyStatement({
      effect: Effect.ALLOW
    });
    ec2RdsPolicy.addActions("rds:AddRoleToDBCluster");
    ec2RdsPolicy.addResources("*");

    return new Policy(this, "ec2Rds", {
      statements: [ec2RdsPolicy]
    });
  }

  makeNeptunePolicy() {
    const neptunePolicy = new PolicyStatement({
      effect: Effect.ALLOW
    });
    neptunePolicy.addActions("neptune-db:*");
    neptunePolicy.addResources("arn:aws:neptune-db:*:*:*/database");

    return {
      inlinePolicy: new Policy(this, "ec2Neptune", {
        statements: [neptunePolicy]
      }),
      managedPolicy: ManagedPolicy.fromAwsManagedPolicyName(
        "NeptuneReadOnlyAccess"
      )
    };
  }

  createEc2(customVpc, instanceSg) {
    const neo4jEc2 = new Instance(this, "neo4j", {
      vpc: customVpc,
      instanceType: InstanceType.of(
        this.node.tryGetContext("EC2_CLASS"),
        this.node.tryGetContext("EC2_TYPE")
      ),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2
      }),
      blockDevices: [
        {
          deviceName: "/dev/xvda",
          volume: {
            ebsDevice: {
              deleteOnTermination: true,
              volumeSize: 50,
              volumeType: EbsDeviceVolumeType.GP2
            }
          }
        }
      ],
      vpcSubnets: {
        subnets: customVpc.publicSubnets
      },
      securityGroup: instanceSg,
      keyName: this.node.tryGetContext("EC2_KEY_PAIR")
    });
    return neo4jEc2;
  }
}

module.exports = { Ec2Stack };
