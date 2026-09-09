import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-admin-layout',
  styleUrl: './admin-layout.scss',
  templateUrl: './admin-layout.html',
})
export class AdminLayoutComponent {}
