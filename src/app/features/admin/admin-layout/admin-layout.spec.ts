import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

// Como estamos en la misma carpeta, basta con buscar el archivo local
import { AdminLayoutComponent } from './admin-layout'; 

// Subimos tres niveles: admin-layout -> admin -> features -> app, y entramos a core
import { AuthService } from '../../../core/services/auth'; 
declare var jasmine: any;

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;

  const mockAuthService = {
    getUsuarioActual: jasmine.createSpy('getUsuarioActual').and.returnValue({ rol: 'Administrador' }),
    tieneRol: jasmine.createSpy('tieneRol').and.callFake((rol: string) => rol === 'Administrador'),
    cerrarSesion: jasmine.createSpy('cerrarSesion')
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); 
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});