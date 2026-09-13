import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Temporadas } from './temporadas';

describe('Temporadas', () => {
  let component: Temporadas;
  let fixture: ComponentFixture<Temporadas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Temporadas],
    }).compileComponents();

    fixture = TestBed.createComponent(Temporadas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
