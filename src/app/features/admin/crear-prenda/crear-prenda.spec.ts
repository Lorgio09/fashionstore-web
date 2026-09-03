import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CrearPrenda } from './crear-prenda';

describe('CrearPrenda', () => {
  let component: CrearPrenda;
  let fixture: ComponentFixture<CrearPrenda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearPrenda],
    }).compileComponents();

    fixture = TestBed.createComponent(CrearPrenda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
