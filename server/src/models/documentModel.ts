import {
  Pinecone,
  PineconeRecord,
  RecordMetadata,
} from "@pinecone-database/pinecone";
import config from "../config";

const pc = new Pinecone({
  apiKey: config.pineconeApiKey,
});

export interface Chunk {
  id: string;
  values: number[];
  text: string;
}

export interface Document {
  documentId: string;
  documentUrl: string;
  chunks: Chunk[];
}

const index = pc.index(config.pineconeIndexName);

export class DocumentModel {

  async upsertDocument(document: Document, namespaceId: string) {
    const namespace = index.namespace(namespaceId);

    const vectors: PineconeRecord<RecordMetadata>[] = document.chunks.map(
      (chunk) => ({
        id: chunk.id,
        values: chunk.values,
        metadata: { text: chunk.text, referenceURL: document.documentUrl },
      })
    );

    await namespace.upsert(vectors);
  }

  async listDocumentChunks(
    documentId: string,
    namespaceId: string,
    limit: number,
    paginationToken?: string
  ): Promise<{ chunks: { id: string }[]; paginationToken?: string }> {
    try {
      const namespace = index.namespace(namespaceId);
      const listResult = await namespace.listPaginated({
        prefix: `${documentId}:`,
        limit: limit,
        paginationToken: paginationToken,
      });

      const chunks =
        listResult.vectors?.map((vector) => ({ id: vector.id || "" })) || [];
      return { chunks, paginationToken: listResult.pagination?.next };
    } catch (error) {
      console.error(
        `Failed to list document chunks for document ${documentId}: ${error}`
      );
      throw error;
    }
  }

  async deleteDocumentChunks(chunkIds: string[], namespaceId: string) {
    console.log("Deleting Document Chunks")
    const namespace = index.namespace(namespaceId);
    await namespace.deleteMany(chunkIds);
  }

  async deletePineconeNamespace(namespaceId: string) {
    console.log("Deleting Workspace")
    const namespace = index.namespace(namespaceId);
    await namespace.deleteAll();
    console.log("Workspace deleted from Pinecone successfully")
  }
}
