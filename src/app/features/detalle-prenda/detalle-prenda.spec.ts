import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DetallePrenda } from './detalle-prenda';

describe('DetallePrenda', () => {
  let component: DetallePrenda;
  let fixture: ComponentFixture<DetallePrenda>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetallePrenda],
    }).compileComponents();

    fixture = TestBed.createComponent(DetallePrenda);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
