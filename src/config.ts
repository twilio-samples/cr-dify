import { JSONSchemaType } from "env-schema";

export interface Config {
  DIFY_API_KEY: string;
  PORT: number;
  DOMAIN: string;
  LOG_LEVEL: string;
}

const envSchema: JSONSchemaType<Config> = {
  type: "object",
  required: ["DIFY_API_KEY", "DOMAIN"],
  properties: {
    DIFY_API_KEY: {
      type: "string",
    },
    PORT: {
      type: "integer",
      default: 8080,
    },
    DOMAIN: {
      type: "string",
    },
    LOG_LEVEL: {
      type: "string",
      default: "info",
    },
  },
} as const;

export default envSchema;
