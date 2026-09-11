import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GestionProveedores } from './gestion-proveedores';

describe('GestionProveedores', () => {
  let component: GestionProveedores;
  let fixture: ComponentFixture<GestionProveedores>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GestionProveedores],
    }).compileComponents();

    fixture = TestBed.createComponent(GestionProveedores);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
