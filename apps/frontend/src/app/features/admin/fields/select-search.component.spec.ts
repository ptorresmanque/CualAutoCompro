import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { SelectSearchComponent } from './select-search.component';

describe('SelectSearchComponent', () => {
  it('con options estáticas filtra la lista al tipear', async () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV', 'PICKUP']);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.value = 'SU';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('SUV');
  });

  it('con optionsApi carga opciones via GET', async () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('optionsApi', '/brands');
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/api/v1/brands'));
    req.flush({ data: [{ id: 'b1', name: 'Toyota' }, { id: 'b2', name: 'Ford' }] });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('li[role="option"]');
    expect(items.length).toBe(2);
  });

  it('con allowOther permite tipear valor no listado y asignarlo al control', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV']);
    fixture.componentRef.setInput('allowOther', true);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.value = 'ELECTRIC_SUV';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[data-testid="select-other"]');
    expect(btn).toBeTruthy();
    btn.click();
    expect(ctrl.value).toBe('ELECTRIC_SUV');
  });

  it('con allowOther normaliza el texto libre a un token de enum válido', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['MANUAL', 'AUTOMATIC']);
    fixture.componentRef.setInput('allowOther', true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.value = 'Doble embrague';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[data-testid="select-other"]');
    btn.click();

    // Antes se guardaba "DOBLE EMBRAGUE" y el backend lo rechazaba por el espacio.
    expect(ctrl.value).toBe('DOBLE_EMBRAGUE');
  });

  it('con allowOther ignora un texto sin caracteres utilizables', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['MANUAL']);
    fixture.componentRef.setInput('allowOther', true);
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.value = '!!!';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[data-testid="select-other"]');
    btn.click();

    expect(ctrl.value).toBe('');
  });

  it('navega con ArrowDown/Enter y selecciona el highlighted option', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV', 'PICKUP', 'HATCHBACK']);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    expect(input.getAttribute('aria-activedescendant')).toBe('option-2');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(ctrl.value).toBe('PICKUP');
  });

  it('ArrowUp desde índice 0 hace wrap al último option', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV', 'PICKUP']);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(0);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.activeIndex()).toBe(2);
    expect(input.getAttribute('aria-activedescendant')).toBe('option-2');
  });

  it('renderiza el dropdown fuera del mat-form-field para evitar clipping/translucencia del MDC wrapper', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV']);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const list = fixture.nativeElement.querySelector('ul.select-search-list');
    expect(list).toBeTruthy();
    const matFormField = fixture.nativeElement.querySelector('mat-form-field');
    expect(list.closest('mat-form-field')).toBeNull();
  });

  it('click en una opción filtra el evento en el document handler y asigna el control', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV']);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const option: HTMLLIElement = fixture.nativeElement.querySelector('li[role="option"]');
    option.click();
    fixture.detectChanges();
    expect(ctrl.value).toBe('SEDAN');
    const listAfter = fixture.nativeElement.querySelector('ul.select-search-list');
    expect(listAfter).toBeNull();
  });

  it('click en opción estática actualiza el input con el label del valor seleccionado', () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('options', ['SEDAN', 'SUV', 'PICKUP']);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.value = 'PI';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('li[role="option"]') as NodeListOf<HTMLLIElement>;
    expect(options.length).toBe(1);
    options[0].click();
    fixture.detectChanges();
    expect(ctrl.value).toBe('PICKUP');
    const inputAfter: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    expect(inputAfter.value).toBe('PICKUP');
  });

  it('click en opción remota (FK) setea el control con el id y muestra el label en el input', async () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('optionsApi', '/brands');
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/api/v1/brands'));
    req.flush({ data: [{ id: 'b1', name: 'Toyota' }, { id: 'b2', name: 'Ford' }] });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
    const options = fixture.nativeElement.querySelectorAll('li[role="option"]') as NodeListOf<HTMLLIElement>;
    expect(options.length).toBe(2);
    const toyotaOption = Array.from(options).find((o) => o.textContent?.includes('Toyota'))!;
    toyotaOption.click();
    fixture.detectChanges();
    expect(ctrl.value).toBe('b1');
    const inputAfter: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    expect(inputAfter.value).toBe('Toyota');
  });

  it('al editar con FK ya seteado, el input muestra el label (no el id) tras cargar opciones', async () => {
    TestBed.configureTestingModule({
      imports: [SelectSearchComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(SelectSearchComponent);
    const ctrl = new FormControl<string>('b1', { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('optionsApi', '/brands');
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne((r) => r.url.includes('/api/v1/brands'));
    req.flush({ data: [{ id: 'b1', name: 'Toyota' }, { id: 'b2', name: 'Ford' }] });
    await new Promise((r) => setTimeout(r, 0));
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input[role="combobox"]');
    expect(input.value).toBe('Toyota');
    expect(ctrl.value).toBe('b1');
  });
});