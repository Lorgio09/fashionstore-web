import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  
  // Extrae el usuario actual de la memoria del navegador
  getUsuarioActual() {
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem('usuario_actual');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Verifica si el usuario activo tiene un rol específico
  tieneRol(rolEsperado: string): boolean {
    const user = this.getUsuarioActual();
    return user && user.rol === rolEsperado;
  }
}