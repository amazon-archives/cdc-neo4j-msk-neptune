FROM openjdk:8-jre-slim

ENV ZOOKEEPER_CONNECT=
ENV KAFKA_TOPIC=

RUN apt update \
    && apt install -y wget

WORKDIR /

COPY run-script.sh .
RUN chmod +x run-script.sh

RUN wget https://archive.apache.org/dist/kafka/2.2.1/kafka_2.12-2.2.1.tgz && \
    tar -xzf kafka_2.12-2.2.1.tgz

WORKDIR /kafka_2.12-2.2.1
