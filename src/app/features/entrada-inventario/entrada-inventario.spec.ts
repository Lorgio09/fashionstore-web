import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EntradaInventario } from './entrada-inventario';

describe('EntradaInventario', () => {
  let component: EntradaInventario;
  let fixture: ComponentFixture<EntradaInventario>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntradaInventario],
    }).compileComponents();

    fixture = TestBed.createComponent(EntradaInventario);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
