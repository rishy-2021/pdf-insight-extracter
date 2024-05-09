"use client";
import { useChat } from "ai/react";
import { ChatMessage } from "./chat-message";
import { Workspace } from "@/lib/hooks/workspace-chat-context";
import { PromptGrid } from "../ui/prompt-grid";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import FileCard from "../ui/file-card";
import { FetchedFile } from "@/app/api/files/route";

const fetchFileUrls = async (workspaceId: string) => {
  try {
    const response = await fetch(`/api/files/?namespaceId=${workspaceId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch file URLs");
    }
    const files: FetchedFile[] = await response.json();
    return files;
  } catch (error) {
    console.error("Error fetching file URLs:", error);
    return [];
  }
};

export default function Chat({ workspace }: { workspace: Workspace }) {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      body: { namespaceId: workspace.id },
    });

  const [files, setFiles] = useState<FetchedFile[]>([]);
  const [fetchingFiles, setFetchingFiles] = useState(true);

  const [prompts, setPrompts] = useState<Prompt[]>([
    {
      id: "1",
      name: `Tell me about the content in the \"${workspace.name}\" workspace`,
      description: "",
      content: `Tell me about the content in the \"${workspace.name}\" workspace`,
      folderId: null,
    },
    {
      id: "2",
      name: `Give me some quotes about \"${workspace.name}\" from the content.`,
      description: "",
      content: `Give me some quotes about \"${workspace.name}\" from the content.`,
      folderId: null,
    },
    {
      id: "3",
      name: `Write me an essay about \"${workspace.name}\" from the content.`,
      description: "",
      content: `Write me an essay about \"${workspace.name}\" from the content.`,
      folderId: null,
    },
    {
      id: "4",
      name: `Tell me something I might not know about \"${workspace.name}\"`,
      description: "",
      content: `Tell me something I might not know about \"${workspace.name}\"`,
      folderId: null,
    },
  ]);

  const [activePromptIndex, setActivePromptIndex] = useState<number>(0);
  const promptListRef = useRef<HTMLDivElement | null>(null);

  const [shouldSubmit, setShouldSubmit] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handlePromptSubmit = (prompt: Prompt) => {
    handleInputChange({
      target: { value: prompt.content },
    } as ChangeEvent<HTMLInputElement>);
    setShouldSubmit(true);
  };

  useEffect(() => {
    if (shouldSubmit) {
      const form = document.querySelector("form");
      if (form) {
        form.dispatchEvent(new Event("submit", { cancelable: true }));
        form.requestSubmit();
        setShouldSubmit(false);
      }
    }
  }, [shouldSubmit]);

  const [documentTrayIsOpen, setDocumentTrayIsOpen] = useState(false);

  const toggleOpen = () => {
    setDocumentTrayIsOpen(!documentTrayIsOpen);
  };

  const fetchFiles = useCallback(async () => {
    setFetchingFiles(true);
    const files = await fetchFileUrls(workspace.id);
    setFiles(files);
    setFetchingFiles(false);
  }, [workspace.id]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  return (
    <div className="relative flex flex-col w-full max-w-md md:max-w-2xl h-full py-24 items-center justify-start">
      <div className={messages.length > 0 ? "h-full w-full" : "w-full"}>
        {messages.map((m) => (
          <div key={m.id} className={"whitespace-pre-wrap max-w-fit w-full"}>
            <ChatMessage key={m.id} message={m} />
          </div>
        ))}
        {isLoading && (
          <div className="animate-pulse bg-gray-500 h-4 w-4 rotate-45 rounded-sm"></div>
        )}
        <div className={documentTrayIsOpen ? "h-[70%]" : "h-1/3"}></div>
      </div>

      {messages.length === 0 && (
        <div className="relative flex flex-col items-center justify-center h-full">
          {!fetchingFiles &&
            (files.length > 0 ? (
              <PromptGrid
                prompts={prompts}
                activePromptIndex={activePromptIndex}
                onMouseOver={(index: number) => setActivePromptIndex(index)}
                promptListRef={promptListRef}
                handleSubmit={handlePromptSubmit}
              />
            ) : (
              <div className="text-gray-500 text-sm">
                No documents in this workspace... upload below!
              </div>
            ))}
        </div>
      )}

      <form
        onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSubmit(e)}
        className="fixed bottom-0 w-full max-w-[300px] sm:max-w-[400px] md:max-w-2xl z-50 pb-10"
      >
        <div className="flex flex-row items-center h-fit mb-4">
          <textarea
            className={
              "p-4 px-5 border border-gray-300 bg-white/80 text-black rounded flex-grow backdrop-blur-lg shadow-md overflow-y-auto resize-none " +
              (isLoading ? "cursor-not-allowed" : "cursor-text")
            }
            value={input}
            placeholder={
              isLoading ? "Responding..." : "Chat with this workspace..."
            }
            disabled={isLoading}
            onChange={handleInputChange}
            onKeyDown={(e: any) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            rows={1}
            style={{
              height: "auto",
              maxHeight: "30vh",
              overflow: "auto",
              scrollbarColor: "transparent transparent",
            }}
            ref={(textarea) => {
              if (textarea) {
                textarea.style.height = "auto";
                textarea.style.height = `${Math.min(textarea.scrollHeight, window.innerHeight * 0.3)}px`;
                if (!isFocused) {
                  textarea.focus();
                  setIsFocused(true);
                }
              }
            }}
          />
        </div>

        {/* Document Tray */}
        <div className="flex flex-col items-center bg-white/80 backdrop-blur-lg border border-gray-300 rounded shadow-md">
          <button
            onClick={toggleOpen}
            className={`flex flex-row items-center justify-center font-normal cursor-pointer w-full p-2 gap-1 transition duration-200 ease-in-out hover:bg-slate-50 border-b`}
          >
            <span className="text-gray-500 text-sm">
              Your Documents
              {fetchingFiles ? (
                <>
                  (
                  <div className="inline-block w-2 h-4 mx-0 translate-y-1 bg-gray-200 animate-pulse" />
                  )
                </>
              ) : (
                ` - ${files[0]?.name}`
              )}
            </span>

              <div className="p-2 max-h-[120px] overflow-auto no-scrollbar">
                {files.length > 0 ? (
                  <div className="flex flex-wrap gap-x-2 gap-y-5 ">
                    {files.map((file) => (
                      <FileCard
                        key={file.name}
                        fileUrl={file.url}
                      />
                    ))}
                  </div>
                ) : fetchingFiles ? (
                  <div className="text-black text-sm animate-pulse">
                    <p>Fetching documents...</p>
                  </div>
                ) : (
                  <div className="text-black text-sm">
                    No documents uploaded
                  </div>
                )}
              </div>
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Extracts the documentId from a given file URL.
 * Assumes the URL pattern is:
 * https://domain/[namespaceId]/[documentId]/[filename]
 *
 * @param fileUrl - The URL of the file from which to extract the documentId.
 * @returns The extracted documentId or an empty string if the URL is invalid.
 */
export function getDocumentIdFromFileUrl(fileUrl: string): string {
  try {
    // Parsing the URL to get the pathname
    const url = new URL(fileUrl);
    const pathSegments = url.pathname
      .split("/")
      .filter((part) => part.trim() !== "");

    // Assuming the documentId is always the second segment in the path
    const documentId = pathSegments[1]; // 0: namespaceId, 1: documentId, 2: filename
    return documentId;
  } catch (error) {
    console.error("Error extracting documentId from URL:", error);
    return "";
  }
}
