import { Injectable } from '@angular/core';
import { openDB } from 'idb';
import { NoteData } from './app.component';

const DB = 'offlineFormData';
const CHUNK_STORE = 'chunks';
const FORM_DATA_STORE = 'formData'
const VERSION = 1;

interface FormSubmission {
  submissionId: string;
  formData: NoteData
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {

  private chunkSize = 5 * 1024 * 1024; // 5mb

  private dbPromise = openDB(DB, VERSION, {
    upgrade(db) {
      const chunkStore = db.createObjectStore(CHUNK_STORE, { keyPath: [ 'submissionId', 'fileId', 'chunkId'] });
      chunkStore.createIndex('submissionId', 'submissionId');
      chunkStore.createIndex('fileId', ['submissionId','fileId']);
      db.createObjectStore(FORM_DATA_STORE, { keyPath: 'submissionId' });
    },
  })


  async saveData(formData: NoteData, files: File[]) {
    const db = await this.dbPromise;
    const submissionId = new Date().toString();

    for(let [fileIndex, file] of files.entries()) {
      const totalChunks = Math.ceil(file.size / this.chunkSize);
  
      for (let i = 0; i < totalChunks; i++) {
        const chunk = (file.slice(this.chunkSize * i, this.chunkSize * (i + 1)));
        await db.put(CHUNK_STORE, { submissionId, fileId: fileIndex, chunkId: i, chunk });
      }
    }


    await db.put(FORM_DATA_STORE, { submissionId, formData });
  }

  private async getFileChunks(submissionId: string, fileId: number) {
    const db = await this.dbPromise;
    const chunkIndex = db.transaction(CHUNK_STORE).store.index('fileId');
    const chunks = await chunkIndex.getAll([submissionId, fileId]);

    return new Blob(chunks.map(chunk => chunk.chunk));
  }

  private async getFiles(submissionId: string) {
    const db = await this.dbPromise;

    const { formData }: { formData: NoteData} = await db.get(FORM_DATA_STORE, submissionId);

    if (!formData) return null;


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

    const { formData } = await db.get(FORM_DATA_STORE, submissionId);

    const files = await this.getFiles(submissionId);

    return { files, fileName: formData.fileName, description: formData.description };
  }

  async getAllSubmissions() {
    const db = await this.dbPromise;

    const formSubmissions: FormSubmission[] = await db.getAll(FORM_DATA_STORE);

    const allSubmissions = [];
    for(let submission of formSubmissions) {
      const {submissionId, formData } = submission;

      const notes = await this.getSubmission(submissionId);

      allSubmissions.push( notes);
    }

    return allSubmissions;
  }

  async clearAll() {
    const db = await this.dbPromise;

    return db.clear(FORM_DATA_STORE);
  }


  constructor() { }
}