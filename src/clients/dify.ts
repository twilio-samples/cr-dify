import { FastifyBaseLogger } from "fastify";
import { EventSourceParserStream } from "eventsource-parser/stream";

export type DifyMessage = {
  event: "message";
  task_id: string;
  id: string;
  message_id: string;
  conversation_id: string;
  mode: "advanced-chat" | string;
  answer: string;
  metadata: {
    annotation_reply: null | unknown;
    retriever_resources: unknown[];
    usage: {
      prompt_tokens: number;
      prompt_unit_price: string;
      prompt_price_unit: string;
      prompt_price: string;
      completion_tokens: number;
      completion_unit_price: string;
      completion_price_unit: string;
      completion_price: string;
      total_tokens: number;
      total_price: string;
      currency: string;
      latency: number;
    };
  };
  created_at: number;
};

type Config = {
  DIFY_API_KEY: string;
  logger: FastifyBaseLogger;
};

type RequestOptions = {
  conversationId?: string;
  user?: string;
};

type DefiRequest = {
  inputs: Record<string, unknown>;
  query: string;
  response_mode: "streaming" | "blocking";
  conversation_id?: string;
  user?: string;
};
export default class Dify {
  private readonly apiKey: string;
  private readonly logger: FastifyBaseLogger;

  constructor(config: Config) {
    this.apiKey = config.DIFY_API_KEY;
    this.logger = config.logger;
  }

  async streamMessage(
    query: string,
    onStream: (last: boolean, conversationId?: string, answer?: string) => void,
    options?: RequestOptions,
  ): Promise<void> {
    const payload: DefiRequest = {
      inputs: {
        to: "+17786886587",
        channel: "voice",
      },
      query: query,
      response_mode: "streaming",
    };
    if (options) {
      payload.user = options.user;
      payload.conversation_id = options.conversationId;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://api.dify.ai/v1/chat-messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Dify API error: ${response.status} ${response.statusText} with message ${text}`,
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("text/event-stream")) {
        throw new Error("Expected SSE stream but got different content type");
      }

      if (!response.body) {
        throw new Error("No response body available");
      }

      const eventStream = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new EventSourceParserStream());

      const reader = eventStream.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onStream(true);
          break;
        }
        if (value?.data) {
          const data = JSON.parse(value.data) as {
            event: string;
            answer?: string;
            conversation_id: string;
          };
          if (data.event === "message" && data.answer) {
            onStream(false, data.conversation_id, data.answer);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      } else {
        throw error;
      }
    }
  }

  async sendMessage(
    query: string,
    options?: RequestOptions,
  ): Promise<DifyMessage> {
    const payload: DefiRequest = {
      inputs: {
        to: "+17786886587",
        channel: "text",
      },
      query: query,
      response_mode: "blocking",
    };
    if (options) {
      payload.user = options.user;
      payload.conversation_id = options.conversationId;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch("https://api.dify.ai/v1/chat-messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const text = await response.text();
        throw new Error(
          `Dify API error: ${response.status} ${response.statusText} with message ${text}`,
        );
      }

      const data = await response.json();
      return data as DifyMessage;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      } else {
        throw error;
      }
    }
  }
}
