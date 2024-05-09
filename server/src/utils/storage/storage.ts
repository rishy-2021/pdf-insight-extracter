export interface FileDetail {
  documentId: string;
  name: string;
  url: string;
}

export interface StorageService {
  saveFile(file: Express.Multer.File, fileKey: string): Promise<void>;
  constructFileUrl(fileKey: string): string;
  getFilePath(fileKey: string): Promise<string>;
  listFilesInNamespace(namespaceId: string): Promise<FileDetail[]>;
  deleteWorkspaceFiles(namespaceId: string): Promise<void>;
}

import { ServerStorage } from "./serverStorage";

export const storageService: StorageService =  new ServerStorage()