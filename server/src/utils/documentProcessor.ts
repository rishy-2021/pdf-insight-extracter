// documentProcessor.ts

import { Document } from "../models/documentModel";
import pdfParse from "pdf-parse";
import { embedChunks } from "./embeddings";

async function processFile(
  /**
   * Processes a file and extracts its content and word count.
   * @param fileName - The name of the file.
   * @param fileData - The file data as a Buffer.
   * @param fileType - The type of the file.
   * @returns An object containing the document content, word count, and an optional error message.
   */
  fileName: string,
  fileData: Buffer,
  fileType: string
): Promise<{ documentContent: string; wordCount: number; error?: string }> {
  try {
    let documentContent = "";
    if (fileType === "application/pdf") {
      const pdfData = await pdfParse(fileData, {
        pagerender: function (page: any) {
          return page
            .getTextContent({
              normalizeWhitespace: true,
            })
            .then(function (textContent: { items: any[] }) {
              return textContent.items
                .map(function (item) {
                  return item.str;
                })
                .join(" ");
            });
        },
      });
      documentContent = pdfData.text;
      console.log("Processing file ", fileName);
    } else {
      documentContent = fileData.toString("utf8");
    }

    const wordCount = documentContent.split(/\s+/).length;

    return { documentContent, wordCount };
  } catch (error: any) {
    console.error(
      "An error occurred while processing the document:",
      error.message
    );
    throw error;
  }
}

async function chunkAndEmbedFile(
  documentId: string,
  documentUrl: string,
  content: string
): Promise<{ document: Document }> {
  try {
    const document: Document = {
      documentId,
      documentUrl,
      chunks: [],
    };

    // Pick a chunking strategy (this will depend on the use case and the desired chunk size!)
    const chunks = chunkTextByMultiParagraphs(content);

    const embeddings : number[][] = await embedChunks(chunks);

    for (let i = 0; i < chunks.length; i++) {
      document.chunks.push({
        id: `${document.documentId}:${i}`,
        values: embeddings[i],
        text: chunks[i],
      });
    }

    return { document };
  } catch (error) {
    console.error("Error in chunking and embedding document:", error);
    throw error;
  }
}

function chunkTextByMultiParagraphs(
  text: string,
  maxChunkSize = 1500,
  minChunkSize = 500
): string[] {
  const chunks: string[] = [];
  let currentChunk = "";

  let startIndex = 0;
  while (startIndex < text.length) {
    let endIndex = startIndex + maxChunkSize;
    if (endIndex >= text.length) {
      endIndex = text.length;
    } else {
      const paragraphBoundary = text.indexOf("\n\n", endIndex);
      if (paragraphBoundary !== -1) {
        endIndex = paragraphBoundary;
      }
    }

    const chunk = text.slice(startIndex, endIndex).trim();
    if (chunk.length >= minChunkSize) {
      chunks.push(chunk);
      currentChunk = "";
    } else {
      currentChunk += chunk + "\n\n";
    }

    startIndex = endIndex + 1;
  }

  if (currentChunk.length >= minChunkSize) {
    chunks.push(currentChunk.trim());
  } else if (chunks.length > 0) {
    chunks[chunks.length - 1] += "\n\n" + currentChunk.trim();
  } else {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export { chunkAndEmbedFile, processFile };
