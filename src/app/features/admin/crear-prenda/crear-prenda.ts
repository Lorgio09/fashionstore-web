import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-crear-prenda',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './crear-prenda.html'
})
export class CrearPrendaComponent {
  nuevaPrenda = {
    nombre: '',
    descripcion: '',
    precio_base: 0,
    categoria_id: 1, 
    proveedor_id: 1  
  };

  imagenSeleccionada: File | null = null;
  imagenPreview: string | ArrayBuffer | null = null;

  constructor(private http: HttpClient) {}

  // Esta función se ejecuta cuando el administrador elige una foto
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.imagenSeleccionada = file;
      
      // Creamos la vista previa de la imagen
      const reader = new FileReader();
      reader.onload = e => this.imagenPreview = reader.result;
      reader.readAsDataURL(file);
    }
  }

  guardarPrenda() {
    if (!this.imagenSeleccionada) {
      alert("Por favor, selecciona una imagen para la prenda.");
      return;
    }

    // Armamos el "paquete" con los datos y el archivo
    const formData = new FormData();
    formData.append('nombre', this.nuevaPrenda.nombre);
    formData.append('descripcion', this.nuevaPrenda.descripcion);
    formData.append('precio_base', this.nuevaPrenda.precio_base.toString());
    formData.append('categoria_id', this.nuevaPrenda.categoria_id.toString());
    formData.append('proveedor_id', this.nuevaPrenda.proveedor_id.toString());
    formData.append('imagen', this.imagenSeleccionada);

    // Enviamos el FormData al backend
    this.http.post('http://localhost:8000/api/catalogo/', formData).subscribe({
      next: (respuesta: any) => {
        alert('¡Prenda registrada con éxito!');
        // Aquí podríamos limpiar el formulario
      },
      error: (error) => {
        console.error("Error completo:", error);
        alert('Ocurrió un error al guardar la prenda.');
      }
    });
  }
}