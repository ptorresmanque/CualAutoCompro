import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ToggleFieldComponent } from './toggle-field.component';

describe('ToggleFieldComponent', () => {
  it('renderiza aria-checked=false cuando control.value es false', () => {
    TestBed.configureTestingModule({ imports: [ToggleFieldComponent] });
    const fixture = TestBed.createComponent(ToggleFieldComponent);
    const ctrl = new FormControl<boolean>(false, { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[role="switch"]');
    expect(btn.getAttribute('aria-checked')).toBe('false');
  });

  it('click cambia el valor del control y aria-checked', () => {
    TestBed.configureTestingModule({ imports: [ToggleFieldComponent] });
    const fixture = TestBed.createComponent(ToggleFieldComponent);
    const ctrl = new FormControl<boolean>(false, { nonNullable: true });
    fixture.componentRef.setInput('control', ctrl);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[role="switch"]');
    btn.click();
    expect(ctrl.value).toBe(true);
    fixture.detectChanges();
    expect(btn.getAttribute('aria-checked')).toBe('true');
  });
});
