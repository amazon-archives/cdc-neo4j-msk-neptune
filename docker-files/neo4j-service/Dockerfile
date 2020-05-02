# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

FROM neo4j:4.0.0
ENV NEO4J_AUTH=none
RUN apt-get update && apt-get install -y wget
RUN wget --directory-prefix ${NEO4J_HOME}/plugins/ https://github.com/neo4j-contrib/neo4j-apoc-procedures/releases/download/4.0.0.2/apoc-4.0.0.2-all.jar
RUN wget --directory-prefix ${NEO4J_HOME}/plugins/ https://github.com/neo4j-contrib/neo4j-streams/releases/download/4.0.0/neo4j-streams-4.0.0.jar
RUN mkdir -p temp &&  cp ${JAVA_HOME}/lib/security/cacerts ./temp/kafka.client.truststore.jks