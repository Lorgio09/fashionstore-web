import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crear-prenda',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './crear-prenda.html'
})
export class CrearPrendaComponent implements OnInit {
  nuevaPrenda = {
    nombre: '',
    descripcion: '',
    precio_base: 0,
    categoria_id: null as number | null,
    proveedor_id: null as number | null
  };

  imagenSeleccionada: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;

  categorias: any[] = [];
  proveedores: any[] = [];

  constructor(private http: HttpClient) {}

  // Esto se ejecuta automáticamente apenas abres la pantalla
  ngOnInit() {
    this.cargarCategorias();
    this.cargarProveedores();
  }

  cargarCategorias() {
    this.http.get('http://localhost:8000/api/catalogo/categorias').subscribe({
      next: (data: any) => this.categorias = data,
      error: (err) => console.error("Error al cargar categorías", err)
    });
  }

  cargarProveedores() {
    this.http.get('http://localhost:8000/api/catalogo/proveedores').subscribe({
      next: (data: any) => this.proveedores = data,
      error: (err) => console.error("Error al cargar proveedores", err)
    });
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
      const reader = new FileReader();
      reader.onload = e => this.imagenPreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  guardarPrenda() {
    // Validaciones extra de seguridad
    if (!this.imagenSeleccionada) {
      alert("Por favor, selecciona una imagen para la prenda.");
      return;
    }
    if (!this.nuevaPrenda.categoria_id || !this.nuevaPrenda.proveedor_id) {
      alert("Por favor, selecciona una categoría y un proveedor.");
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.nuevaPrenda.nombre);
    formData.append('descripcion', this.nuevaPrenda.descripcion);
    formData.append('precio_base', this.nuevaPrenda.precio_base.toString());
    formData.append('categoria_id', this.nuevaPrenda.categoria_id.toString());
    formData.append('proveedor_id', this.nuevaPrenda.proveedor_id.toString());
    formData.append('imagen', this.imagenSeleccionada);

    this.http.post('http://localhost:8000/api/catalogo/', formData).subscribe({
      next: (respuesta: any) => {
        alert('¡Prenda registrada con éxito!');
        // Aquí puedes reiniciar el formulario si lo deseas
      },
      error: (error) => {
        console.error("Error completo:", error);
        alert('Ocurrió un error al guardar la prenda.');
      }
    });
  }
}