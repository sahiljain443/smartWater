import type { FastifyInstance } from "fastify";
import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT || "6379", 10),
});

export async function wsRoutes(app: FastifyInstance) {
  // WebSocket: /ws/sensors/:siteId — stream real-time sensor data
  app.get<{ Params: { siteId: string } }>(
    "/sensors/:siteId",
    { websocket: true },
    (socket, request) => {
      const { siteId } = request.params;
      const channel = `sensor:${siteId}`;

      const subscriber = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
      });

      subscriber.subscribe(channel, (err) => {
        if (err) {
          app.log.error(`Failed to subscribe to ${channel}:`, err);
          socket.close();
          return;
        }
        app.log.info(`WebSocket client subscribed to ${channel}`);
      });

      subscriber.on("message", (_ch, message) => {
        socket.send(message);
      });

      socket.on("close", () => {
        subscriber.unsubscribe(channel);
        subscriber.disconnect();
        app.log.info(`WebSocket client disconnected from ${channel}`);
      });
    }
  );

  // WebSocket: /ws/alerts/:siteId — stream alerts
  app.get<{ Params: { siteId: string } }>(
    "/alerts/:siteId",
    { websocket: true },
    (socket, request) => {
      const { siteId } = request.params;
      const channel = `alerts:${siteId}`;

      const subscriber = new Redis({
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379", 10),
      });

      subscriber.subscribe(channel);

      subscriber.on("message", (_ch, message) => {
        socket.send(message);
      });

      socket.on("close", () => {
        subscriber.unsubscribe(channel);
        subscriber.disconnect();
      });
    }
  );
}
