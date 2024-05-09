import fs from "fs";
import { Request, Response } from "express";
import { Worker } from "worker_threads";
import multer from "multer";
import path from "path";
import { Document, DocumentModel } from "../models/documentModel";
import { v4 as uuidv4 } from "uuid";
import { storageService } from "../utils/storage/storage";
import { ServerStorage } from "../utils/storage/serverStorage";
import { upload } from "../utils/multer";

class DocumentsController {
  private documentModel: DocumentModel;

  constructor() {
    this.documentModel = new DocumentModel();
    this.addDocuments = this.addDocuments.bind(this);
    this.serveDocument = this.serveDocument.bind(this);
    this.deleteWorkspace = this.deleteWorkspace.bind(this);
  }

  async safeUpsertDocument(document: Document, namespaceId: string) {
    let retries = 0;
    const maxRetries = 5;
    while (retries < maxRetries) {
      try {
        await this.documentModel.upsertDocument(document, namespaceId);
        break;
      } catch (error: any) {
        if (
          error.message.includes("rate limit exceeded") &&
          retries < maxRetries
        ) {
          const waitTime = Math.pow(2, retries) * 1000;
          console.log(`Waiting ${waitTime / 1000} seconds before retrying...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          retries++;
        } else {
          throw error;
        }
      }
    }
  }

  async addDocuments(req: Request, res: Response) {
    let namespaceId = req.body.namespaceId;

    upload(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        console.error("Multer error:", err);
        return res.status(400).json({ message: err.message });
      } else if (err) {
        console.error("Error uploading files:", err);
        return res.status(400).json({ message: "File upload error" });
      }

      const isNewWorkspace = req.body.newWorkspace === "true";
      if (isNewWorkspace) {
        namespaceId = uuidv4();
      } else if (!namespaceId) {
        return res
          .status(400)
          .json({ message: "Missing required field: namespaceId" });
      }

      const filesObject = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };
      if (!filesObject || !filesObject.files) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const files = filesObject.files;
      const documentResponses: any = [];
      const errors: string[] = [];

      const workerPromises = files.map((file) => {
        return new Promise<Document>((resolve, reject) => {
          const documentId = uuidv4();
          const fileKey = `${namespaceId}/${documentId}/${file.originalname}`;
          const documentUrl = storageService.constructFileUrl(fileKey);

          const fileData = fs.readFileSync(file.path);

          storageService
            .saveFile(file, fileKey)
            .then(() => {
              const workerPath = path.join(
                __dirname,
                "../utils/workers/fileProcessorWorker"
              );
              const worker = new Worker(workerPath, {
                workerData: {
                  fileData,
                  fileType: file.mimetype,
                  fileName: file.originalname,
                  documentId,
                  documentUrl,
                },
              });

              worker.on("message", (result: any) => {
                if (result.error) {
                  reject(new Error(result.error));
                } else {
                  resolve(result.document);
                }
              });

              worker.on("error", (error: Error) => {
                reject(error);
              });
            })
            .catch((error) => {
              reject(error);
            });
        });
      });

      try {
        const documents = await Promise.all(workerPromises);

        await Promise.all(
          documents.map((document) =>
            this.safeUpsertDocument(document, namespaceId)
          )
        );

        documentResponses.push(...documents);
      } catch (error: any) {
        console.error("Error processing documents:", error);
        errors.push(error.message);
      }

      if (errors.length > 0) {
        return res.status(400).json({
          message: "Some documents failed to process",
          errors,
          documentResponses,
        });
      }
      res.status(200).json({
        message: "Documents added successfully",
        namespaceId,
        documentResponses,
      });
    });
  }

  async listFilesInNamespace(req: Request, res: Response) {
    const namespaceId = req.params.namespaceId;

    try {
      let files;

      files = await storageService.listFilesInNamespace(namespaceId);
      console.log("Files from storage:", files);

      res.json(files);
    } catch (error) {
      console.error("Error listing files in namespace:", error);
      res.status(500).json({ message: "Failed to list files" });
    }
  }

  async deleteWorkspace(req: Request, res: Response) {
    const namespaceId = req.params.namespaceId;

    try {
      await this.documentModel.deletePineconeNamespace(namespaceId);

      try {
        await storageService.deleteWorkspaceFiles(namespaceId);
      } catch (error) {
        console.error("Failed to delete namespace from Spaces:", error);
      }

      res.status(200).send({ message: "Workspace deleted successfully" });
    } catch (error) {
      console.error("Error deleting workspace:", error);
      res.status(500).send({ message: "Failed to delete workspace" });
    }
  }

  async serveDocument(req: Request, res: Response) {
    const { namespaceId, documentId } = req.params;
    const fileKey = `${namespaceId}/${documentId}`;
    console.log("Serving file:", fileKey);

    try {

      if (storageService instanceof ServerStorage) {
        const filePath = path.join("uploads", fileKey);
        const files = fs.readdirSync(filePath);
        const firstFile = files[0];
        const fileFullPath = path.join(filePath, firstFile);
        res.sendFile(fileFullPath, { root: "." });
      } else {
        throw new Error("Unsupported storage service");
      }
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ message: "Failed to serve file" });
    }
  }
}

export default new DocumentsController();
