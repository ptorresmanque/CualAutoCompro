import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
  viewChild,
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
  readonly remoteOptions = signal<{ id: string; [k: string]: unknown }[]>([]);
  private inputRef = viewChild<ElementRef<HTMLInputElement>>('input');

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

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
