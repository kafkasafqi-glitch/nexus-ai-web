FROM node:22-alpine
WORKDIR /app
COPY nexus-source.part00 nexus-source.part01 nexus-source.part02 /tmp/
RUN cat /tmp/nexus-source.part00 /tmp/nexus-source.part01 /tmp/nexus-source.part02 \
    | base64 -d | tar -xz -C /app \
    && rm -f /tmp/nexus-source.part*
ENV NODE_ENV=production HOST=0.0.0.0
EXPOSE 8000
CMD ["node", "server.js"]
