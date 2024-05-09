import {
  Pinecone,
  type ScoredPineconeRecord,
} from "@pinecone-database/pinecone";

export type Metadata = {
  referenceURL: string;
  text: string;
};

const getMatchesFromEmbeddings = async (
  embeddings: number[],
  topK: number,
  namespace: string
): Promise<ScoredPineconeRecord<Metadata>[]> => {
  const pinecone = new Pinecone();

  let indexName: string = process.env.PINECONE_INDEX_NAME || "";
  if (indexName === "") {
    indexName = "namespace-notes";
    console.warn("PINECONE_INDEX_NAME environment variable not set");
  }
  const indexes = (await pinecone.listIndexes())?.indexes;
  if (!indexes || indexes.filter((i) => i.name === indexName).length !== 1) {
    throw new Error(`Index ${indexName} does not exist.
    Create an index called "${indexName}" in your project.`);
  }

  const pineconeNamespace = pinecone.Index<Metadata>(indexName).namespace(namespace ?? "");

  try {
    const queryResult = await pineconeNamespace.query({
      vector: embeddings,
      topK,
      includeMetadata: true,
    });
    return queryResult.matches || [];
  } catch (e) {
    console.log("Error querying embeddings: ", e);
    throw new Error(`Error querying embeddings: ${e}`);
  }
};

export { getMatchesFromEmbeddings };
