import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export async function embedChunks(chunks: string[]): Promise<any> {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "embedding-001", // 768 dimensions
  });

  try {
    const response = await embeddings.embedDocuments(chunks);
    return response;
  } catch (error) {
    console.error("Error embedding text with OpenAI:", error);
    throw error;
  }
}
