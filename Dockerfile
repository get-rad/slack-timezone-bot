FROM ubuntu:18.04

ENV LANG=C.UTF-8 LC_ALL=C.UTF-8 DEBIAN_FRONTEND=noninteractive

WORKDIR /bot
COPY * /bot/

RUN apt-get update && apt-get -y upgrade && \
    apt-get -y install apt-transport-https ca-certificates curl gnupg2 && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list && \
    apt-get update --fix-missing && apt-get upgrade && apt-get install -y nodejs yarn && \
    yarn install


ENV TOKEN ""

ENTRYPOINT ["/usr/bin/yarn"]
CMD ["start"]
