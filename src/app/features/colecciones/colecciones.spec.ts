import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Colecciones } from './colecciones';

describe('Colecciones', () => {
  let component: Colecciones;
  let fixture: ComponentFixture<Colecciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Colecciones],
    }).compileComponents();

    fixture = TestBed.createComponent(Colecciones);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
