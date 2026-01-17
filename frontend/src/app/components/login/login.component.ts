import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  username = '';
  password = '';
  isLoginMode = true;
  loading = false;
  message = '';
  error = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.username || !this.password) {
      return;
    }

    this.loading = true;
    this.message = '';

    const authObservable = this.isLoginMode 
      ? this.authService.login(this.username, this.password)
      : this.authService.register(this.username, this.password);

    authObservable.subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.authService.setCurrentUser(response.user);
          this.router.navigate(['/lobby']);
        } else {
          this.error = true;
          this.message = response.message || 'Une erreur est survenue';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = true;
        this.message = err.error?.message || 'Erreur de connexion au serveur';
      }
    });
  }
}