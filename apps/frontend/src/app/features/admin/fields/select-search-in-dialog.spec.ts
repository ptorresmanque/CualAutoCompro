import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { SelectSearchComponent } from './select-search.component';
import { AdminEditDialogComponent } from '../admin-edit-dialog.component';
import { By } from '@angular/platform-browser';

describe('select-search dentro de admin-edit-dialog (integration)', () => {
  it('dropdown queda fuera del mat-form-field y del dialog-body overflow', async () => {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', 'model');
    fixture.componentRef.setInput('apiPath', 'models');
    fixture.detectChanges();
    const http = TestBed.inject(
      (await import('@angular/common/http/testing')).HttpTestingController,
    );
    http
      .expectOne((r) => r.url.includes('/api/v1/admin/seed/template/model'))
      .flush({
        data: { brandId: '', name: '', segment: 'SEDAN', imageUrl: null, galleryUrls: [] },
      });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    const selectSearch = fixture.debugElement.query(By.directive(SelectSearchComponent));
    expect(selectSearch).toBeTruthy();
    const input = selectSearch.nativeElement.querySelector(
      'input[role="combobox"]',
    ) as HTMLInputElement;
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    // Need to inject HTTP response for optionsApi
    const brandsReq = http.expectOne((r) => r.url.includes('/api/v1/brands'));
    brandsReq.flush({
      data: [
        { id: 'b1', name: 'Toyota' },
        { id: 'b2', name: 'Ford' },
      ],
    });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    const list = selectSearch.nativeElement.querySelector('ul.select-search-list');
    expect(list).toBeTruthy();
    expect(list.closest('mat-form-field')).toBeNull();

    const matFormField = selectSearch.nativeElement.querySelector('mat-form-field');
    expect(matFormField).toBeTruthy();
    expect(matFormField.contains(list)).toBe(false);

    // El <ul> debe estar como hermano del <mat-form-field>, dentro del wrapper .select-search-field
    const wrapper = selectSearch.nativeElement.querySelector('.select-search-field');
    expect(wrapper).toBeTruthy();
    expect(wrapper.contains(list)).toBe(true);
    expect(wrapper.contains(matFormField)).toBe(true);
  });
});