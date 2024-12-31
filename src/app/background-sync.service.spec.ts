import { TestBed } from '@angular/core/testing';

import { BackgroundSyncService } from './background-sync.service';

describe('BackgroundSyncService', () => {
  let service: BackgroundSyncService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackgroundSyncService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
