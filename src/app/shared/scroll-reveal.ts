import { Directive, ElementRef, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit {
  constructor(
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    // Solo ejecutamos la animación y el Observer si estamos en el navegador
    if (isPlatformBrowser(this.platformId)) {
      this.el.nativeElement.classList.add('opacity-0', 'translate-y-4');
      
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          this.el.nativeElement.classList.add('transition-all', 'duration-500', 'ease-out');
          this.el.nativeElement.classList.remove('opacity-0', 'translate-y-4');
          observer.unobserve(this.el.nativeElement);
        }
      }, { threshold: 0.15 });
      
      observer.observe(this.el.nativeElement);
    }
  }
}