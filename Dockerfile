FROM node:22-alpine
WORKDIR /app
COPY nexus-source.tar.gz.b64 /tmp/nexus-source.tar.gz.b64
RUN base64 -d /tmp/nexus-source.tar.gz.b64 | tar -xz -C /app \
    && rm -f /tmp/nexus-source.tar.gz.b64
ENV NODE_ENV=production HOST=0.0.0.0
EXPOSE 8000
CMD ["node", "server.js"]
