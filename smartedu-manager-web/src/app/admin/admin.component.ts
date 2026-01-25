import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

export interface UserData {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  status: string;
}

const ELEMENT_DATA: UserData[] = [
  { id: 1, fullName: 'John Doe', username: 'johndoe', email: 'john@example.com', role: 'Admin', status: 'Active' },
  { id: 2, fullName: 'Jane Smith', username: 'janesmith', email: 'jane@example.com', role: 'Teacher', status: 'Active' },
  { id: 3, fullName: 'Bob Johnson', username: 'bjohnson', email: 'bob@example.com', role: 'Student', status: 'Inactive' },
  { id: 4, fullName: 'Alice Williams', username: 'awilliams', email: 'alice@example.com', role: 'Admin', status: 'Active' },
];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatCardModule,
    MatGridListModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent {
  userFullName = this.authService.userFullName;
  userRole = this.authService.userRole;

  displayedColumns: string[] = ['id', 'fullName', 'username', 'email', 'role', 'status', 'actions'];
  dataSource = ELEMENT_DATA;

  constructor(private authService: AuthService, private router: Router) {}

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}