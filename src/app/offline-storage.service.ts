import { Injectable } from '@angular/core';
import { openDB } from 'idb';

const DB = 'offline';
const STORE = 'fileStore';
const VERSION = 1;

@Injectable({
  providedIn: 'root'
})
export class OfflineStorageService {

  async saveData(file: File) {
    const db = await openDB(DB, VERSION, {
      upgrade(db) {
        if(!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true})
        }
      },
    });

    console.log('db', db);
    console.log('file', file)
    
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file)
    fileReader.onload = () => {
      const file = fileReader.result;
      console.log(file)

      db.add(STORE, {file})
    }


  }

  async getAll() {
    const db = await openDB(DB);

    return db.getAll(STORE);
  }

  async clearAll() {
    const db = await openDB(DB);

    return db.clear(STORE);
  }
  

  constructor() { }
}
