import { Component } from '@angular/core';
import { BackgroundSyncService } from './background-sync.service';

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
  constructor(private bgs: BackgroundSyncService) {}

  async ngOnInit() {
    // await this.initializeServiceWorker();
  }

  // async initializeServiceWorker() {
  //   if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
  //     try {
  //       const registration = await navigator.serviceWorker.register('service-worker.js');
  //       console.log('Service Worker registered:', registration);
  //     } catch (error) {
  //       console.error('Service Worker registration failed:', error);
  //     }
  //   } else {
  //     console.log('Background Sync not supported');
  //   }
  // }
}
