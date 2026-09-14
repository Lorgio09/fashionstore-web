import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

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

  isEditMode = false;
  prendaId: string | null = null;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  // Esto se ejecuta automáticamente apenas abres la pantalla
  ngOnInit() {
    this.cargarCategorias();
    this.cargarProveedores();
    this.prendaId = this.route.snapshot.paramMap.get('id');
    if (this.prendaId) {
      this.isEditMode = true;
      this.cargarDatosPrenda(this.prendaId);
    }
  }

  cargarCategorias() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/categorias').subscribe({
      next: (data: any) => this.categorias = data,
      error: (err) => console.error("Error al cargar categorías", err)
    });
  }

  cargarProveedores() {
    this.http.get('https://fashionstore-api-kedu.onrender.com/api/catalogo/proveedores').subscribe({
      next: (data: any) => this.proveedores = data,
      error: (err) => console.error("Error al cargar proveedores", err)
    });
  }

  cargarDatosPrenda(id: string) {
    this.http.get(`https://fashionstore-api-kedu.onrender.com/api/catalogo/${id}`).subscribe({
      next: (data: any) => {
        this.nuevaPrenda = {
          nombre: data.nombre,
          descripcion: data.descripcion,
          precio_base: data.precio_base,
          categoria_id: data.categoria_id,
          proveedor_id: data.proveedor_id
        };
        // Mostramos la imagen actual
        if (data.imagen_url) {
          this.imagenPreview = data.imagen_url;
        }
      },
      error: (err) => alert("Error al cargar los datos de la prenda")
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
    if (!this.nuevaPrenda.categoria_id || !this.nuevaPrenda.proveedor_id) {
      alert("Por favor, selecciona una categoría y un proveedor.");
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.nuevaPrenda.nombre);
    formData.append('descripcion', this.nuevaPrenda.descripcion);
    formData.append('precio_base', String(this.nuevaPrenda.precio_base));
    formData.append('categoria_id', String(this.nuevaPrenda.categoria_id));
    formData.append('proveedor_id', String(this.nuevaPrenda.proveedor_id));
    
    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
    }

    if (this.isEditMode) {
      // MODO EDICIÓN (PUT)
      this.http.put(`https://fashionstore-api-kedu.onrender.com/api/catalogo/${this.prendaId}`, formData).subscribe({
        next: () => {
          alert('¡Prenda actualizada con éxito!');
          this.router.navigate(['/admin/prendas']); 
        },
        error: (err) => alert('Error al actualizar la prenda.')
      });
    } else {
      // MODO CREACIÓN (POST)
      // Validamos imagen obligatoria solo al crear
      if (!this.imagenSeleccionada) {
        alert("Selecciona una foto para la nueva prenda.");
        return;
      }
      this.http.post('https://fashionstore-api-kedu.onrender.com/api/catalogo/', formData).subscribe({
        next: () => {
          alert('¡Prenda registrada con éxito!');
          this.router.navigate(['/admin/prendas']); // Volvemos a la tabla
        },
        error: (err) => alert('Error al guardar la prenda.')
      });
    }
  }
}