import { Directive, ElementRef, Input, AfterViewInit, inject, numberAttribute } from '@angular/core';

@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements AfterViewInit {
  /** Delay in ms — usable as `appReveal="120"` or `delay="120"`. */
  @Input({ transform: (v: unknown) => numberAttribute(v, 0) }) appReveal = 0;
  @Input({ transform: (v: unknown) => numberAttribute(v, 0) }) delay = 0;
  private el = inject(ElementRef<HTMLElement>);

  ngAfterViewInit(): void {
    const node = this.el.nativeElement;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setTimeout(() => node.classList.add('in'), this.delay || this.appReveal);
            observer.unobserve(node);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    observer.observe(node);
  }
}
