import { Component } from '@angular/core';

export interface NoteData {
  id: string;
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
}
