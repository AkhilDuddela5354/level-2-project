import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TurbineService } from '../services/turbine.service';

interface Turbine {
  turbineId: string;
  turbineName: string;
  farmId: string;
  farmName: string;
  region: string;
  capacity: number;
  status: string;
  latitude: number;
  longitude: number;
  installationDate: string;
  lastMaintenanceDate: string | null;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="app-container" *ngIf="isLoggedIn">
      <!-- Header -->
      <header class="main-header">
        <div class="header-content">
          <div class="logo-section">
            <h1>🌬️ Wind Turbine Health Monitoring</h1>
            <p class="subtitle">Real-Time Monitoring System</p>
          </div>
          <div class="user-section">
            <div class="user-info">
              <span class="username">👤 {{username}}</span>
              <span class="role-badge" [class]="'role-' + userRole.toLowerCase()">{{userRole}}</span>
            </div>
            <button class="logout-btn" (click)="logout()">Logout</button>
          </div>
        </div>
      </header>

      <!-- Stats Bar -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-label">Total Turbines</span>
          <span class="stat-value">{{turbines.length}}</span>
        </div>
        <div class="stat-item active">
          <span class="stat-label">Active</span>
          <span class="stat-value">{{getStatusCount('ACTIVE')}}</span>
        </div>
        <div class="stat-item maintenance">
          <span class="stat-label">Maintenance</span>
          <span class="stat-value">{{getStatusCount('MAINTENANCE')}}</span>
        </div>
        <div class="stat-item offline">
          <span class="stat-label">Offline</span>
          <span class="stat-value">{{getStatusCount('OFFLINE')}}</span>
        </div>
      </div>

      <!-- Add Turbine Button (Admin Only) -->
      <div class="toolbar" *ngIf="userRole === 'ADMIN'">
        <button class="btn-add" (click)="showAddModal()">➕ Add New Turbine</button>
      </div>

      <!-- Turbines Grid -->
      <div class="turbine-grid">
        <div *ngFor="let turbine of turbines" class="turbine-card" [class.status-active]="turbine.status === 'ACTIVE'" 
             [class.status-maintenance]="turbine.status === 'MAINTENANCE'"
             [class.status-offline]="turbine.status === 'OFFLINE'">
          <div class="turbine-header">
            <h3>{{turbine.turbineName}}</h3>
            <span class="status-badge" [class]="'badge-' + turbine.status.toLowerCase()">{{turbine.status}}</span>
          </div>
          <div class="turbine-details">
            <div class="detail-row">
              <span class="label">Farm:</span>
              <span class="value">{{turbine.farmName}}</span>
            </div>
            <div class="detail-row">
              <span class="label">Region:</span>
              <span class="value">{{turbine.region}}</span>
            </div>
            <div class="detail-row">
              <span class="label">Capacity:</span>
              <span class="value">{{turbine.capacity}} kW</span>
            </div>
            <div class="detail-row">
              <span class="label">Location:</span>
              <span class="value">{{turbine.latitude}}, {{turbine.longitude}}</span>
            </div>
          </div>
          
          <!-- Admin Actions -->
          <div class="turbine-actions" *ngIf="userRole === 'ADMIN'">
            <button class="action-btn edit-btn" (click)="editTurbine(turbine)">✏️ Edit</button>
            <button class="action-btn delete-btn" (click)="deleteTurbine(turbine)">🗑️ Delete</button>
          </div>

          <!-- User Info Message -->
          <div class="user-notice" *ngIf="userRole === 'USER'">
            ℹ️ View-only access
          </div>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div class="modal" *ngIf="showModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{editMode ? 'Edit Turbine' : 'Add New Turbine'}}</h2>
            <button class="close-btn" (click)="closeModal($event)">×</button>
          </div>
          <form (ngSubmit)="saveTurbine()" class="turbine-form">
            <div class="form-group">
              <label>Turbine Name *</label>
              <input type="text" [(ngModel)]="formData.turbineName" name="turbineName" required class="form-control">
            </div>
            <div class="form-group">
              <label>Farm Name *</label>
              <input type="text" [(ngModel)]="formData.farmName" name="farmName" required class="form-control">
            </div>
            <div class="form-group">
              <label>Farm ID *</label>
              <input type="text" [(ngModel)]="formData.farmId" name="farmId" required class="form-control">
            </div>
            <div class="form-group">
              <label>Region *</label>
              <select [(ngModel)]="formData.region" name="region" required class="form-control">
                <option value="North">North</option>
                <option value="South">South</option>
                <option value="East">East</option>
                <option value="West">West</option>
                <option value="Central">Central</option>
              </select>
            </div>
            <div class="form-group">
              <label>Capacity (kW) *</label>
              <input type="number" [(ngModel)]="formData.capacity" name="capacity" required class="form-control">
            </div>
            <div class="form-group">
              <label>Status *</label>
              <select [(ngModel)]="formData.status" name="status" required class="form-control">
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Latitude *</label>
                <input type="number" step="0.000001" [(ngModel)]="formData.latitude" name="latitude" required class="form-control">
              </div>
              <div class="form-group">
                <label>Longitude *</label>
                <input type="number" step="0.000001" [(ngModel)]="formData.longitude" name="longitude" required class="form-control">
              </div>
            </div>
            <div *ngIf="modalError" class="error-message">❌ {{modalError}}</div>
            <div class="modal-actions">
              <button type="button" class="btn-cancel" (click)="closeModal($event)">Cancel</button>
              <button type="submit" class="btn-save" [disabled]="modalLoading">
                {{modalLoading ? 'Saving...' : 'Save Turbine'}}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Not Logged In -->
    <div class="login-prompt" *ngIf="!isLoggedIn">
      <div class="prompt-card">
        <h2>🔒 Authentication Required</h2>
        <p>Please log in to access the Wind Turbine Monitoring System</p>
        <button class="btn-login" (click)="goToLogin()">Go to Login</button>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #f5f5f5;
      padding: 0;
    }

    .main-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1400px;
      margin: 0 auto;
    }

    .logo-section h1 {
      margin: 0 0 4px 0;
      font-size: 1.8em;
    }

    .subtitle {
      margin: 0;
      opacity: 0.9;
      font-size: 0.9em;
    }

    .user-section {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .username {
      font-weight: 500;
    }

    .role-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75em;
      font-weight: 600;
    }

    .role-admin {
      background: #ffd700;
      color: #333;
    }

    .role-user {
      background: rgba(255,255,255,0.2);
      color: white;
    }

    .logout-btn {
      padding: 10px 20px;
      background: rgba(255,255,255,0.2);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .logout-btn:hover {
      background: rgba(255,255,255,0.3);
    }

    .stats-bar {
      background: white;
      padding: 20px 24px;
      display: flex;
      gap: 40px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-label {
      font-size: 0.85em;
      color: #666;
    }

    .stat-value {
      font-size: 1.8em;
      font-weight: bold;
      color: #333;
    }

    .stat-item.active .stat-value { color: #4CAF50; }
    .stat-item.maintenance .stat-value { color: #FF9800; }
    .stat-item.offline .stat-value { color: #F44336; }

    .toolbar {
      max-width: 1400px;
      margin: 20px auto;
      padding: 0 24px;
    }

    .btn-add {
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1em;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-add:hover {
      background: #5568d3;
    }

    .turbine-grid {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .turbine-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .turbine-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
    }

    .turbine-card.status-active { border-left: 4px solid #4CAF50; }
    .turbine-card.status-maintenance { border-left: 4px solid #FF9800; }
    .turbine-card.status-offline { border-left: 4px solid #F44336; }

    .turbine-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #eee;
    }

    .turbine-header h3 {
      margin: 0;
      color: #333;
      font-size: 1.2em;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.75em;
      font-weight: 600;
    }

    .badge-active { background: #e8f5e9; color: #2e7d32; }
    .badge-maintenance { background: #fff3e0; color: #ef6c00; }
    .badge-offline { background: #ffebee; color: #c62828; }

    .turbine-details {
      margin-bottom: 16px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 0.9em;
    }

    .detail-row .label {
      color: #666;
      font-weight: 500;
    }

    .detail-row .value {
      color: #333;
    }

    .turbine-actions {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      flex: 1;
      padding: 8px;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.85em;
      cursor: pointer;
      transition: background 0.2s;
    }

    .edit-btn {
      background: #2196F3;
    }

    .edit-btn:hover {
      background: #1976D2;
    }

    .delete-btn {
      background: #F44336;
    }

    .delete-btn:hover {
      background: #D32F2F;
    }

    .user-notice {
      padding: 8px;
      background: #f5f5f5;
      color: #666;
      text-align: center;
      border-radius: 6px;
      font-size: 0.85em;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 2em;
      color: #999;
      cursor: pointer;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .turbine-form {
      padding: 24px;
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
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95em;
    }

    .form-control:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }

    .modal-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .btn-cancel,
    .btn-save {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      font-size: 0.95em;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-cancel {
      background: #f5f5f5;
      color: #333;
    }

    .btn-cancel:hover {
      background: #e0e0e0;
    }

    .btn-save {
      background: #667eea;
      color: white;
    }

    .btn-save:hover:not(:disabled) {
      background: #5568d3;
    }

    .btn-save:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .login-prompt {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .prompt-card {
      background: white;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }

    .prompt-card h2 {
      color: #333;
      margin-bottom: 16px;
    }

    .prompt-card p {
      color: #666;
      margin-bottom: 24px;
    }

    .btn-login {
      padding: 12px 32px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 1em;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-login:hover {
      background: #5568d3;
    }
  `]
})
export class DashboardComponent implements OnInit {
  isLoggedIn = false;
  username = '';
  userRole = '';
  turbines: Turbine[] = [];
  showModal = false;
  editMode = false;
  modalError = '';
  modalLoading = false;
  
  formData: any = {
    turbineName: '',
    farmName: '',
    farmId: '',
    region: 'North',
    capacity: 0,
    status: 'ACTIVE',
    latitude: 0,
    longitude: 0
  };

  constructor(
    private authService: AuthService,
    private turbineService: TurbineService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkAuth();
  }

  checkAuth() {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      this.username = this.authService.getUsername();
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          this.userRole = user.role;
          this.loadTurbines();
        },
        error: (err) => {
          console.error('Failed to get user info:', err);
          this.authService.logout().subscribe(() => {
            window.location.href = '/login';
          });
        }
      });
    }
  }

  loadTurbines() {
    this.turbineService.getAllTurbines().subscribe({
      next: (data) => {
        this.turbines = data;
      },
      error: (err) => {
        console.error('Failed to load turbines:', err);
      }
    });
  }

  getStatusCount(status: string): number {
    return this.turbines.filter(t => t.status === status).length;
  }

  showAddModal() {
    if (this.userRole !== 'ADMIN') {
      alert('❌ Access Denied: Only administrators can add turbines');
      return;
    }
    this.editMode = false;
    this.formData = {
      turbineName: '',
      farmName: '',
      farmId: '',
      region: 'North',
      capacity: 0,
      status: 'ACTIVE',
      latitude: 0,
      longitude: 0
    };
    this.modalError = '';
    this.showModal = true;
  }

  editTurbine(turbine: Turbine) {
    if (this.userRole !== 'ADMIN') {
      alert('❌ Access Denied: Only administrators can edit turbines');
      return;
    }
    this.editMode = true;
    this.formData = { ...turbine };
    this.modalError = '';
    this.showModal = true;
  }

  deleteTurbine(turbine: Turbine) {
    if (this.userRole !== 'ADMIN') {
      alert('❌ Access Denied: Only administrators can delete turbines');
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${turbine.turbineName}?`)) {
      this.turbineService.deleteTurbine(turbine.turbineId).subscribe({
        next: () => {
          alert('✅ Turbine deleted successfully');
          this.loadTurbines();
        },
        error: (err) => {
          console.error('Delete failed:', err);
          if (err.status === 403 || err.status === 401) {
            alert('❌ Access Denied: Insufficient permissions');
          } else {
            alert('❌ Failed to delete turbine');
          }
        }
      });
    }
  }

  saveTurbine() {
    if (this.userRole !== 'ADMIN') {
      this.modalError = 'Access Denied: Only administrators can save turbines';
      return;
    }

    this.modalLoading = true;
    this.modalError = '';

    const operation = this.editMode
      ? this.turbineService.updateTurbine(this.formData.turbineId, this.formData)
      : this.turbineService.createTurbine(this.formData);

    operation.subscribe({
      next: () => {
        this.modalLoading = false;
        this.showModal = false;
        alert(`✅ Turbine ${this.editMode ? 'updated' : 'created'} successfully`);
        this.loadTurbines();
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.modalLoading = false;
        if (err.status === 403 || err.status === 401) {
          this.modalError = 'Access Denied: Insufficient permissions';
        } else {
          this.modalError = err.error?.message || 'Failed to save turbine';
        }
      }
    });
  }

  closeModal(event: Event) {
    event.preventDefault();
    this.showModal = false;
  }

  logout() {
    this.authService.logout().subscribe({
      complete: () => {
        window.location.href = '/login';
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
