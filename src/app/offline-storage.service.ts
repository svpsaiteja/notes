import { Injectable } from '@angular/core';
import { DBSchema, openDB } from 'idb';
import { NoteData } from './app.component';

const DB = 'offlineFormData';
const CHUNK_STORE = 'chunks';
const FORM_DATA_STORE = 'formData'
const VERSION = 1;

interface ChunkStoreData {
  id: string;
  fileId: number;
  chunkId: number;
  chunk: Blob;
}

interface OffineFormDb extends DBSchema {
  formData: {
    key: string;
    value: NoteData;
  },
  chunks: {
    key: string;
    value: ChunkStoreData;
    indexes: {
      id: string;
      fileId: [string, number]
    }
  }
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {

  private chunkSize = 5 * 1024 * 1024; // 5mb

  private dbPromise = openDB<OffineFormDb>(DB, VERSION, {
    upgrade(db) {
      const chunkStore = db.createObjectStore(CHUNK_STORE, { keyPath: [ 'id', 'fileId', 'chunkId'] });
      chunkStore.createIndex('id', 'id');
      chunkStore.createIndex('fileId', ['id','fileId']);
      db.createObjectStore(FORM_DATA_STORE, { keyPath: 'id' });
    },
  })


  async saveData(formData: NoteData, files: File[]) {
    const db = await this.dbPromise;

    for(let [fileIndex, file] of files.entries()) {
      const totalChunks = Math.ceil(file.size / this.chunkSize);
  
      for (let i = 0; i < totalChunks; i++) {
        const chunk = (file.slice(this.chunkSize * i, this.chunkSize * (i + 1)));
        await db.put(CHUNK_STORE, { id: formData.id, fileId: fileIndex, chunkId: i, chunk });
      }
    }


    await db.put(FORM_DATA_STORE, formData);
  }

  private async getFileChunks(submissionId: string, fileId: number) {
    const db = await this.dbPromise;
    const chunkIndex = db.transaction(CHUNK_STORE).store.index('fileId');
    const chunks = await chunkIndex.getAll([submissionId, fileId]);

    return new Blob(chunks.map(chunk => chunk.chunk));
  }

  private async getFiles(submissionId: string, formData: NoteData) {

    const files: File[] = [];
    for(let [fileIndex, fileMeta] of formData.files.entries()) {
      const chunks = await this.getFileChunks(submissionId, fileIndex);

      const file = new File([chunks], fileMeta?.name, { 
        lastModified: fileMeta?.lastModified, 
        type: fileMeta?.type 
      })

      files.push(file)
    }

    return files;
  }

  async getSubmission(submissionId: string) {
    const db = await this.dbPromise;

    const submission = await db.get(FORM_DATA_STORE, submissionId);

    if (!submission) return null;

    const formData = submission;

    const files = await this.getFiles(submissionId, formData);

    return { files, fileName: formData.fileName, description: formData.description, id: formData.id };
  }

  async getAllSubmissions() {
    const db = await this.dbPromise;

    const formSubmissions = await db.getAll(FORM_DATA_STORE);

    const allSubmissions = [];
    for(let formData of formSubmissions) {

      const notes = await this.getSubmission(formData.id);

      if(notes) allSubmissions.push( notes);
    }

    return allSubmissions;
  }

  async clearAll() {
    const db = await this.dbPromise;
    
    await db.clear(FORM_DATA_STORE);
    await db.clear(CHUNK_STORE);

  }


  constructor() { }
}