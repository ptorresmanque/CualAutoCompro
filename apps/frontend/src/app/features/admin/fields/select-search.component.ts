import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService } from '../../../core/api.service';

interface OptionItem { id?: string; value?: string; label: string; isOther?: boolean; }

@Component({
  selector: 'app-select-search',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './select-search.component.html',
  styleUrl: './select-search.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectSearchComponent implements OnInit {
  private api = inject(ApiService);
  private el = inject(ElementRef<HTMLElement>);

  readonly control = input.required<FormControl<string>>();
  readonly options = input<string[] | null>(null);
  readonly optionsApi = input<string | null>(null);
  readonly optionLabel = input<string>('name');
  readonly allowOther = input<boolean>(false);

  readonly query = signal('');
  readonly open = signal(false);
  readonly activeIndex = signal(0);
  readonly remoteOptions = signal<{ id: string; [k: string]: unknown }[]>([]);

  // Posicion del dropdown anclado al input. Se usa `position: fixed` para
  // escapar el `overflow: hidden` del dialog que aloja al componente.
  readonly dropdownTop = signal<string>('0px');
  readonly dropdownLeft = signal<string>('0px');
  readonly dropdownWidth = signal<string>('0px');
  readonly flipped = signal(false);

  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');

  constructor() {
    effect(() => {
      this.query();
      this.activeIndex.set(0);
    });
  }

  readonly filtered = computed<OptionItem[]>(() => {
    const q = this.query().toLowerCase();
    const staticOpts: OptionItem[] = (this.options() ?? []).map((v) => ({ value: v, label: v }));
    const remote = this.remoteOptions();
    const remoteOpts: OptionItem[] = Array.isArray(remote)
      ? remote.map((o) => ({
          id: o['id'] as string,
          label: String(o[this.optionLabel()] ?? ''),
        }))
      : [];
    const all = [...staticOpts, ...remoteOpts];
    const matches = q ? all.filter((o) => o.label.toLowerCase().includes(q)) : all;
    if (this.allowOther() && q && !matches.some((m) => m.label.toLowerCase() === q)) {
      matches.push({ label: `Otro: ${this.query()}`, isOther: true });
    }
    return matches;
  });

  ngOnInit(): void {
    if (this.optionsApi()) {
      void this.loadRemote();
    } else {
      const current = this.control().value;
      if (current) this.query.set(current);
    }
  }

  private async loadRemote(): Promise<void> {
    try {
      const res = await this.api.get<{ data: { id: string }[] }>(this.optionsApi()!);
      this.remoteOptions.set(res.data as { id: string }[]);
      const current = this.control().value;
      if (current && !this.query()) {
        const match = this.remoteOptions().find((o) => o.id === current);
        if (match) {
          this.query.set(String(match[this.optionLabel()] ?? ''));
        } else {
          this.query.set(current);
        }
      }
    } catch {
      this.remoteOptions.set([]);
    }
  }

  positionDropdown(): void {
    const el = this.input()?.nativeElement;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportH = window.innerHeight;
    // 15rem ≈ 240px (CSS). Si no entra abajo, flip.
    const maxH = 240;
    const wantTop = rect.bottom + 4;
    const wantFlipped = wantTop + maxH > viewportH && rect.top - 4 - maxH > 0;

    if (wantFlipped) {
      this.flipped.set(true);
      this.dropdownTop.set(`${Math.max(rect.top - 4 - maxH, 4)}px`);
    } else {
      this.flipped.set(false);
      this.dropdownTop.set(`${Math.min(wantTop, viewportH - maxH - 4)}px`);
    }
    this.dropdownLeft.set(`${rect.left}px`);
    this.dropdownWidth.set(`${rect.width}px`);
  }

  onInput(v: string): void {
    this.query.set(v);
    this.open.set(true);
  }

  pick(item: OptionItem): void {
    let value: string;
    let display: string;
    if (item.isOther) {
      value = this.query().toUpperCase();
      display = value;
    } else if (item.id != null) {
      value = item.id;
      display = item.label;
    } else {
      value = item.value ?? item.label;
      display = value;
    }
    this.control().setValue(value);
    this.query.set(display);
    this.open.set(false);
  }

  onPick(value: string): void {
    this.control().setValue(value);
  }

  onArrowDown(e: Event): void {
    e.preventDefault();
    const len = this.filtered().length;
    if (len === 0) return;
    this.activeIndex.update((i) => (i + 1) % len);
    this.positionDropdown();
  }

  onArrowUp(e: Event): void {
    e.preventDefault();
    const len = this.filtered().length;
    if (len === 0) return;
    this.activeIndex.update((i) => (i <= 0 ? len - 1 : i - 1));
    this.positionDropdown();
  }

  onEnter(e: Event): void {
    const idx = this.activeIndex();
    const list = this.filtered();
    if (idx >= 0 && list.length > 0) {
      e.preventDefault();
      this.pick(list[idx]);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) this.open.set(false);
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  onWindowChange(): void {
    if (this.open()) this.positionDropdown();
  }
}
