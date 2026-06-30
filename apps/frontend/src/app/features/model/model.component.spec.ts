import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
} from '@angular/router';
import { of } from 'rxjs';
import { ModelComponent } from './model.component';

/**
 * Carrusel spec — tests the carousel logic by manually stubbing the model
 * signal on the ModelComponent instance and avoiding the full async bootstrap.
 */
describe('ModelComponent — carrusel', () => {
  const GALLERY = [
    'https://placehold.co/1280x720/008080/ffffff?text=Frontal',
    'https://placehold.co/1280x720/006565/ffffff?text=Lateral',
    'https://placehold.co/1280x720/93f2f2/006565?text=Interior',
    'https://placehold.co/1280x720/c6e9e9/006565?text=Posterior',
  ];

  beforeEach(() => {
    TestBed.resetTestingModule();
    const paramMap: ParamMap = convertToParamMap({
      brandSlug: 'toyota',
      modelSlug: 'corolla',
    });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(paramMap), snapshot: { paramMap } },
        },
      ],
    });
  });

  function createWithGallery(galleryUrls: string[]) {
    const fixture = TestBed.createComponent(ModelComponent);
    const cmp = fixture.componentInstance as ModelComponent;
    (cmp as any).model.set({
      id: 'm1',
      name: 'Corolla',
      segment: 'SEDAN',
      brand: { name: 'Toyota' },
      versions: [],
      galleryUrls,
    });
    return { fixture, cmp };
  }

  it('hasGallery true cuando hay al menos 1 URL', () => {
    const { cmp } = createWithGallery(GALLERY);
    expect(cmp.hasGallery()).toBe(true);
    expect(cmp.galleryUrls().length).toBe(4);
  });

  it('hasGallery false cuando galleryUrls vacío', () => {
    const { cmp } = createWithGallery([]);
    expect(cmp.hasGallery()).toBe(false);
    expect(cmp.galleryUrls().length).toBe(0);
  });

  it('currentIndex() inicia en 0 y currentUrl en la primera imagen', () => {
    const { cmp } = createWithGallery(GALLERY);
    expect(cmp.currentIndex()).toBe(0);
    expect(cmp.currentUrl()).toBe(GALLERY[0]);
  });

  it('next() avanza circularmente y envuelve al final', () => {
    const { cmp } = createWithGallery(GALLERY);
    cmp.next();
    expect(cmp.currentIndex()).toBe(1);
    expect(cmp.currentUrl()).toBe(GALLERY[1]);
    cmp.next();
    cmp.next();
    expect(cmp.currentIndex()).toBe(3);
    cmp.next();
    expect(cmp.currentIndex()).toBe(0);
  });

  it('prev() retrocede circularmente y envuelve al inicio', () => {
    const { cmp } = createWithGallery(GALLERY);
    cmp.prev();
    expect(cmp.currentIndex()).toBe(3);
    expect(cmp.currentUrl()).toBe(GALLERY[3]);
    cmp.prev();
    expect(cmp.currentIndex()).toBe(2);
  });

  it('goTo(i) navega a un slide específico', () => {
    const { cmp } = createWithGallery(GALLERY);
    cmp.goTo(2);
    expect(cmp.currentIndex()).toBe(2);
    expect(cmp.currentUrl()).toBe(GALLERY[2]);
    cmp.goTo(0);
    expect(cmp.currentIndex()).toBe(0);
  });

  it('goTo con índice fuera de rango no cambia nada', () => {
    const { cmp } = createWithGallery(GALLERY);
    cmp.goTo(-1);
    expect(cmp.currentIndex()).toBe(0);
    cmp.goTo(99);
    expect(cmp.currentIndex()).toBe(0);
  });
});
