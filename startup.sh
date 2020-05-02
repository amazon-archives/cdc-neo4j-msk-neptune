# Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
# SPDX-License-Identifier: MIT-0

# tear down if setup already
docker-compose -f 02-docker-compose.yml down --remove-orphans
docker-compose -f 01-docker-compose.yml down --remove-orphans
docker volume rm -f streaming-neo4j-msk-neptune_shared-folder
# export neptune and msk endpoints
docker-compose -f 01-docker-compose.yml up --build --force-recreate
export DOCKER_VOL_PATH=`docker volume inspect --format '{{ .Mountpoint }}' streaming-neo4j-msk-neptune_shared-folder`
# persist exports
cat $DOCKER_VOL_PATH/setup-env.sh > /etc/profile.d/setup-env.sh
source /etc/profile.d/setup-env.sh
# run services
docker-compose -f 02-docker-compose.yml up -d --build --force-recreate
