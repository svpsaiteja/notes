import { Component } from '@angular/core';
import { OfflineStorageService } from '../offline-storage.service';

@Component({
  selector: 'app-note-list',
  templateUrl: './note-list.component.html',
  styleUrls: ['./note-list.component.scss']
})
export class NoteListComponent {

  localNotes: {
    files: File[];
    fileName: any;
    description: any;
    id: string
  }[] = [];

  constructor(private storage: OfflineStorageService) { }


  async ngOnInit() {
    this.localNotes = await this.storage.getAllSubmissions();
  }

}
