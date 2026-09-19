import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DetalleReservaCreate {
  variante_id: number;
  cantidad: number;
}

export interface ReservaCreate {
  fecha_visita: string; 
  cliente_id: number;
  sucursal_id: number;
  detalles: DetalleReservaCreate[];
}

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private http = inject(HttpClient);
  private API_URL = 'https://fashionstore-api-kedu.onrender.com/api/reservas';

  crearReserva(reserva: ReservaCreate): Observable<any> {
    return this.http.post(this.API_URL, reserva);
  }

  obtenerReservasSucursal(sucursalId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/sucursal/${sucursalId}`);
  }

  obtenerReservasCliente(clienteId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.API_URL}/cliente/${clienteId}`);
  }

  actualizarEstado(reservaId: number, estado: string): Observable<any> {
    return this.http.put(`${this.API_URL}/${reservaId}/estado?nuevo_estado=${estado}`, {});
  }
}