import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>🌬️ Wind Turbine Monitoring</h2>
          <p>Sign in to your account</p>
        </div>

        <form (ngSubmit)="login()" class="auth-form">
          <div class="form-group">
            <label>Username</label>
            <input 
              type="text" 
              [(ngModel)]="username" 
              name="username"
              placeholder="Enter username"
              required
              class="form-control">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              placeholder="Enter password"
              required
              class="form-control">
          </div>

          <div *ngIf="error" class="error-message">
            ❌ {{error}}
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{loading ? 'Signing in...' : 'Sign In'}}
          </button>
        </form>

        <div class="auth-footer">
          <p>Don't have an account? <a (click)="goToSignup()">Sign Up</a></p>
        </div>

        <div class="demo-accounts">
          <h4>Demo Accounts:</h4>
          <p><strong>Admin:</strong> admin / admin123</p>
          <p><strong>User:</strong> user / user123</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }

    .auth-card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      padding: 40px;
      max-width: 450px;
      width: 100%;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 30px;
    }

    .auth-header h2 {
      color: #333;
      margin-bottom: 8px;
      font-size: 1.8em;
    }

    .auth-header p {
      color: #666;
      font-size: 0.95em;
    }

    .auth-form {
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #333;
      font-weight: 500;
    }

    .form-control {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95em;
      transition: border-color 0.2s;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .btn-primary {
      width: 100%;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1em;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5568d3;
    }

    .btn-primary:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 0.9em;
    }

    .auth-footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #eee;
    }

    .auth-footer a {
      color: #667eea;
      cursor: pointer;
      text-decoration: none;
      font-weight: 500;
    }

    .auth-footer a:hover {
      text-decoration: underline;
    }

    .demo-accounts {
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 6px;
      font-size: 0.85em;
    }

    .demo-accounts h4 {
      margin-bottom: 8px;
      color: #666;
    }

    .demo-accounts p {
      margin: 4px 0;
      color: #555;
    }
  `]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  login() {
    this.error = '';
    this.loading = true;

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        console.log('Login successful:', response);
        this.loading = false;
        window.location.href = '/'; // Reload to update UI
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.error = err.error?.message || 'Invalid username or password';
        this.loading = false;
      }
    });
  }

  goToSignup() {
    this.router.navigate(['/signup']);
  }
}
