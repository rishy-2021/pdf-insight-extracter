import { ScoredPineconeRecord } from "@pinecone-database/pinecone";
import { Metadata, getMatchesFromEmbeddings } from "./pinecone";
import { embedChunks } from "./embeddings";

export const getContext = async (
  message: string,
  namespace: string,
  maxCharacters = 5000,
  minScore = 0.15,
  getOnlyText = true
): Promise<string | ScoredPineconeRecord[]> => {
  try {
    const embeddings = await embedChunks([message]);

    const embedding = embeddings[0];

    const matches = await getMatchesFromEmbeddings(embedding, 15, namespace);
    const qualifyingDocs = matches.filter((m) => m.score && m.score > minScore);

    if (!getOnlyText) {
      return qualifyingDocs;
    }

    const documentTexts = qualifyingDocs.map((match) => {
      const metadata = match.metadata as Metadata;
      return `REFERENCE URL: ${metadata.referenceURL} CONTENT: ${metadata.text}`;
    });

    const concatenatedDocs = documentTexts.join(" ");
    return concatenatedDocs.length > maxCharacters
      ? concatenatedDocs.substring(0, maxCharacters)
      : concatenatedDocs;
  } catch (error) {
    console.error("Failed to get context:", error);
    throw error;
  }
};