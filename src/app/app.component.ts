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

    const formData: NoteData = { 
      fileName: this.filesForm.value.fileName,
      description: this.filesForm.value.description,
      files: fileMetaDatas
    }

    // if(!navigator.onLine) {
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
