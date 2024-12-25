import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { OfflineStorageService } from './offline-storage.service';
import { NetworkStatusService } from './network-status.service';
import { skip } from 'rxjs';
import { LivFilesService } from './liv-files.service';

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
      if(online)
        this.fetchAll();
    })
  }

  ngOnInit() {
    this.livFiles.getS3Url().subscribe(url => console.log('Url fetched - ',url))
  }

  async submit() {
    console.log(this.filesForm.value);
    if(!this.selectedFile) return;

    // if(!navigator.onLine) {
      await this.storage.saveData(this.selectedFile);
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
    const all = await this.storage.getAll();

    all.forEach((file, index) => console.log('file'+ index, new Blob([file])))
    console.log('all files', all);
    
  }

  async clearAll() {
    await this.storage.clearAll();
  }
}
