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

  private chunkSize = 10 * 1024 * 1024; // 5mb

  private dbPromise = openDB(DB, VERSION, {
    upgrade(db) {
      const chunkStore = db.createObjectStore(CHUNK_STORE, { keyPath: [ 'submissionId', 'fileId', 'chunkId'] });
      chunkStore.createIndex('submissionId', 'submissionId');
      chunkStore.createIndex('fileId', 'fileId');
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


    // const fileReader = new FileReader();
    // fileReader.readAsArrayBuffer(file)
    // fileReader.onload = () => {
    //   const file = fileReader.result;
    //   console.log(file)

    //   db.add(STORE, {file})
    // }


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

  async getAllSubmissions() {
    const db = await this.dbPromise;

    const formSubmissions: FormSubmission[] = await db.getAll(FORM_DATA_STORE);

    const allSubmissions = [];
    for(let submission of formSubmissions) {
      const {submissionId, formData } = submission;

      const files = await this.getFiles(submissionId);

      allSubmissions.push( { files, fileName: formData.fileName, description: formData.description });
    }

    return allSubmissions;

  }

  async clearAll() {
    const db = await this.dbPromise;

    return db.clear(FORM_DATA_STORE);
  }


  constructor() { }
}



import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import { skip } from 'rxjs';
import { LivFilesService } from './liv-files.service';

export interface NoteData {
  fileName: any;
  description: any,
  files: {
    name: string; 
    type: string; 
    lastModified: number;
  }[]
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  selectedFiles: File[] | null = null;

  filesForm = this.fb.group({
    fileName: [''],
    description: [''],
    file: []
  })

  constructor(private fb: FormBuilder, private storage: OfflineStorageService, private ns: NetworkStatusService,
    private livFiles: LivFilesService

  ) {
    ns.networkStatus$.pipe(skip(1)).subscribe(online => {
      if (online)
        this.fetchAll();
    })
  }

  ngOnInit() {
    this.livFiles.getS3Url().subscribe(url => console.log('Url fetched - ', url))
  }

  async submit() {
    console.log(this.filesForm.value);
    if (!this.selectedFiles) return;

    const fileMetaDatas = this.selectedFiles.map(f => ({
      name: f.name,
      type: f.type,
      lastModified: f.lastModified
    }))

    // if(!navigator.onLine) {
    const formData: NoteData = { 
      fileName: this.filesForm.value.fileName,
      description: this.filesForm.value.description,
      files: fileMetaDatas
    }
    await this.storage.saveData(formData, this.selectedFiles);
    // }

    this.resetForm();
  }

  resetForm() {
    this.filesForm.reset();
    this.selectedFiles = null;
  }

  onFileSelect(event: any) {
    console.log(event.target.files);
    this.selectedFiles = Array.from(event.target?.files ?? []);
  }

  async fetchAll() {
    const allSubmissions = await this.storage.getAllSubmissions();
    
    
    for(let submission of allSubmissions) {
      console.log(submission);
    }
  }

  async downloadAllFiles() {
    
    const allSubmissions= await this.storage.getAllSubmissions();


    allSubmissions.forEach(({ files }) => {
      if(!files) return;

      for(let file of files) {
        const url = URL.createObjectURL(file); 
        const a = document.createElement('a'); a.href = url; 
        a.download = file.name; 
        document.body.appendChild(a); 
        a.click(); 
        document.body.removeChild(a); 
        URL.revokeObjectURL(url);
      }
  
    })
  }

  //TODO: Fix
  async clearAll() {
    await this.storage.clearAll();
  }
}
