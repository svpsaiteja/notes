import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class LivFilesService {

  constructor() { }

  getS3Url() {
    return of('aws-url').pipe(delay(5000))
  }
}
