import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  it('starts at 0 (not loading)', () => {
    const svc = TestBed.inject(LoadingService);
    expect(svc.loading()).toBe(false);
  });

  it('loading becomes true while at least one request is in flight', () => {
    const svc = TestBed.inject(LoadingService);
    svc.start();
    expect(svc.loading()).toBe(true);
    svc.start();
    expect(svc.loading()).toBe(true);
    svc.stop();
    expect(svc.loading()).toBe(true);
    svc.stop();
    expect(svc.loading()).toBe(false);
  });

  it('never goes below zero when stopped more than started', () => {
    const svc = TestBed.inject(LoadingService);
    svc.stop();
    svc.stop();
    expect(svc.loading()).toBe(false);
    svc.start();
    svc.stop();
    expect(svc.loading()).toBe(false);
  });
});
