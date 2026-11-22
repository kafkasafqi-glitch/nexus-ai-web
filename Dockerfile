FROM node:22-alpine
WORKDIR /app
COPY nexus-source.part00 /tmp/nexus-source.part00
COPY nexus-source.part01 /tmp/nexus-source.part01
COPY nexus-source.part02 /tmp/nexus-source.part02
RUN cat /tmp/nexus-source.part00 /tmp/nexus-source.part01 /tmp/nexus-source.part02 \
    | base64 -d | tar -xz -C /app \
    && rm -f /tmp/nexus-source.part*
ENV NODE_ENV=production HOST=0.0.0.0
EXPOSE 8000
CMD ["sh", "-c", "if [ -f /app/server.js ]; then cd /app; elif [ -f /app/NEXUS_AI_Web_Integrated/server.js ]; then cd /app/NEXUS_AI_Web_Integrated; elif [ -f /app/NEXUS_AI_Web_Online/server.js ]; then cd /app/NEXUS_AI_Web_Online; else echo 'NEXUS source archive did not extract expected server.js'; find /app -maxdepth 3 -type f; exit 1; fi; exec node server.js"]
