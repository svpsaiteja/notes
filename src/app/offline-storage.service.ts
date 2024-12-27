import { Injectable } from '@angular/core';
import { openDB } from 'idb';
import { FormData } from './app.component';

const DB = 'offlineFormData';
const CHUNK_STORE = 'chunks';
const FORM_DATA_STORE = 'formData'
const VERSION = 1;

interface FormSubmission {
  submissionId: string;
  formData: FormData
}

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {

  private chunkSize = 10 * 1024 * 1024; //5mb

  private dbPromise = openDB(DB, VERSION, {
    upgrade(db) {
      const chunkStore = db.createObjectStore(CHUNK_STORE, { keyPath: ['chunkId', 'submissionId'] });
      chunkStore.createIndex('submissionId', 'submissionId');
      db.createObjectStore(FORM_DATA_STORE, { keyPath: 'submissionId' });
    },
  })


  async saveData(formData: any, file: File) {
    const db = await this.dbPromise;
    const submissionId = new Date().toString();

    const totalChunks = Math.ceil(file.size / this.chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = (file.slice(this.chunkSize * i, this.chunkSize * (i + 1)));
      await db.put(CHUNK_STORE, { submissionId, chunkId: i, chunk });
    }

    await db.put(FORM_DATA_STORE, { submissionId, formData });


    // const fileReader = new FileReader();
    // fileReader.readAsArrayBuffer(file)
    // fileReader.onload = () => {
    //   const file = fileReader.result;
    //   console.log(file)

    //   db.add(STORE, {file})
    // }


  }

  private async getChunks(submissionId: string) {
    const db = await this.dbPromise;
    const chunkIndex = db.transaction(CHUNK_STORE).store.index('submissionId');
    const chunks = await chunkIndex.getAll(submissionId);

    return new Blob(chunks.map(chunk => chunk.chunk));
  }

  private async getFile(submissionId: string) {
    const db = await this.dbPromise;

    const { formData } = await db.get(FORM_DATA_STORE, submissionId);

    if (!formData) return null;

    const chunks = await this.getChunks(submissionId)

    return new File([chunks], formData?.fileMeta?.name, { 
      lastModified: formData?.fileMeta?.lastModified, 
      type: formData?.fileMeta?.type 
    });
  }

  async getAllSubmissions() {
    const db = await this.dbPromise;

    const formSubmissions: FormSubmission[] = await db.getAll(FORM_DATA_STORE);

    const allSubmissions = [];
    for(let submission of formSubmissions) {
      const {submissionId, formData } = submission;

      const file = await this.getFile(submissionId);

      allSubmissions.push( { file, fileName: formData.fileName, description: formData.description });
    }

    return allSubmissions;

  }

  async clearAll() {
    const db = await this.dbPromise;

    return db.clear(FORM_DATA_STORE);
  }


  constructor() { }
}
