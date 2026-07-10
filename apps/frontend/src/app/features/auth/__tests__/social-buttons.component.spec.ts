import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SocialButtonsComponent } from '../social-buttons.component';
import { ENV } from '../../../core/env';

describe('SocialButtonsComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<SocialButtonsComponent>>;
  let component: SocialButtonsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialButtonsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SocialButtonsComponent);
    component = fixture.componentInstance;
  });

  function setupFetchResponse(body: { data: { google: boolean; apple: boolean } }): void {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => body,
      }),
    );
  }

  afterEach(() => {
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${ENV.apiBase}/auth/providers`,
      { credentials: 'include' },
    );
    vi.unstubAllGlobals();
  });

  it('muestra ambos botones cuando /auth/providers devuelve ambos true', async () => {
    setupFetchResponse({ data: { google: true, apple: true } });
    await component.ngOnInit();
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.getAttribute('aria-label')).toBe('Continuar con Google');
    expect(buttons[1]?.getAttribute('aria-label')).toBe('Continuar con Apple');
  });

  it('oculta el boton Apple si no esta configurado', async () => {
    setupFetchResponse({ data: { google: true, apple: false } });
    await component.ngOnInit();
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0]?.getAttribute('aria-label')).toBe('Continuar con Google');
  });

  it('no muestra botones si la llamada falla', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));
    await component.ngOnInit();
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
