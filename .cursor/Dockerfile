FROM node:22.23.2-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       bash \
       ca-certificates \
       curl \
       git \
    && rm -rf /var/lib/apt/lists/*

RUN node --version | grep -Eq '^v22\.'
