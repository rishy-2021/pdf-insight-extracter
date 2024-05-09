export interface FilesResponse {
  files: FetchedFile[];
}
export interface FetchedFile {
  name: string;
  url: string;
  documentId: string;
}

export async function GET(request: Request) {
  const namespaceId = new URL(request.url).searchParams.get("namespaceId");

  if (typeof namespaceId !== "string") {
    throw new Error("Invalid or missing namespace ID in request URL");
  }

  try {
    const url = `${process.env.SERVER_URL}/api/documents/files/${namespaceId}`;
    const response = await fetch(url, { method: "GET" });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Failed to fetch files: ${data.message}`);
    }

    const fileUrls: FilesResponse = data;
    console.log("Files fetched successfully: ", JSON.stringify(fileUrls));
    return new Response(JSON.stringify(fileUrls), { status: 200 });
  } catch (error) {
    console.error("Error fetching files:", error);
    throw new Error(`Failed to fetch files URLs: ${error}`);
  }
}

export async function POST(req: Request) {
  const formData = new FormData();
  const data = await req.formData();
  const entries = Array.from(data.entries());

  for (const [key, value] of entries) {
    if (key === "newWorkspace") {
      formData.append(key, JSON.stringify(true));
    } else {
      formData.append(key, value);
    }
  }

  try {
    const response = await fetch(
      `${process.env.SERVER_URL}/api/documents/add`,
      {
        method: "POST",
        body: formData,
      }
    );

    if (response.ok) {
      const responseData = await response.json();
      console.log("File uploaded successfully:", responseData);
      return new Response(
        JSON.stringify({ namespaceId: responseData.namespaceId }),
        { status: 200 }
      );
    } else {
      throw new Error("Failed to upload files, " + response.statusText);
    }
  } catch (error) {
    console.error("Error uploading files:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
}
