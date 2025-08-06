import {
  createServer,
  diContainer,
} from "@twilio-labs/conversationrelay-bridge";
import { asClass, asValue } from "awilix";
import * as handlers from "./handlers";
import CRSession from "./CRSession";
import * as clients from "./clients";
import envSchema from "./config";

const start = async (): Promise<void> => {
  const server = await createServer({
    port: parseInt(process.env.PORT || "3000", 10),
    twiml: handlers.twiml,
    messages: handlers.messages,
    crSession: CRSession,
    envSchema: envSchema,
  });

  diContainer.register({
    DIFY_API_KEY: asValue(server.config.DIFY_API_KEY),
    difyClient: asClass(clients.DifyClient, {
      injector: () => ({
        DIFY_API_KEY: diContainer.resolve("DIFY_API_KEY"),
        logger: diContainer.resolve("logger"),
      }),
    }).singleton(),
  });

  try {
    await server.listen({ port: server.config.PORT, host: "0.0.0.0" });
    const welcomeMessage = [
      "🚀 Twilio-Dify Bridge Server Started!",
      "====================================",
      `Port: ${server.config.PORT}`,
      `Localhost: http://localhost:${server.config.PORT}`,
    ];

    if (server.config.FLY_DOMAIN) {
      welcomeMessage.push(`Fly Domain: ${server.config.FLY_DOMAIN}`);
    } else if (server.config.NGROK_DOMAIN) {
      welcomeMessage.push(`NGROK Domain: ${server.config.NGROK_DOMAIN}`);
    } else {
      throw new Error("No WebSocket endpoint available");
    }

    welcomeMessage.push(
      "",
      `TwiML Endpoint: https://${server.config.NGROK_DOMAIN}/twiml`,
      `Messages Endpoint: https://${server.config.NGROK_DOMAIN}/messages`,
      `Health Check: https://${server.config.NGROK_DOMAIN}/health`,
    );

    if (server.config.FLY_DOMAIN) {
      welcomeMessage.push(`WebSocket Domain: ${server.config.FLY_DOMAIN}`);
    } else if (server.config.NGROK_DOMAIN) {
      welcomeMessage.push(
        `WebSocket Endpoint: wss://${server.config.NGROK_DOMAIN}/ws`,
      );
    }

    welcomeMessage.push("", "Ready to receive calls! 📞");

    console.log(welcomeMessage.join("\n"));
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
