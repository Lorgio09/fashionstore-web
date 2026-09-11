import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionSucursales } from './gestion-sucursales';

describe('GestionSucursales', () => {
  let component: GestionSucursales;
  let fixture: ComponentFixture<GestionSucursales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionSucursales],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionSucursales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
