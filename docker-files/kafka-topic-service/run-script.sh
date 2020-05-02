bin/kafka-topics.sh --create \
    --zookeeper $ZOOKEEPER_CONNECT \
    --replication-factor 2 \
    --partitions 1 \
    --topic $KAFKA_TOPIC