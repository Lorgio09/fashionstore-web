import { Directive, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[appScrollReveal]',
  standalone: true
})
export class ScrollRevealDirective implements OnInit {
  constructor(private el: ElementRef) {}

  ngOnInit() {
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