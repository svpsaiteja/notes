import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class BackgroundSyncService {

  constructor() {
  }


  async initBackgroundSync() {
    if('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration: any = await navigator.serviceWorker.ready;
      console.log('Registration',registration)

      try {
        await registration.sync.register('sync-forms');
        console.log("Sync registerd successfully")
      } catch (error) {
        console.log('Background sync registration failed - ', error)
      }
    }
  }
}
