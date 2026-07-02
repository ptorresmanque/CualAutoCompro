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
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';

interface OptionItem { id?: string; value?: string; label: string; isOther?: boolean; }

@Component({
  selector: 'app-select-search',
  imports: [ReactiveFormsModule],
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

  constructor() {
    effect(() => {
      this.query();
      this.activeIndex.set(0);
    });
  }

  readonly filtered = computed<OptionItem[]>(() => {
    const q = this.query().toLowerCase();
    const staticOpts: OptionItem[] = (this.options() ?? []).map((v) => ({ value: v, label: v }));
    const remoteOpts: OptionItem[] = this.remoteOptions().map((o) => ({
      id: o['id'] as string,
      label: String(o[this.optionLabel()] ?? ''),
    }));
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
    }
    const current = this.control().value;
    if (current) this.query.set(current);
  }

  private async loadRemote(): Promise<void> {
    try {
      const res = await this.api.get<{ data: { id: string }[] }>(this.optionsApi()!);
      this.remoteOptions.set(res.data as { id: string }[]);
    } catch {
      this.remoteOptions.set([]);
    }
  }

  onInput(v: string): void {
    this.query.set(v);
    this.open.set(true);
  }

  pick(item: OptionItem): void {
    if (item.isOther) {
      this.control().setValue(this.query().toUpperCase());
    } else {
      this.control().setValue(item.value ?? item.label);
    }
    this.open.set(false);
  }

  onArrowDown(e: Event): void {
    e.preventDefault();
    const len = this.filtered().length;
    if (len === 0) return;
    this.activeIndex.update((i) => (i + 1) % len);
  }

  onArrowUp(e: Event): void {
    e.preventDefault();
    const len = this.filtered().length;
    if (len === 0) return;
    this.activeIndex.update((i) => (i <= 0 ? len - 1 : i - 1));
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
}
