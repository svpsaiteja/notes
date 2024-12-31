import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { skip } from 'rxjs';
import { NoteData } from '../app.component';
import { LivFilesService } from '../liv-files.service';
import { NetworkStatusService } from '../network-status.service';
import { OfflineStorageService } from '../offline-storage.service';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { BackgroundSyncService } from '../background-sync.service';

@Component({
  selector: 'app-note-form',
  templateUrl: './note-form.component.html',
  styleUrls: ['./note-form.component.scss']
})
export class NoteFormComponent {

  selectedFiles: File[] | null = null;

  filesForm = this.fb.group({
    id: [uuidv4()],
    fileName: [''],
    description: [''],
    file: [['']]
  })

  constructor(private fb: FormBuilder, 
    private router: Router,
    private route: ActivatedRoute,
    private storage: OfflineStorageService, private ns: NetworkStatusService,
    private livFiles: LivFilesService,
    private backgroundSync: BackgroundSyncService

  ) {
  }

  ngOnInit() {

    this.initNote();

  }

  async initNote() {
    const {id} = this.route.snapshot.params;
    if(!id || id === 'add') return;

    // TODO: fix this
    const note  = await this.storage.getSubmission(id);

    if(note) {
      this.filesForm.patchValue({
        id: note.id,
        fileName: note.fileName,
        description: note.description
      })

      this.selectedFiles = note.files
    }

     

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
      id: this.filesForm.value.id!,
      fileName: this.filesForm.value.fileName,
      description: this.filesForm.value.description,
      files: fileMetaDatas
    }

    // if(!navigator.onLine) {
    await this.storage.saveData(formData, this.selectedFiles);
    // }

    this.resetForm();

    this.backgroundSync.initBackgroundSync();

    this.router.navigate(['']);
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
