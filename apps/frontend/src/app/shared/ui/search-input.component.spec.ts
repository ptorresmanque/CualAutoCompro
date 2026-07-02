import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let fixture: ComponentFixture<SearchInputComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [SearchInputComponent] });
    fixture = TestBed.createComponent(SearchInputComponent);
    fixture.componentRef.setInput('placeholder', 'Buscar…');
    fixture.detectChanges();
  });

  it('no muestra la X cuando el value está vacío', () => {
    const btn: HTMLButtonElement | null = fixture.nativeElement.querySelector('button[aria-label="Limpiar búsqueda"]');
    expect(btn).toBeNull();
  });

  it('muestra la X cuando hay value y emite "" al hacer click', () => {
    fixture.componentRef.setInput('value', 'toyota');
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Limpiar búsqueda"]');
    expect(btn).toBeTruthy();
    const emitted: string[] = [];
    fixture.componentInstance.changed.subscribe((v: string) => emitted.push(v));
    btn.click();
    expect(emitted).toEqual(['']);
    expect(fixture.componentInstance.value()).toBe('');
  });
});