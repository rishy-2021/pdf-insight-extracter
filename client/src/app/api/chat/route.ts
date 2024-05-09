import { StreamingTextResponse, experimental_streamText } from "ai";

import { google } from "@ai-sdk/google";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages, namespaceId } = await req.json();
  const response = await fetch(`${process.env.SERVER_URL}/api/context/fetch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      namespaceId: namespaceId,
      messages: messages,
    }),
  });

  const { context } = await response.json();

  if (context && context.prompt && context.prompt.length > 0) {
    const systemContent = context.prompt[0].content;

    const result = await experimental_streamText({
      system: systemContent,
      temperature: 0.2,
      model: google.chat("models/gemini-pro"),
      maxRetries: 8,
      messages,
    });

    return new StreamingTextResponse(result.toAIStream());
  } else {
    throw new Error(
      "Unexpected server response structure: 'prompt' array is missing or empty."
    );
  }
}
