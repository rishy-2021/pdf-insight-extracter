# Pdf-Insight-Extracter
### Multi-tenant Chat app to extract insights from your PDFs
Unleash the power of conversational AI with your own documents

![image](https://github.com/pinecone-io/sample-apps/assets/24496327/df2c4281-893c-4ce5-ac36-101f4a076d6c)


### Built With
- Pinecone Serverless
- Vercel AI SDK + google-genai
- Next.js + tailwind
- Node version 20 or higher
---

## Running the Sample App

### Want to move fast?

### Create a Pinecone Serverless index

Create a Pinecone index for this project.
The index should have the following properties:
- **dimension**: `768` (default for `embedding-001`)
  - You can change this as long as you change the default embedding model.
- **metric**: `cosine`
- **region**: `us-east-1`

### Start the project

**Requires Node version 20+**


To start the project, you will need two separate terminal instances, one for running the client and one for the server.

#### Client setup

From the project root directory, run the following command.
```bash
cd client && npm install
```

Make sure you have populated the client `.env` with relevant keys.
```bash
# you can get your API Key here: https://aistudio.google.com/app/apikey
GOOGLE_GENERATIVE_AI_API_KEY="your-api-key-here"

# The URL of the server (only used for development)
SERVER_URL="http://localhost:4001"
```
Start the client.
```bash
npm run dev
```



#### Server setup

From the project root directory, run the following command.
```bash
cd server && npm install
```

Make sure you have populated the server `.env` with relevant keys.
```bash
PINECONE_API_KEY="your_pinecone_api_key_here"
PINECONE_INDEX_NAME="your_pinecone_index_name_here"
OPENAI_API_KEY="your_openai_api_key_here"

```
Start the server.
```bash
npm run start
```

## Project structure

![image](https://raw.githubusercontent.com/rishy-2021/pdf-insight-extracter/master/server/public/program-flow.jpg)

In this example we opted to use a simple client/server structure.

**Frontend Client**

The frontend uses Next.js, tailwind and components from Vercel's AI SDK to power the chatbot experience. It also leverages API routes to make calls to the server to fetch document references and context for both the UI and chatbot LLM.
The client uses local storage to store workspace information.

**Backend Server**

This project uses Node.js and Express to handle file uploads, validation checks, chunking, upsertion, context provision etc. Learn more about the implementation details below.

### Simple Multi-tenant RAG Methodology
This project uses a basic RAG architecture that achieves multitenancy through the use of namespaces. Files are uploaded to the server where they are chunked, embedded and upserted into Pinecone.

```typescript

async addDocuments(req: Request, res: Response) {
  // This is effectively the ID of the workspace / tenant
  let namespaceId = req.body.namespaceId;
  //...
```

**Chunking**

This project uses a basic paragraph chunking approach. We use `pdf-parse` to stream and parse pdf content and leverage a best effort paragraph chunking strategy with a defined `minChunkSize` and `maxChunkSize` to
account for documents with longer or shorter paragraph sizes. This helps us provide sizable content chunks for our Pinecone record metadata which will later be used by the LLM during retreival.
```typescript

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
      // Just using this to find the nearest paragraph boundary
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
```

**Embedding**

Once we have our chunks we embed them in batches using [`embedding-001`]
```typescript

export async function embedChunks(chunks: string[]): Promise<any> {
  // You can use any embedding model or service here.
  // In this example, we use OpenAI's text-embedding-3-small model.

  const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "embedding-001", // 768 dimensions
  });

  try {
    const response = await embeddings.embedDocuments(chunks);
    return response;
  } catch (error) {
    console.error("Error embedding text with GenAi:", error);
    throw error;
  }
}
```

This comes in handy for targeted document updates and deletions.

**Upsertion**

Lastly, we upsert our embeddings to the Pinecone Namespace associated with the tenant in the form of a `PineconeRecord`.
This allows us to provide the reference text and url as metadata for use by our retreival system.
```typescript
  /**
   * Upserts a document into the specified Pinecone namespace.
   * @param document - The document to upsert.
   * @param namespaceId - The ID of the namespace.
   */
  async upsertDocument(document: Document, namespaceId: string) {
    // Adjust to use namespaces if you're organizing data that way
    const namespace = index.namespace(namespaceId); // Adjust as necessary

    const vectors: PineconeRecord<RecordMetadata>[] = document.chunks.map(
      (chunk) => ({
        id: chunk.id,
        values: chunk.values,
        metadata: { text: chunk.text, referenceURL: document.documentUrl },
      })
    );

    // Upsert the chunks into the specified namespace
    await namespace.upsert(vectors);
  }
```

**Context**

When a user asks a question via the frontend chat component, the Vercel AI SDK leverages the `/chat` endpoint for retrieval.
We then send the `top_k` most similar results back from Pinecone via our context route.

We populate a `CONTEXT BLOCK` that is wrapped with system prompt instructions for our chosen LLM to take advantage of in the response output.

It's important to note that different LLMs will have different context windows, so your choice of LLM will influence the `top_k` value you should return from Pinecone and along with the size of your chunks.
If the context block / prompt is longer than the context window of the LLM, it will not be fully included in generation results.

```typescript
import { getContext } from "./context";

export async function createPrompt(messages: any[], namespaceId: string) {
  try {
    // Get the last message
    const lastMessage = messages[messages.length - 1]["content"];

    // Get the context from the last message
    const context = await getContext(lastMessage, namespaceId);

    const prompt = [
      {
        role: "system",
        content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
          DO NOT SHARE REFERENCE URLS THAT ARE NOT INCLUDED IN THE CONTEXT BLOCK.
          AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
          If user asks about or refers to the current "workspace" AI will refer to the the content after START CONTEXT BLOCK and before END OF CONTEXT BLOCK as the CONTEXT BLOCK.
          If AI sees a REFERENCE URL in the provided CONTEXT BLOCK, please use reference that URL in your response as a link reference right next to the relevant information in a numbered link format e.g. ([reference number](link))
          If link is a pdf and you are CERTAIN of the page number, please include the page number in the pdf href (e.g. .pdf#page=x ).
          If AI is asked to give quotes, please bias towards providing reference links to the original source of the quote.
          AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation. It will say it does not know if the CONTEXT BLOCK is empty.
          AI assistant will not invent anything that is not drawn directly from the context.
          AI assistant will not answer questions that are not related to the context.
          START CONTEXT BLOCK
          ${context}
          END OF CONTEXT BLOCK
      `,
      },
    ];
    return { prompt };
  } catch (e) {
    throw e;
  }
}
```

**Workspace Deletion**

This is even simpler to achieve. If we have a the workspace / namespaceId at our disposal, we can simply call `deleteAll()` on the relevant namespace.

```typescript

  async deletePineconeNamespace(namespaceId: string) {
    console.log("Deleting Workspace")
    const namespace = index.namespace(namespaceId);
    await namespace.deleteAll();
    console.log("Workspace deleted from Pinecone successfully")
  }
```

---

## Troubleshooting

Experiencing any issues with the sample app?
[Submit an issue, create a PR](https://github.com/rishy-2021/pdf-insight-extracter/), or DM me [LinkedIn](https://www.linkedin.com/in/ritesh-purwar/)!

