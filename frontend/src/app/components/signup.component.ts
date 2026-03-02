import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-header">
          <h2>🌬️ Create Account</h2>
          <p>Join Wind Turbine Monitoring System</p>
        </div>

        <form (ngSubmit)="signup()" class="auth-form">
          <div class="form-group">
            <label>Full Name</label>
            <input 
              type="text" 
              [(ngModel)]="fullName" 
              name="fullName"
              placeholder="Enter your full name"
              required
              class="form-control">
          </div>

          <div class="form-group">
            <label>Email</label>
            <input 
              type="email" 
              [(ngModel)]="email" 
              name="email"
              placeholder="Enter your email"
              required
              class="form-control">
          </div>

          <div class="form-group">
            <label>Username</label>
            <input 
              type="text" 
              [(ngModel)]="username" 
              name="username"
              placeholder="Choose a username"
              required
              class="form-control">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input 
              type="password" 
              [(ngModel)]="password" 
              name="password"
              placeholder="Choose a password"
              required
              class="form-control">
          </div>

          <div class="form-group">
            <label>Role</label>
            <select [(ngModel)]="role" name="role" class="form-control">
              <option value="USER">User (View Only)</option>
              <option value="ADMIN">Admin (Full Access)</option>
            </select>
            <small class="help-text">
              ℹ️ Users can only view data. Admins can add/edit/delete turbines.
            </small>
          </div>

          <div *ngIf="error" class="error-message">
            ❌ {{error}}
          </div>

          <div *ngIf="success" class="success-message">
            ✅ {{success}}
          </div>

          <button type="submit" class="btn-primary" [disabled]="loading">
            {{loading ? 'Creating Account...' : 'Sign Up'}}
          </button>
        </form>

        <div class="auth-footer">
          <p>Already have an account? <a (click)="goToLogin()">Sign In</a></p>
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

    select.form-control {
      cursor: pointer;
    }

    .help-text {
      display: block;
      margin-top: 6px;
      color: #666;
      font-size: 0.85em;
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

    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
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
  `]
})
export class SignupComponent {
  fullName = '';
  email = '';
  username = '';
  password = '';
  role = 'USER';
  error = '';
  success = '';
  loading = false;

  constructor(private authService: AuthService, private router: Router) {}

  signup() {
    this.error = '';
    this.success = '';
    this.loading = true;

    this.authService.signup(this.username, this.password, this.email, this.fullName, this.role).subscribe({
      next: (response) => {
        console.log('Signup successful:', response);
        this.success = 'Account created successfully! Redirecting...';
        this.loading = false;
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      },
      error: (err) => {
        console.error('Signup failed:', err);
        this.error = err.error?.message || 'Failed to create account';
        this.loading = false;
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
