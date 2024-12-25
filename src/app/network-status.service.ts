import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NetworkStatusService {

  private networkStatus = new BehaviorSubject<boolean>(true);
  networkStatus$ = this.networkStatus.asObservable();

  constructor() {
    window.addEventListener('online', () => this.networkStatus.next(true));
    window.addEventListener('offline', () => this.networkStatus.next(false));
  }
}
