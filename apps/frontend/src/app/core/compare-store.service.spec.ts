import { TestBed } from '@angular/core/testing';
import { CompareStore } from './compare-store.service';

describe('CompareStore', () => {
  let store: CompareStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [CompareStore] });
    store = TestBed.inject(CompareStore);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('arranca vacío', () => {
    expect(store.ids()).toEqual([]);
  });

  it('agrega hasta 3 IDs', () => {
    store.add('a');
    store.add('b');
    store.add('c');
    store.add('d');
    expect(store.ids().length).toBe(3);
    expect(store.ids()).toEqual(['a', 'b', 'c']);
  });

  it('no agrega IDs duplicados', () => {
    store.add('a');
    store.add('a');
    expect(store.ids()).toEqual(['a']);
  });

  it('remove elimina un ID', () => {
    store.add('a');
    store.add('b');
    store.remove('a');
    expect(store.ids()).toEqual(['b']);
  });

  it('persiste en localStorage entre instancias', () => {
    store.add('x');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [CompareStore] });
    const s2 = TestBed.inject(CompareStore);
    expect(s2.ids()).toEqual(['x']);
  });

  it('hidrateFromUrl reemplaza selección', () => {
    store.add('a');
    store.hydrateFromUrl('x,y,z');
    expect(store.ids()).toEqual(['x', 'y', 'z']);
  });

  it('hidrateFromUrl corta a 3 elementos', () => {
    store.hydrateFromUrl('a,b,c,d,e');
    expect(store.ids()).toEqual(['a', 'b', 'c']);
  });

  it('clear vacía el store', () => {
    store.add('a');
    store.add('b');
    store.clear();
    expect(store.ids()).toEqual([]);
    expect(localStorage.getItem('cualautocompro:selectedVersionIds')).toBe(
      '[]',
    );
  });
});
