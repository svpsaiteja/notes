import { TestBed } from '@angular/core/testing';

import { LivFilesService } from './liv-files.service';

describe('LivFilesService', () => {
  let service: LivFilesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LivFilesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
