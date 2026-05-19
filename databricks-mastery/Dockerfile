FROM eclipse-temurin:17-jdk-jammy

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        procps \
        entr \
    && rm -rf /var/lib/apt/lists/* \
    && ln -sf /usr/bin/python3 /usr/local/bin/python

ENV JAVA_HOME=/opt/java/openjdk

RUN python -m pip install --no-cache-dir \
    pyspark==3.5.3 \
    pyarrow \
    pandas \
    cloudpickle \
    numpy

WORKDIR /workspace

EXPOSE 4040

CMD ["bash"]
