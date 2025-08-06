import { FastifyRequest, FastifyReply } from "fastify";
import { DifyClient } from "../clients";
import CRSession from "../CRSession";

export default async function messageHandler(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = req.body as Record<string, string>;
  const difyClient = req.diScope.resolve<DifyClient>("difyClient");
  const session: CRSession = await (
    req.diScope.cradle as any
  ).getActiveSession();
  const conversationId = session.difyConversationId;

  if (!conversationId) {
    // Probably should reply back with a better message
    return;
  }

  const response = await difyClient.sendMessage(body.Body, {
    user: body.From,
    conversationId,
  });
  session.sendToken(response.answer);
  return;
}
