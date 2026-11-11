import {
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';

export interface SelectOption {
  label: string;
  value: any;
  icon?: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  templateUrl: './custom-select.html',
  styleUrl: './custom-select.css',
})
export class CustomSelect {
  private elementRef = inject(ElementRef);

  label = input<string>('');
  placeholder = input<string>('Select an option');
  icon = input<string>('');
  ariaLabel = input<string>('');
  disabled = input<boolean>(false);

  value = model<any>('');
  options = input<Array<SelectOption | string | number>>([]);

  isOpen = signal(false);

  normalizedOptions = computed<SelectOption[]>(() => {
    return this.options().map((opt) => {
      if (typeof opt === 'object' && opt !== null && 'value' in opt) {
        return opt as SelectOption;
      }
      return {
        label: String(opt),
        value: opt,
      };
    });
  });

  selectedOption = computed(() => {
    const currentVal = this.value();
    return this.normalizedOptions().find((opt) => opt.value === currentVal) ?? null;
  });

  displayLabel = computed(() => {
    const selected = this.selectedOption();
    if (selected && selected.label) {
      return selected.label;
    }
    return this.placeholder() || 'Select an option';
  });

  toggle(): void {
    if (this.disabled()) return;
    this.isOpen.update((v) => !v);
  }

  close(): void {
    this.isOpen.set(false);
  }

  select(optionValue: any): void {
    this.value.set(optionValue);
    this.close();
  }

  isSelected(optionValue: any): boolean {
    return this.value() === optionValue;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }

  @HostListener('keydown.escape')
  onEscape(): void {
    this.close();
  }
}
