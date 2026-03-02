import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewChecked,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  computed,
  signal,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TurbineService, Turbine } from '../services/turbine.service';
import { AuthService } from '../services/auth.service';
import { Subject, interval, of } from 'rxjs';
import { takeUntil, switchMap, catchError, startWith } from 'rxjs/operators';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type DashboardView =
  | 'dashboard'
  | 'livefeed'
  | 'turbines'
  | 'analytics'
  | 'farms'
  | 'alerts'
  | 'reports';

export interface Alert {
  id: string;
  turbineId: string;
  turbineName: string;
  farmName: string;
  region: string;
  severity: AlertSeverity;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface FarmMetrics {
  farmId: string;
  farmName: string;
  region: string;
  totalTurbines: number;
  activeCount: number;
  maintenanceCount: number;
  offlineCount: number;
  totalCapacity: number;
  avgEfficiency: number;
  dailyGeneration: number;
  anomalyCount: number;
}

export interface LiveEvent {
  id: string;
  type: 'status' | 'alert' | 'metric' | 'maintenance';
  message: string;
  turbineName?: string;
  farmName?: string;
  value?: string;
  timestamp: Date;
  severity?: AlertSeverity;
}

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-layout">
      <!-- Fixed Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo-container">
            <span class="logo-icon">⚡</span>
            <h2>Wind Turbine Monitoring</h2>
          </div>
          <div class="user-info">
            <span class="user-avatar">{{ username().charAt(0).toUpperCase() }}</span>
            <div class="user-details">
              <span class="user-name">{{ username() }}</span>
              <span class="user-role">{{ role() }}</span>
            </div>
          </div>
          <button class="btn-logout" (click)="logout()">
            <span class="btn-icon">⎋</span> Logout
          </button>
        </div>

        <nav class="nav-tabs">
          <button
            *ngFor="let v of views"
            [class.active]="activeView() === v.id"
            (click)="setView(v.id)"
            class="nav-tab">
            <span class="tab-icon">{{ v.icon }}</span>
            <span class="tab-label">{{ v.label }}</span>
          </button>
        </nav>

        <div class="filters-section">
          <h3>Filters</h3>
          <div class="filter-group">
            <label>Region</label>
            <select [(ngModel)]="filterRegion" (ngModelChange)="applyFilters()">
              <option value="">All Regions</option>
              <option *ngFor="let r of regions()" [value]="r">{{ r }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Farm</label>
            <select [(ngModel)]="filterFarm" (ngModelChange)="applyFilters()">
              <option value="">All Farms</option>
              <option *ngFor="let f of farms()" [value]="f">{{ f }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Status</label>
            <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()">
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
        </div>

        <div class="refresh-info">
          <span>Auto-refresh: 30s</span>
          <span class="last-refresh">Last: {{ lastRefresh() }}</span>
          <button class="btn-refresh-mini" (click)="refreshData()" title="Refresh (Ctrl+R)">
            ↻
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <header class="content-header">
          <h1>{{ getViewTitle() }}</h1>
          <div class="header-actions">
            <button class="btn-icon-action" (click)="refreshData()" [disabled]="loading()" title="Refresh (Ctrl+R)">
              <span class="action-icon">{{ loading() ? '⏳' : '↻' }}</span>
              Refresh
            </button>
            <button class="btn-icon-action" (click)="exportData()" title="Export">
              <span class="action-icon">↓</span> Export
            </button>
          </div>
        </header>

        <!-- Dashboard View -->
        <div *ngIf="activeView() === 'dashboard'" class="view-content view-dashboard">
          <div class="kpi-grid">
            <div *ngFor="let kpi of kpiCards()" class="kpi-card" (mouseenter)="kpiHover.set(kpi.id)" (mouseleave)="kpiHover.set(null)">
              <div class="kpi-icon-wrap" [style.background]="kpi.gradient">
                <span class="kpi-icon">{{ kpi.icon }}</span>
              </div>
              <div class="kpi-body">
                <span class="kpi-value" [class]="kpi.valueClass">{{ kpi.value }}</span>
                <span class="kpi-label">{{ kpi.label }}</span>
                <div class="kpi-trend" *ngIf="kpi.trend">
                  <span [class.up]="kpi.trend > 0" [class.down]="kpi.trend < 0">
                    {{ kpi.trend > 0 ? '↑' : '↓' }} {{ Math.abs(kpi.trend) }}%
                  </span>
                </div>
                <div class="kpi-sparkline" *ngIf="kpi.sparkline?.length">
                  <svg viewBox="0 0 100 24" preserveAspectRatio="none">
                    <polyline [attr.points]="kpi.sparkline" fill="none" stroke="currentColor" stroke-width="1.5"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div class="overview-grid">
            <div class="card summary-card">
              <h3>Farm Overview</h3>
              <div class="farm-summary-list">
                <div *ngFor="let fm of farmMetrics()" class="farm-summary-item">
                  <div class="farm-name">{{ fm.farmName }}</div>
                  <div class="farm-stats">
                    <span class="stat">{{ fm.activeCount }}/{{ fm.totalTurbines }} active</span>
                    <span class="stat">{{ fm.avgEfficiency }}% eff</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="card alerts-preview-card">
              <h3>Recent Alerts</h3>
              <div class="alerts-preview-list">
                <div *ngFor="let a of alerts().slice(0, 5)" class="alert-item" [class]="a.severity.toLowerCase()">
                  <span class="alert-severity">{{ a.severity }}</span>
                  <span class="alert-msg">{{ a.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Live Feed View -->
        <div *ngIf="activeView() === 'livefeed'" class="view-content view-livefeed">
          <div class="livefeed-toolbar">
            <input type="text" class="search-input" placeholder="Search events..." [(ngModel)]="liveFeedSearch" (ngModelChange)="filterLiveEvents()"/>
            <button class="btn-toggle" (click)="autoScroll.set(!autoScroll())">
              {{ autoScroll() ? '⏸ Pause' : '▶ Resume' }} Auto-scroll
            </button>
          </div>
          <div class="livefeed-container" #liveFeedContainer (scroll)="onLiveFeedScroll()">
            <div *ngFor="let e of filteredLiveEvents()" class="live-event" [class]="'type-' + e.type">
              <span class="event-time">{{ e.timestamp | date:'short' }}</span>
              <span class="event-icon">{{ getEventIcon(e.type) }}</span>
              <div class="event-content">
                <span class="event-message">{{ e.message }}</span>
                <span class="event-meta" *ngIf="e.turbineName">{{ e.turbineName }} · {{ e.farmName }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Turbines View -->
        <div *ngIf="activeView() === 'turbines'" class="view-content view-turbines">
          <div class="turbines-toolbar">
            <input type="text" class="search-input" placeholder="Search turbines..." [(ngModel)]="turbineSearch" (ngModelChange)="applyTurbineFilters()"/>
            <select class="sort-select" [(ngModel)]="turbineSortBy" (ngModelChange)="applyTurbineFilters()">
              <option value="name">Name</option>
              <option value="farm">Farm</option>
              <option value="capacity">Capacity</option>
              <option value="status">Status</option>
            </select>
            <button *ngIf="isAdmin()" class="btn-primary" (click)="openCreateModal()">+ Add Turbine</button>
          </div>
          <div class="turbines-grid">
            <div *ngFor="let t of paginatedTurbines()" class="turbine-card" [class]="'status-' + t.status.toLowerCase()">
              <div class="turbine-header">
                <span class="turbine-name">{{ t.turbineName }}</span>
                <span class="turbine-status">{{ t.status }}</span>
              </div>
              <div class="turbine-details">
                <div><strong>Farm:</strong> {{ t.farmName }}</div>
                <div><strong>Region:</strong> {{ t.region }}</div>
                <div><strong>Capacity:</strong> {{ t.capacity }} MW</div>
              </div>
              <div class="turbine-actions" *ngIf="isAdmin()">
                <button class="btn-sm btn-edit" (click)="openEditModal(t)">Edit</button>
                <button class="btn-sm btn-delete" (click)="confirmDeleteTurbine(t)">Delete</button>
              </div>
            </div>
          </div>
          <div class="pagination" *ngIf="totalTurbinePages() > 1">
            <button [disabled]="turbinePage() <= 1" (click)="setTurbinePage(turbinePage() - 1)">← Prev</button>
            <span>Page {{ turbinePage() }} of {{ totalTurbinePages() }}</span>
            <button [disabled]="turbinePage() >= totalTurbinePages()" (click)="setTurbinePage(turbinePage() + 1)">Next →</button>
          </div>
        </div>

        <!-- Analytics View -->
        <div *ngIf="activeView() === 'analytics'" class="view-content view-analytics">
          <div class="analytics-toolbar">
            <div class="time-range">
              <button *ngFor="let tr of timeRanges" [class.active]="analyticsTimeRange() === tr.id" (click)="setAnalyticsTimeRange(tr.id)">
                {{ tr.label }}
              </button>
            </div>
            <button class="btn-secondary" (click)="exportChartData()">Export Chart Data</button>
          </div>
          <div class="charts-grid">
            <div class="chart-card">
              <h3>Power Generation Trend</h3>
              <div class="chart-wrapper">
                <canvas #lineChart></canvas>
              </div>
            </div>
            <div class="chart-card">
              <h3>Farm Performance Comparison</h3>
              <div class="chart-wrapper">
                <canvas #barChart></canvas>
              </div>
            </div>
            <div class="chart-card">
              <h3>Status Distribution</h3>
              <div class="chart-wrapper">
                <canvas #pieChart></canvas>
              </div>
            </div>
            <div class="chart-card">
              <h3>Regional Capacity</h3>
              <div class="chart-wrapper">
                <canvas #donutChart></canvas>
              </div>
            </div>
            <div class="chart-card gauge-card">
              <h3>Real-time Efficiency Gauge</h3>
              <div class="chart-wrapper">
                <canvas #gaugeChart></canvas>
              </div>
            </div>
          </div>
        </div>

        <!-- Farms View -->
        <div *ngIf="activeView() === 'farms'" class="view-content view-farms">
          <div class="farms-toolbar">
            <input type="text" class="search-input" placeholder="Search farms..." [(ngModel)]="farmSearch" (ngModelChange)="applyFarmFilters()"/>
          </div>
          <div class="farms-grid">
            <div *ngFor="let fm of filteredFarmMetrics()" class="farm-card">
              <h3>{{ fm.farmName }}</h3>
              <div class="farm-region">{{ fm.region }}</div>
              <div class="farm-metrics">
                <div class="metric-row"><span>Turbines</span><span>{{ fm.activeCount }}/{{ fm.totalTurbines }}</span></div>
                <div class="metric-row"><span>Capacity</span><span>{{ fm.totalCapacity }} MW</span></div>
                <div class="metric-row"><span>Daily Gen</span><span>{{ fm.dailyGeneration }} MWh</span></div>
                <div class="efficiency-gauge">
                  <div class="gauge-label">Efficiency</div>
                  <div class="gauge-bar"><div class="gauge-fill" [style.width.%]="fm.avgEfficiency"></div></div>
                  <div class="gauge-value">{{ fm.avgEfficiency }}%</div>
                </div>
                <div class="anomaly-badge" *ngIf="fm.anomalyCount > 0">{{ fm.anomalyCount }} anomaly(ies)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Alerts View -->
        <div *ngIf="activeView() === 'alerts'" class="view-content view-alerts">
          <div class="alerts-toolbar">
            <input type="text" class="search-input" placeholder="Search alerts..." [(ngModel)]="alertSearch" (ngModelChange)="applyAlertFilters()"/>
            <select [(ngModel)]="alertSeverityFilter" (ngModelChange)="applyAlertFilters()">
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>
          <div class="alerts-list">
            <div *ngFor="let a of filteredAlerts()" class="alert-card" [class]="a.severity.toLowerCase()">
              <div class="alert-header">
                <span class="alert-severity-badge">{{ a.severity }}</span>
                <span class="alert-time">{{ a.timestamp | date:'short' }}</span>
              </div>
              <div class="alert-body">
                <div class="alert-turbine">{{ a.turbineName }} ({{ a.farmName }})</div>
                <div class="alert-message">{{ a.message }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Reports View (Future) -->
        <div *ngIf="activeView() === 'reports'" class="view-content view-reports">
          <div class="reports-placeholder">
            <span class="placeholder-icon">📋</span>
            <h3>Reports</h3>
            <p>Coming soon. Generate and export comprehensive reports.</p>
            <button class="btn-primary" (click)="showToast('info', 'Reports feature coming in next release')">Notify Me</button>
          </div>
        </div>
      </main>
    </div>

    <!-- Create/Edit Modal -->
    <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h2>{{ editingTurbine ? 'Edit Turbine' : 'Add Turbine' }}</h2>
        <form (ngSubmit)="saveTurbine()">
          <div class="form-group">
            <label>Turbine Name</label>
            <input [(ngModel)]="formTurbine.turbineName" name="turbineName" required>
          </div>
          <div class="form-group">
            <label>Farm ID</label>
            <input [(ngModel)]="formTurbine.farmId" name="farmId" required>
          </div>
          <div class="form-group">
            <label>Farm Name</label>
            <input [(ngModel)]="formTurbine.farmName" name="farmName" required>
          </div>
          <div class="form-group">
            <label>Region</label>
            <input [(ngModel)]="formTurbine.region" name="region" required>
          </div>
          <div class="form-group">
            <label>Capacity (MW)</label>
            <input type="number" [(ngModel)]="formTurbine.capacity" name="capacity" required step="0.1">
          </div>
          <div class="form-group">
            <label>Status</label>
            <select [(ngModel)]="formTurbine.status" name="status">
              <option value="ACTIVE">Active</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OFFLINE">Offline</option>
            </select>
          </div>
          <div class="form-group">
            <label>Latitude</label>
            <input type="number" [(ngModel)]="formTurbine.latitude" name="latitude" step="any">
          </div>
          <div class="form-group">
            <label>Longitude</label>
            <input type="number" [(ngModel)]="formTurbine.longitude" name="longitude" step="any">
          </div>
          <div class="modal-actions">
            <button type="button" class="btn-secondary" (click)="closeModal()">Cancel</button>
            <button type="submit" class="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Confirm Delete Dialog -->
    <div *ngIf="showConfirmDialog" class="modal-overlay" (click)="cancelDelete()">
      <div class="confirm-dialog" (click)="$event.stopPropagation()">
        <h3>Confirm Delete</h3>
        <p>Are you sure you want to delete <strong>{{ turbineToDelete?.turbineName }}</strong>? This action cannot be undone.</p>
        <div class="dialog-actions">
          <button class="btn-secondary" (click)="cancelDelete()">Cancel</button>
          <button class="btn-danger" (click)="executeDelete()">Delete</button>
        </div>
      </div>
    </div>

    <!-- Toast Container -->
    <div class="toast-container">
      <div *ngFor="let t of toasts()" class="toast" [class]="'toast-' + t.type">
        <span class="toast-icon">{{ getToastIcon(t.type) }}</span>
        <span class="toast-message">{{ t.message }}</span>
      </div>
    </div>
  `,
  styles: [
    `
    :host { display: block; }
    .dashboard-layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 280px; min-width: 280px; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
      color: #fff; padding: 24px; display: flex; flex-direction: column;
      box-shadow: 4px 0 24px rgba(0,0,0,0.15); position: sticky; top: 0; height: 100vh;
    }
    .sidebar-header { margin-bottom: 24px; }
    .logo-container { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .logo-icon { font-size: 28px; }
    .sidebar-header h2 { font-size: 1rem; font-weight: 600; margin: 0; letter-spacing: 0.02em; }
    .user-info { display: flex; align-items: center; gap: 12px; margin: 16px 0; padding: 12px; background: rgba(255,255,255,0.08); border-radius: 8px; }
    .user-avatar { width: 36px; height: 36px; background: linear-gradient(135deg, #0ea5e9, #06b6d4); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1rem; }
    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 500; font-size: 0.95rem; }
    .user-role { font-size: 0.8rem; opacity: 0.8; }
    .btn-logout {
      padding: 10px 16px; background: rgba(239,68,68,0.2); border: 1px solid rgba(239,68,68,0.4);
      color: #fca5a5; border-radius: 8px; cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;
      transition: all 0.2s ease;
    }
    .btn-logout:hover { background: rgba(239,68,68,0.3); }
    .btn-icon { font-size: 1rem; opacity: 0.9; }
    .nav-tabs { margin: 24px 0; display: flex; flex-direction: column; gap: 4px; }
    .nav-tab {
      display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 16px;
      background: transparent; border: none; color: rgba(255,255,255,0.85); text-align: left;
      border-radius: 8px; cursor: pointer; font-size: 0.95rem; transition: all 0.2s ease;
    }
    .nav-tab:hover { background: rgba(255,255,255,0.1); }
    .nav-tab.active { background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: #fff; box-shadow: 0 4px 12px rgba(14,165,233,0.3); }
    .tab-icon { font-size: 1.25rem; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .tab-label { flex: 1; }
    .filters-section { margin-top: auto; }
    .filters-section h3 { font-size: 0.9rem; margin-bottom: 12px; opacity: 0.9; }
    .filter-group { margin-bottom: 12px; }
    .filter-group label { display: block; font-size: 0.8rem; margin-bottom: 4px; opacity: 0.9; }
    .filter-group select {
      width: 100%; padding: 8px 12px; border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px; background: rgba(255,255,255,0.08); color: #fff; font-size: 0.9rem;
      cursor: pointer; transition: all 0.2s;
    }
    .filter-group select:hover {
      background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3);
    }
    .filter-group select:focus {
      outline: none; border-color: #0ea5e9; background: rgba(255,255,255,0.15);
      box-shadow: 0 0 0 3px rgba(14,165,233,0.2);
    }
    .filter-group select option {
      background: #1e293b; color: #fff; padding: 8px;
    }
    .filter-group select option:hover {
      background: #334155;
    }
    .refresh-info { font-size: 0.75rem; opacity: 0.7; margin-top: 16px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .last-refresh { flex: 1; }
    .btn-refresh-mini { background: rgba(255,255,255,0.1); border: none; color: #fff; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 1rem; }
    .btn-refresh-mini:hover { background: rgba(255,255,255,0.2); }
    .main-content { flex: 1; padding: 24px; background: linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%); overflow-y: auto; min-height: 100vh; }
    .content-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
    .content-header h1 { font-size: 1.5rem; color: #0f172a; margin: 0; font-weight: 700; }
    .header-actions { display: flex; gap: 8px; }
    .btn-icon-action {
      padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px;
      cursor: pointer; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;
      transition: all 0.2s ease; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .btn-icon-action:hover { background: #f8fafc; border-color: #0ea5e9; color: #0ea5e9; }
    .btn-icon-action:disabled { opacity: 0.6; cursor: not-allowed; }
    .action-icon { font-size: 1rem; }
    .view-content { animation: fadeIn 0.3s ease; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .kpi-card {
      background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      display: flex; gap: 16px; align-items: flex-start; transition: all 0.3s ease;
      border: 1px solid rgba(0,0,0,0.04);
    }
    .kpi-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .kpi-icon-wrap { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
    .kpi-icon { font-size: 1.5rem; }
    .kpi-body { flex: 1; min-width: 0; }
    .kpi-value { font-size: 1.5rem; font-weight: 700; color: #0f172a; }
    .kpi-value.active { color: #059669; }
    .kpi-value.maintenance { color: #d97706; }
    .kpi-value.offline { color: #dc2626; }
    .kpi-label { font-size: 0.85rem; color: #64748b; margin-top: 4px; display: block; }
    .kpi-trend { font-size: 0.8rem; margin-top: 4px; }
    .kpi-trend .up { color: #059669; }
    .kpi-trend .down { color: #dc2626; }
    .kpi-sparkline { height: 24px; margin-top: 8px; opacity: 0.7; }
    .kpi-sparkline svg { width: 100%; height: 100%; }
    .overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 900px) { .overview-grid { grid-template-columns: 1fr; } }
    .card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.04); }
    .card h3 { margin: 0 0 16px 0; font-size: 1rem; color: #334155; font-weight: 600; }
    .farm-summary-list { display: flex; flex-direction: column; gap: 12px; }
    .farm-summary-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .farm-summary-item:last-child { border-bottom: none; }
    .farm-name { font-weight: 500; }
    .farm-stats { font-size: 0.85rem; color: #64748b; }
    .farm-stats .stat { margin-left: 12px; }
    .alerts-preview-list { display: flex; flex-direction: column; gap: 8px; }
    .alert-item { padding: 8px 12px; border-radius: 8px; font-size: 0.9rem; }
    .alert-item.critical { background: #fef2f2; color: #b91c1c; border-left: 4px solid #dc2626; }
    .alert-item.warning { background: #fffbeb; color: #b45309; border-left: 4px solid #f59e0b; }
    .alert-item.info { background: #eff6ff; color: #1d4ed8; border-left: 4px solid #3b82f6; }
    .alert-severity { font-weight: 600; margin-right: 8px; }
    .livefeed-toolbar, .turbines-toolbar, .analytics-toolbar, .farms-toolbar, .alerts-toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap }
    .search-input { padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; min-width: 200px; }
    .search-input:focus { outline: none; border-color: #0ea5e9; box-shadow: 0 0 0 3px rgba(14,165,233,0.2); }
    .sort-select { padding: 10px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.95rem; }
    .btn-toggle { padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; }
    .btn-toggle:hover { background: #f8fafc; }
    .livefeed-container { max-height: 600px; overflow-y: auto; background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .live-event { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border-radius: 8px; margin-bottom: 8px; border-left: 4px solid #94a3b8; }
    .live-event.type-status { border-left-color: #0ea5e9; background: #f0f9ff; }
    .live-event.type-alert { border-left-color: #f59e0b; background: #fffbeb; }
    .live-event.type-metric { border-left-color: #059669; background: #f0fdf4; }
    .live-event.type-maintenance { border-left-color: #8b5cf6; background: #f5f3ff; }
    .event-time { font-size: 0.8rem; color: #64748b; flex-shrink: 0; }
    .event-icon { font-size: 1.25rem; flex-shrink: 0; }
    .event-content { flex: 1; }
    .event-message { display: block; font-weight: 500; }
    .event-meta { font-size: 0.85rem; color: #64748b; }
    .btn-primary { padding: 10px 20px; background: linear-gradient(135deg, #0ea5e9, #06b6d4); color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
    .btn-primary:hover { background: linear-gradient(135deg, #0284c7, #0891b2); box-shadow: 0 4px 12px rgba(14,165,233,0.3); }
    .btn-secondary { padding: 10px 20px; background: #e2e8f0; color: #475569; border: none; border-radius: 8px; cursor: pointer; }
    .btn-secondary:hover { background: #cbd5e1; }
    .turbines-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .turbine-card {
      background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      border-left: 4px solid #94a3b8; transition: all 0.2s ease;
    }
    .turbine-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .turbine-card.status-active { border-left-color: #059669; }
    .turbine-card.status-maintenance { border-left-color: #d97706; }
    .turbine-card.status-offline { border-left-color: #dc2626; }
    .turbine-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .turbine-name { font-weight: 600; color: #1e293b; }
    .turbine-status { font-size: 0.8rem; padding: 4px 8px; border-radius: 6px; font-weight: 500; }
    .turbine-card.status-active .turbine-status { background: #d1fae5; color: #059669; }
    .turbine-card.status-maintenance .turbine-status { background: #fef3c7; color: #d97706; }
    .turbine-card.status-offline .turbine-status { background: #fee2e2; color: #dc2626; }
    .turbine-details { font-size: 0.9rem; color: #64748b; margin-bottom: 12px; }
    .turbine-details div { margin-bottom: 4px; }
    .turbine-actions { display: flex; gap: 8px; }
    .btn-sm { padding: 6px 12px; font-size: 0.85rem; border: none; border-radius: 6px; cursor: pointer; }
    .btn-edit { background: #e0e7ff; color: #4338ca; }
    .btn-edit:hover { background: #c7d2fe; }
    .btn-delete { background: #fee2e2; color: #dc2626; }
    .btn-delete:hover { background: #fecaca; }
    .pagination { display: flex; align-items: center; justify-content: center; gap: 16px; margin-top: 24px; padding: 16px; }
    .pagination button { padding: 8px 16px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }
    .time-range { display: flex; gap: 8px; flex-wrap: wrap; }
    .time-range button { padding: 8px 16px; border: 1px solid #e2e8f0; background: #fff; border-radius: 8px; cursor: pointer; }
    .time-range button.active { background: #0ea5e9; color: #fff; border-color: #0ea5e9; }
    .charts-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    @media (max-width: 1200px) { .charts-grid { grid-template-columns: 1fr; } }
    .chart-card { background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .chart-card.gauge-card { grid-column: 1 / -1; }
    .chart-card h3 { margin: 0 0 16px 0; font-size: 1rem; font-weight: 600; }
    .chart-wrapper { position: relative; height: 280px; }
    .chart-wrapper canvas { max-height: 280px; }
    .farms-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .farm-card { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); transition: all 0.2s ease; }
    .farm-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .farm-card h3 { margin: 0 0 4px 0; }
    .farm-region { font-size: 0.9rem; color: #64748b; margin-bottom: 16px; }
    .metric-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .efficiency-gauge { margin-top: 16px; }
    .gauge-label { font-size: 0.85rem; margin-bottom: 8px; }
    .gauge-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
    .gauge-fill { height: 100%; background: linear-gradient(90deg, #059669, #10b981); border-radius: 4px; transition: width 0.3s; }
    .gauge-value { font-size: 0.9rem; margin-top: 4px; }
    .anomaly-badge { margin-top: 12px; padding: 6px 12px; background: #fef3c7; color: #b45309; border-radius: 6px; font-size: 0.85rem; }
    .alerts-list { display: flex; flex-direction: column; gap: 12px; }
    .alert-card {
      background: #fff; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.06);
      border-left: 4px solid #94a3b8; transition: all 0.2s ease;
    }
    .alert-card:hover { transform: translateY(-1px); }
    .alert-card.critical { border-left-color: #dc2626; }
    .alert-card.warning { border-left-color: #f59e0b; }
    .alert-card.info { border-left-color: #3b82f6; }
    .alert-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
    .alert-severity-badge { font-weight: 600; font-size: 0.9rem; }
    .alert-card.critical .alert-severity-badge { color: #dc2626; }
    .alert-card.warning .alert-severity-badge { color: #d97706; }
    .alert-card.info .alert-severity-badge { color: #2563eb; }
    .alert-time { font-size: 0.85rem; color: #64748b; }
    .alert-turbine { font-weight: 500; margin-bottom: 8px; }
    .alert-message { color: #475569; }
    .reports-placeholder { text-align: center; padding: 80px 24px; background: #fff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .placeholder-icon { font-size: 4rem; display: block; margin-bottom: 16px; opacity: 0.5; }
    .reports-placeholder h3 { margin: 0 0 8px 0; }
    .reports-placeholder p { color: #64748b; margin-bottom: 24px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; animation: fadeIn 0.2s; }
    .modal-content { background: #fff; border-radius: 12px; padding: 24px; max-width: 480px; width: 90%; max-height: 90vh; overflow-y: auto; box-shadow: 0 24px 48px rgba(0,0,0,0.2); }
    .modal-content h2 { margin: 0 0 20px 0; }
    .form-group { margin-bottom: 16px; }
    .form-group label { display: block; margin-bottom: 6px; font-weight: 500; }
    .form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 8px; }
    .modal-actions { display: flex; gap: 12px; justify-content: flex-end; margin-top: 24px; }
    .confirm-dialog { background: #fff; border-radius: 12px; padding: 24px; max-width: 420px; width: 90%; box-shadow: 0 24px 48px rgba(0,0,0,0.2); }
    .confirm-dialog h3 { margin: 0 0 12px 0; }
    .confirm-dialog p { color: #64748b; margin-bottom: 24px; }
    .dialog-actions { display: flex; gap: 12px; justify-content: flex-end; }
    .btn-danger { padding: 10px 20px; background: #dc2626; color: #fff; border: none; border-radius: 8px; cursor: pointer; }
    .btn-danger:hover { background: #b91c1c; }
    .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 1100; display: flex; flex-direction: column; gap: 8px; }
    .toast { display: flex; align-items: center; gap: 12px; padding: 12px 20px; background: #fff; border-radius: 8px; box-shadow: 0 4px 24px rgba(0,0,0,0.15); animation: slideIn 0.3s ease; }
    .toast-success { border-left: 4px solid #059669; }
    .toast-error { border-left: 4px solid #dc2626; }
    .toast-info { border-left: 4px solid #0ea5e9; }
    .toast-warning { border-left: 4px solid #f59e0b; }
    .toast-icon { font-size: 1.25rem; }
    @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    `,
  ],
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('lineChart') lineChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart') barChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChart') pieChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('donutChart') donutChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('gaugeChart') gaugeChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('liveFeedContainer') liveFeedContainer?: ElementRef<HTMLDivElement>;

  private destroy$ = new Subject<void>();
  private readonly REFRESH_INTERVAL_MS = 30000;
  private charts: Record<string, Chart> = {};
  private chartsInitialized = false;
  private toastId = 0;

  Math = Math;

  views: { id: DashboardView; label: string; icon: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'livefeed', label: 'Live Feed', icon: '📡' },
    { id: 'turbines', label: 'Turbines', icon: '🔧' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'farms', label: 'Farms', icon: '🏭' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'reports', label: 'Reports', icon: '📋' },
  ];

  timeRanges = [
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Week' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  activeView = signal<DashboardView>('dashboard');
  turbines = signal<Turbine[]>([]);
  alerts = signal<Alert[]>([]);
  liveEvents = signal<LiveEvent[]>([]);
  filteredLiveEvents = signal<LiveEvent[]>([]);
  lastRefresh = signal<string>('--');
  username = signal<string>('User');
  role = signal<string>('USER');
  isAdmin = signal<boolean>(false);
  loading = signal<boolean>(false);
  showModal = false;
  showConfirmDialog = false;
  turbineToDelete: Turbine | null = null;
  editingTurbine: Turbine | null = null;
  kpiHover = signal<string | null>(null);
  autoScroll = signal<boolean>(true);
  toasts = signal<Toast[]>([]);

  filterRegion = '';
  filterFarm = '';
  filterStatus = '';
  turbineSearch = '';
  turbineSortBy: 'name' | 'farm' | 'capacity' | 'status' = 'name';
  turbinePage = signal(1);
  readonly TURBINES_PER_PAGE = 6;
  farmSearch = '';
  alertSearch = '';
  alertSeverityFilter = '';
  liveFeedSearch = '';
  analyticsTimeRange = signal<string>('week');

  formTurbine: Partial<Turbine> = {
    turbineName: '',
    farmId: '',
    farmName: '',
    region: '',
    capacity: 0,
    status: 'ACTIVE',
    latitude: 0,
    longitude: 0,
    installationDate: new Date().toISOString().split('T')[0],
    lastMaintenanceDate: null,
  };

  regions = computed(() => [...new Set(this.turbines().map((x) => x.region))].sort());
  farms = computed(() => [...new Set(this.turbines().map((x) => x.farmName))].sort());

  filteredTurbines = computed(() => {
    let t = this.turbines();
    if (this.filterRegion) t = t.filter((x) => x.region === this.filterRegion);
    if (this.filterFarm) t = t.filter((x) => x.farmName === this.filterFarm);
    if (this.filterStatus) t = t.filter((x) => x.status === this.filterStatus);
    if (this.turbineSearch) {
      const q = this.turbineSearch.toLowerCase();
      t = t.filter(
        (x) =>
          x.turbineName.toLowerCase().includes(q) ||
          x.farmName.toLowerCase().includes(q) ||
          x.region.toLowerCase().includes(q)
      );
    }
    const sortBy = this.turbineSortBy;
    t = [...t].sort((a, b) => {
      if (sortBy === 'name') return (a.turbineName || '').localeCompare(b.turbineName || '');
      if (sortBy === 'farm') return (a.farmName || '').localeCompare(b.farmName || '');
      if (sortBy === 'capacity') return (b.capacity || 0) - (a.capacity || 0);
      if (sortBy === 'status') return (a.status || '').localeCompare(b.status || '');
      return 0;
    });
    return t;
  });

  totalTurbinePages = computed(() =>
    Math.max(1, Math.ceil(this.filteredTurbines().length / this.TURBINES_PER_PAGE))
  );

  paginatedTurbines = computed(() => {
    const all = this.filteredTurbines();
    const page = this.turbinePage();
    const start = (page - 1) * this.TURBINES_PER_PAGE;
    return all.slice(start, start + this.TURBINES_PER_PAGE);
  });

  filteredFarmMetrics = computed(() => {
    let fm = this.farmMetrics();
    if (this.farmSearch) {
      const q = this.farmSearch.toLowerCase();
      fm = fm.filter(
        (x) =>
          x.farmName.toLowerCase().includes(q) || x.region.toLowerCase().includes(q)
      );
    }
    return fm;
  });

  filteredAlerts = computed(() => {
    let a = this.alerts();
    if (this.alertSearch) {
      const q = this.alertSearch.toLowerCase();
      a = a.filter(
        (x) =>
          x.message.toLowerCase().includes(q) ||
          x.turbineName.toLowerCase().includes(q) ||
          x.farmName.toLowerCase().includes(q)
      );
    }
    if (this.alertSeverityFilter) {
      a = a.filter((x) => x.severity === this.alertSeverityFilter);
    }
    return a;
  });

  totalTurbines = computed(() => this.filteredTurbines().length);
  activeCount = computed(() =>
    this.filteredTurbines().filter((t) => t.status === 'ACTIVE').length
  );
  maintenanceCount = computed(() =>
    this.filteredTurbines().filter((t) => t.status === 'MAINTENANCE').length
  );
  offlineCount = computed(() =>
    this.filteredTurbines().filter((t) => t.status === 'OFFLINE').length
  );
  totalCapacity = computed(() =>
    this.filteredTurbines().reduce((sum, t) => sum + (t.capacity || 0), 0).toFixed(1)
  );
  avgEfficiency = computed(() => {
    const t = this.filteredTurbines();
    if (t.length === 0) return 0;
    const avg =
      t.reduce((s, x) => s + (this.getMockEfficiency(x) || 0), 0) / t.length;
    return Math.round(avg);
  });

  farmMetrics = computed(() => this.computeFarmMetrics(this.filteredTurbines()));

  kpiCards = computed(() => {
    const eff = this.avgEfficiency();
    const prevEff = Math.max(0, eff - 3);
    const trend = eff > 0 ? Math.round(((eff - prevEff) / prevEff) * 100) : 0;
    return [
      {
        id: 'total',
        icon: '⚡',
        value: this.totalTurbines().toString(),
        label: 'Total Turbines',
        gradient: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
        valueClass: '',
        trend: 0,
        sparkline: this.generateSparkline([5, 8, 6, 9, 7, 10, 8]),
      },
      {
        id: 'active',
        icon: '✓',
        value: this.activeCount().toString(),
        label: 'Active',
        gradient: 'linear-gradient(135deg, #059669, #10b981)',
        valueClass: 'active',
        trend: 2,
        sparkline: this.generateSparkline([4, 5, 5, 6, 5, 6, 6]),
      },
      {
        id: 'maintenance',
        icon: '🔧',
        value: this.maintenanceCount().toString(),
        label: 'Maintenance',
        gradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
        valueClass: 'maintenance',
        trend: -1,
        sparkline: this.generateSparkline([2, 1, 2, 1, 2, 1, 1]),
      },
      {
        id: 'offline',
        icon: '✕',
        value: this.offlineCount().toString(),
        label: 'Offline',
        gradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
        valueClass: 'offline',
        trend: 0,
        sparkline: this.generateSparkline([1, 1, 1, 1, 1, 1, 1]),
      },
      {
        id: 'capacity',
        icon: '🔋',
        value: this.totalCapacity() + ' MW',
        label: 'Total Capacity',
        gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
        valueClass: '',
        trend: 5,
        sparkline: this.generateSparkline([12, 14, 13, 15, 14, 16, 15]),
      },
      {
        id: 'efficiency',
        icon: '📈',
        value: eff + '%',
        label: 'Avg Efficiency',
        gradient: 'linear-gradient(135deg, #0ea5e9, #22d3ee)',
        valueClass: '',
        trend,
        sparkline: this.generateSparkline([70, 72, 71, 74, 73, 75, eff]),
      },
    ];
  });

  constructor(
    private turbineService: TurbineService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  @HostListener('document:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      this.refreshData();
    }
  }

  ngOnInit(): void {
    this.loadUser();
    this.loadTurbines();
    this.setupAlerts();
    this.setupLiveEvents();
    this.setupAutoRefresh();
  }

  ngAfterViewChecked(): void {
    if (this.activeView() === 'analytics' && !this.chartsInitialized) {
      setTimeout(() => this.initCharts(), 0);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUser(): void {
    this.username.set(this.authService.getUsername() || 'User');
    this.authService
      .getCurrentUser()
      .pipe(catchError(() => of({ role: 'USER' })))
      .subscribe((user) => {
        this.role.set(user.role || 'USER');
        this.isAdmin.set(user.role === 'ADMIN');
      });
  }

  private loadTurbines(): void {
    this.loading.set(true);
    this.turbineService
      .getAllTurbines()
      .pipe(catchError(() => of(this.getMockTurbines())))
      .subscribe((t) => {
        this.turbines.set(t);
        this.lastRefresh.set(new Date().toLocaleTimeString());
        this.loading.set(false);
        this.cdr.markForCheck();
      });
  }

  private setupAlerts(): void {
    this.alerts.set(this.getMockAlerts());
  }

  private setupLiveEvents(): void {
    const events: LiveEvent[] = [];
    const now = new Date();
    const turbines = this.turbines().length ? this.turbines() : this.getMockTurbines();
    turbines.slice(0, 4).forEach((t, i) => {
      events.push({
        id: `e${i}-1`,
        type: 'status',
        message: `${t.turbineName} status updated to ${t.status}`,
        turbineName: t.turbineName,
        farmName: t.farmName,
        timestamp: new Date(now.getTime() - i * 120000),
      });
    });
    this.alerts().slice(0, 3).forEach((a, i) => {
      events.push({
        id: `e${i}-2`,
        type: 'alert',
        message: a.message,
        turbineName: a.turbineName,
        farmName: a.farmName,
        timestamp: a.timestamp,
        severity: a.severity,
      });
    });
    events.push({
      id: 'e-m1',
      type: 'metric',
      message: 'Daily generation target achieved',
      value: '142 MWh',
      timestamp: new Date(now.getTime() - 300000),
    });
    events.push({
      id: 'e-m2',
      type: 'maintenance',
      message: 'Scheduled maintenance completed for Turbine Alpha-3',
      turbineName: 'Turbine Alpha-3',
      farmName: 'North Wind Farm',
      timestamp: new Date(now.getTime() - 600000),
    });
    events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    this.liveEvents.set(events);
    this.filteredLiveEvents.set(events);
  }

  private setupAutoRefresh(): void {
    interval(this.REFRESH_INTERVAL_MS)
      .pipe(
        startWith(0),
        takeUntil(this.destroy$),
        switchMap(() =>
          this.turbineService.getAllTurbines().pipe(
            catchError(() => of(this.getMockTurbines()))
          )
        )
      )
      .subscribe((t) => {
        this.turbines.set(t);
        this.lastRefresh.set(new Date().toLocaleTimeString());
        this.alerts.set(this.getMockAlerts());
        this.setupLiveEvents();
        this.cdr.markForCheck();
      });
  }

  private getMockTurbines(): Turbine[] {
    return [
      {
        turbineId: 'T001',
        turbineName: 'Turbine Alpha-1',
        farmId: 'F1',
        farmName: 'North Wind Farm',
        region: 'North',
        capacity: 2.5,
        status: 'ACTIVE',
        latitude: 55.5,
        longitude: -3.2,
        installationDate: '2020-01-15',
        lastMaintenanceDate: '2024-01-10',
      },
      {
        turbineId: 'T002',
        turbineName: 'Turbine Alpha-2',
        farmId: 'F1',
        farmName: 'North Wind Farm',
        region: 'North',
        capacity: 2.5,
        status: 'ACTIVE',
        latitude: 55.6,
        longitude: -3.3,
        installationDate: '2020-02-20',
        lastMaintenanceDate: null,
      },
      {
        turbineId: 'T003',
        turbineName: 'Turbine Alpha-3',
        farmId: 'F1',
        farmName: 'North Wind Farm',
        region: 'North',
        capacity: 2.5,
        status: 'MAINTENANCE',
        latitude: 55.7,
        longitude: -3.4,
        installationDate: '2020-03-10',
        lastMaintenanceDate: '2024-02-01',
      },
      {
        turbineId: 'T004',
        turbineName: 'Turbine Beta-1',
        farmId: 'F2',
        farmName: 'South Wind Farm',
        region: 'South',
        capacity: 3.0,
        status: 'ACTIVE',
        latitude: 54.2,
        longitude: -2.4,
        installationDate: '2021-03-15',
        lastMaintenanceDate: '2024-01-20',
      },
      {
        turbineId: 'T005',
        turbineName: 'Turbine Beta-2',
        farmId: 'F2',
        farmName: 'South Wind Farm',
        region: 'South',
        capacity: 3.0,
        status: 'OFFLINE',
        latitude: 54.3,
        longitude: -2.5,
        installationDate: '2021-04-20',
        lastMaintenanceDate: null,
      },
      {
        turbineId: 'T006',
        turbineName: 'Turbine Gamma-1',
        farmId: 'F3',
        farmName: 'East Coast Farm',
        region: 'East',
        capacity: 2.0,
        status: 'ACTIVE',
        latitude: 53.8,
        longitude: -1.5,
        installationDate: '2022-01-10',
        lastMaintenanceDate: '2024-02-15',
      },
    ];
  }

  private getMockAlerts(): Alert[] {
    const now = new Date();
    return [
      {
        id: 'A1',
        turbineId: 'T003',
        turbineName: 'Turbine Alpha-3',
        farmName: 'North Wind Farm',
        region: 'North',
        severity: 'CRITICAL',
        message: 'Vibration anomaly detected - exceeds threshold',
        timestamp: new Date(now.getTime() - 60000),
        acknowledged: false,
      },
      {
        id: 'A2',
        turbineId: 'T005',
        turbineName: 'Turbine Beta-2',
        farmName: 'South Wind Farm',
        region: 'South',
        severity: 'WARNING',
        message: 'Turbine offline - manual intervention required',
        timestamp: new Date(now.getTime() - 300000),
        acknowledged: false,
      },
      {
        id: 'A3',
        turbineId: 'T001',
        turbineName: 'Turbine Alpha-1',
        farmName: 'North Wind Farm',
        region: 'North',
        severity: 'INFO',
        message: 'Scheduled maintenance due in 7 days',
        timestamp: new Date(now.getTime() - 600000),
        acknowledged: false,
      },
      {
        id: 'A4',
        turbineId: 'T003',
        turbineName: 'Turbine Alpha-3',
        farmName: 'North Wind Farm',
        region: 'North',
        severity: 'WARNING',
        message: 'Power output below expected range',
        timestamp: new Date(now.getTime() - 900000),
        acknowledged: false,
      },
      {
        id: 'A5',
        turbineId: 'T006',
        turbineName: 'Turbine Gamma-1',
        farmName: 'East Coast Farm',
        region: 'East',
        severity: 'INFO',
        message: 'Telemetry data aggregated successfully',
        timestamp: new Date(now.getTime() - 1200000),
        acknowledged: false,
      },
    ];
  }

  private getMockEfficiency(t: Turbine): number {
    if (t.status === 'OFFLINE') return 0;
    if (t.status === 'MAINTENANCE') return 45 + Math.random() * 25;
    return 65 + Math.random() * 30;
  }

  private computeFarmMetrics(turbines: Turbine[]): FarmMetrics[] {
    const byFarm = new Map<string, Turbine[]>();
    for (const t of turbines) {
      const key = t.farmId || t.farmName;
      if (!byFarm.has(key)) byFarm.set(key, []);
      byFarm.get(key)!.push(t);
    }
    return Array.from(byFarm.entries()).map(([farmId, list]) => {
      const farmName = list[0]?.farmName || farmId;
      const region = list[0]?.region || '';
      const active = list.filter((x) => x.status === 'ACTIVE').length;
      const maintenance = list.filter((x) => x.status === 'MAINTENANCE').length;
      const offline = list.filter((x) => x.status === 'OFFLINE').length;
      const totalCapacity = list.reduce((s, x) => s + (x.capacity || 0), 0);
      const avgEff =
        list.length === 0
          ? 0
          : list.reduce((s, x) => s + this.getMockEfficiency(x), 0) / list.length;
      const dailyGen = totalCapacity * (avgEff / 100) * 24 * 0.8;
      const anomalyCount = this.alerts().filter((a) =>
        list.some((t) => t.turbineId === a.turbineId)
      ).length;
      return {
        farmId,
        farmName,
        region,
        totalTurbines: list.length,
        activeCount: active,
        maintenanceCount: maintenance,
        offlineCount: offline,
        totalCapacity: Math.round(totalCapacity * 10) / 10,
        avgEfficiency: Math.round(avgEff),
        dailyGeneration: Math.round(dailyGen * 10) / 10,
        anomalyCount,
      };
    });
  }

  private generateSparkline(values: number[]): string {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const w = 100 / (values.length - 1);
    return values
      .map((v, i) => `${i * w},${24 - ((v - min) / range) * 20}`)
      .join(' ');
  }

  private getPowerGenerationData(): { labels: string[]; data: number[] } {
    const range = this.analyticsTimeRange();
    const points = range === 'today' ? 12 : range === 'week' ? 7 : range === 'month' ? 30 : 12;
    const labels: string[] = [];
    const data: number[] = [];
    const now = new Date();
    for (let i = points - 1; i >= 0; i--) {
      if (range === 'today') {
        labels.push(`${now.getHours() - i}:00`);
      } else if (range === 'week') {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('en-US', { weekday: 'short' }));
      } else if (range === 'month') {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        labels.push(d.getDate().toString());
      } else {
        const d = new Date(now);
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
      }
      data.push(80 + Math.random() * 60);
    }
    return { labels, data };
  }

  private initCharts(): void {
    if (this.activeView() !== 'analytics') return;
    this.destroyCharts();
    const { labels, data } = this.getPowerGenerationData();
    const fm = this.farmMetrics();
    const statusData = [
      this.activeCount(),
      this.maintenanceCount(),
      this.offlineCount(),
    ];
    const regionData = fm.map((f) => f.totalCapacity);
    const regionLabels = fm.map((f) => f.region);

    if (this.lineChartRef?.nativeElement) {
      const ctx = this.lineChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.line = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'Power (MWh)',
                data,
                borderColor: '#0ea5e9',
                backgroundColor: 'rgba(14, 165, 233, 0.1)',
                fill: true,
                tension: 0.4,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true },
            },
          },
        });
      }
    }

    if (this.barChartRef?.nativeElement) {
      const ctx = this.barChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.bar = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: fm.map((f) => f.farmName),
            datasets: [
              {
                label: 'Daily Gen (MWh)',
                data: fm.map((f) => f.dailyGeneration),
                backgroundColor: ['#0ea5e9', '#06b6d4', '#10b981', '#8b5cf6'],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              y: { beginAtZero: true },
            },
          },
        });
      }
    }

    if (this.pieChartRef?.nativeElement) {
      const ctx = this.pieChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.pie = new Chart(ctx, {
          type: 'pie',
          data: {
            labels: ['Active', 'Maintenance', 'Offline'],
            datasets: [
              {
                data: statusData,
                backgroundColor: ['#059669', '#d97706', '#dc2626'],
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom' } },
          },
        });
      }
    }

    if (this.donutChartRef?.nativeElement) {
      const ctx = this.donutChartRef.nativeElement.getContext('2d');
      if (ctx) {
        this.charts.donut = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: regionLabels,
            datasets: [
              {
                data: regionData,
                backgroundColor: ['#0ea5e9', '#06b6d4', '#10b981', '#8b5cf6'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'bottom' } },
          },
        });
      }
    }

    if (this.gaugeChartRef?.nativeElement) {
      const ctx = this.gaugeChartRef.nativeElement.getContext('2d');
      if (ctx) {
        const eff = this.avgEfficiency();
        this.charts.gauge = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Efficiency', 'Remaining'],
            datasets: [
              {
                data: [eff, 100 - eff],
                backgroundColor: ['#0ea5e9', '#e2e8f0'],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false },
            },
          },
        });
      }
    }

    this.chartsInitialized = true;
    this.cdr.markForCheck();
  }

  private destroyCharts(): void {
    Object.values(this.charts).forEach((ch) => ch?.destroy());
    this.charts = {};
    this.chartsInitialized = false;
  }

  setView(view: DashboardView): void {
    if (this.activeView() === 'analytics') {
      this.destroyCharts();
    }
    this.activeView.set(view);
    if (view === 'analytics') {
      this.chartsInitialized = false;
      setTimeout(() => this.initCharts(), 100);
    }
    if (view === 'livefeed') {
      setTimeout(() => this.scrollLiveFeedToBottom(), 100);
    }
    if (view === 'turbines') {
      this.turbinePage.set(1);
    }
    this.cdr.markForCheck();
  }

  getViewTitle(): string {
    const v = this.views.find((x) => x.id === this.activeView());
    return v ? v.label : 'Dashboard';
  }

  applyFilters(): void {}

  applyTurbineFilters(): void {
    this.turbinePage.set(1);
  }

  applyFarmFilters(): void {}

  applyAlertFilters(): void {}

  filterLiveEvents(): void {
    const q = this.liveFeedSearch.toLowerCase();
    const events = this.liveEvents();
    if (!q) {
      this.filteredLiveEvents.set(events);
    } else {
      this.filteredLiveEvents.set(
        events.filter(
          (e) =>
            e.message.toLowerCase().includes(q) ||
            (e.turbineName?.toLowerCase().includes(q)) ||
            (e.farmName?.toLowerCase().includes(q))
        )
      );
    }
    this.cdr.markForCheck();
  }

  setTurbinePage(page: number): void {
    this.turbinePage.set(Math.max(1, Math.min(page, this.totalTurbinePages())));
  }

  setAnalyticsTimeRange(range: string): void {
    this.analyticsTimeRange.set(range);
    if (this.charts.line) {
      const { labels, data } = this.getPowerGenerationData();
      this.charts.line.data.labels = labels;
      this.charts.line.data.datasets[0].data = data;
      this.charts.line.update();
    }
  }

  refreshData(): void {
    this.loadTurbines();
    this.setupLiveEvents();
    this.showToast('success', 'Data refreshed successfully');
    if (this.activeView() === 'analytics') {
      this.chartsInitialized = false;
      setTimeout(() => this.initCharts(), 100);
    }
  }

  exportData(): void {
    console.log('Export data:', {
      turbines: this.turbines(),
      farmMetrics: this.farmMetrics(),
      alerts: this.alerts(),
    });
    this.showToast('info', 'Export triggered (console)');
  }

  exportChartData(): void {
    const { labels, data } = this.getPowerGenerationData();
    console.log('Chart data:', { powerGeneration: { labels, data } });
    this.showToast('success', 'Chart data exported to console');
  }

  onLiveFeedScroll(): void {
    if (!this.liveFeedContainer?.nativeElement) return;
    const el = this.liveFeedContainer.nativeElement;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    if (!atBottom && this.autoScroll()) {
      this.autoScroll.set(false);
    }
  }

  private scrollLiveFeedToBottom(): void {
    setTimeout(() => {
      const el = this.liveFeedContainer?.nativeElement;
      if (el && this.autoScroll()) {
        el.scrollTop = el.scrollHeight;
      }
    }, 50);
  }

  getEventIcon(type: string): string {
    const icons: Record<string, string> = {
      status: '🔄',
      alert: '⚠',
      metric: '📊',
      maintenance: '🔧',
    };
    return icons[type] || '•';
  }

  getToastIcon(type: string): string {
    const icons: Record<string, string> = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠',
    };
    return icons[type] || '•';
  }

  showToast(type: Toast['type'], message: string, duration = 3000): void {
    const id = ++this.toastId;
    const toast: Toast = { id, type, message, duration };
    this.toasts.update((t) => [...t, toast]);
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toasts.update((t) => t.filter((x) => x.id !== id));
      this.cdr.markForCheck();
    }, duration);
  }

  logout(): void {
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
    });
  }

  openCreateModal(): void {
    this.editingTurbine = null;
    this.formTurbine = {
      turbineName: '',
      farmId: '',
      farmName: '',
      region: '',
      capacity: 0,
      status: 'ACTIVE',
      latitude: 0,
      longitude: 0,
      installationDate: new Date().toISOString().split('T')[0],
      lastMaintenanceDate: null,
    };
    this.showModal = true;
  }

  openEditModal(t: Turbine): void {
    this.editingTurbine = t;
    this.formTurbine = { ...t };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingTurbine = null;
  }

  saveTurbine(): void {
    const f = this.formTurbine;
    if (!f.turbineName || !f.farmId || !f.farmName || !f.region || f.capacity == null)
      return;
    
    // Convert date string to ISO DateTime format for backend
    let installationDate = f.installationDate || new Date().toISOString().split('T')[0];
    if (installationDate && !installationDate.includes('T')) {
      installationDate = `${installationDate}T00:00:00`;
    }
    
    const turbine: Turbine = {
      turbineId: this.editingTurbine?.turbineId || `T${Date.now()}`,
      turbineName: f.turbineName,
      farmId: f.farmId,
      farmName: f.farmName,
      region: f.region,
      capacity: f.capacity ?? 0,
      status: f.status || 'ACTIVE',
      latitude: f.latitude ?? 0,
      longitude: f.longitude ?? 0,
      installationDate: installationDate,
      lastMaintenanceDate: f.lastMaintenanceDate ?? null,
    };
    const obs = this.editingTurbine
      ? this.turbineService.updateTurbine(turbine.turbineId, turbine)
      : this.turbineService.createTurbine(turbine);
    obs.pipe(catchError(() => of(turbine))).subscribe(() => {
      this.loadTurbines();
      this.closeModal();
      this.showToast('success', this.editingTurbine ? 'Turbine updated' : 'Turbine created');
    });
  }

  confirmDeleteTurbine(t: Turbine): void {
    this.turbineToDelete = t;
    this.showConfirmDialog = true;
  }

  cancelDelete(): void {
    this.showConfirmDialog = false;
    this.turbineToDelete = null;
  }

  executeDelete(): void {
    const t = this.turbineToDelete;
    if (!t) return;
    this.turbineService
      .deleteTurbine(t.turbineId)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        this.loadTurbines();
        this.cancelDelete();
        this.showToast('success', `Turbine ${t.turbineName} deleted`);
      });
  }
}
