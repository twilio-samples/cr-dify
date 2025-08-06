import {
  ConversationRelaySessionArgs,
  ConversationRelaySession,
  PromptMessage,
  DTMFMessage,
  ErrorMessage,
} from "@twilio-labs/conversationrelay-bridge";
import { DifyClient } from "./clients";
import { diContainer } from "@twilio-labs/conversationrelay-bridge";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

const MAX_RESPONSE_LENGTH = 3000;

export default class CRSession extends ConversationRelaySession {
  private readonly difyClient: DifyClient;
  private readonly history: Message[];
  public difyConversationId?: string;

  constructor(args: ConversationRelaySessionArgs) {
    super(args);

    this.difyClient = diContainer.resolve("difyClient");
    this.history = [];
  }

  async handlePrompt(event: PromptMessage): Promise<void> {
    const userMessage = event.voicePrompt;
    this.logger.info(`User prompt received: ${userMessage}`);

    if (!this.session) {
      this.logger.error("Session not found for prompt");
      return;
    }

    this.history.push({ role: "user", content: userMessage });

    try {
      await this.difyClient.streamMessage(
        userMessage,
        (last: boolean, conversationId, answer?: string) => {
          this.logger.info(
            `Streaming partial response: ${answer}, lastToken: ${last}`,
          );

          // save the conversationID for future
          if (!this.difyConversationId) {
            this.difyConversationId = conversationId;
            this.logger = this.logger.child({ conversationId });
          }

          if (!last && answer) {
            this.history.push({ role: "assistant", content: answer });
          }

          this.sendToken(answer ?? "", last);
        },
        {
          conversationId: this.difyConversationId,
          user: this.session.from,
        },
      );
      this.logger.info("Streaming complete");
    } catch (error) {
      this.logger.error(
        { error: (error as Error).message },
        "Error calling Dify",
      );

      this.sendToken(
        "I apologize, but I'm having trouble processing your request right now. Please try again.",
        true,
      );
    }
  }

  async handleDTMF(event: DTMFMessage): Promise<void> {
    this.logger.info("DTMF received");

    if (event.digit === "0") {
      this.sendToken("you to a human agent. Please hold.", true);
    }
  }

  async handleError(message: ErrorMessage): Promise<void> {
    this.logger.error("Error received");
  }

  async handleClose(): Promise<void> {
    this.logger.info("WebSocket connection closed");
    const duration =
      (new Date().getTime() - this.session.startTime.getTime()) / 1000;
    this.logger.info(
      {
        duration: `${duration}s`,
        messageCount: this.history.length,
      },
      "Call summary",
    );
  }
}
