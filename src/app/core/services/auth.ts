import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // Extrae el usuario decodificando el JWT (igual que en tu login)
  getUsuarioActual() {
    if (typeof localStorage !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Decodificamos el payload para obtener { sub, rol, nombre }
          const payload = JSON.parse(atob(token.split('.')[1]));
          return payload;
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  }
  tieneRol(rolEsperado: number): boolean {
    const user = this.getUsuarioActual();
    // Validamos que el usuario exista y su rol coincida con el número esperado
    return user && user.rol === rolEsperado;
  }
}