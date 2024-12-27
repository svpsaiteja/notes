import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import { skip } from 'rxjs';
import { LivFilesService } from './liv-files.service';

export interface FormData {
  fileName: any;
  description: any,
  fileMeta: {
    name: string; 
    type: string; 
    lastModified: number;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  selectedFile: File | null = null;

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
    if (!this.selectedFile) return;

    // if(!navigator.onLine) {
    const formData: FormData = { 
      fileName: this.filesForm.value.fileName,
      description: this.filesForm.value.description,
      fileMeta: {
        name: this.selectedFile.name, 
        type: this.selectedFile.type, 
        lastModified: this.selectedFile.lastModified,
      }
    }
    await this.storage.saveData(formData, this.selectedFile);
    // }

    this.resetForm();
  }

  resetForm() {
    this.filesForm.reset();
    this.selectedFile = null;
  }

  async onFileSelect(event: any) {
    console.log(event.target.files);
    this.selectedFile = event.target?.files?.[0];
  }

  async fetchAll() {
    const allSubmissions = await this.storage.getAllSubmissions();
    
    
    for(let submission of allSubmissions) {
      console.log(submission);
    }

  }

  // TODO: fix the method
  async downloadAllFiles() {
    
    const allSubmissions = await this.storage.getAllSubmissions();


    allSubmissions.forEach(async ({ file }) => {
      if(!file) return;

      const url = URL.createObjectURL(file); 
      const a = document.createElement('a'); a.href = url; 
      a.download = file.name; 
      document.body.appendChild(a); 
      a.click(); 
      document.body.removeChild(a); 
      URL.revokeObjectURL(url);
    })
  }

  async clearAll() {
    await this.storage.clearAll();
  }
}
