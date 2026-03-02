import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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

interface TurbineStats {
  total: number;
  active: number;
  maintenance: number;
  offline: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  template: `
    <div class="app-container">
      <!-- Header -->
      <header class="main-header">
        <div class="header-content">
          <div class="logo-section">
            <h1>🌬️ Wind Turbine Health Monitoring System</h1>
            <p class="subtitle">Real-Time Monitoring & Predictive Maintenance Platform</p>
          </div>
          <div class="header-stats">
            <div class="header-stat">
              <span class="stat-label">Total Assets</span>
              <span class="stat-value">{{stats.total}}</span>
            </div>
            <div class="header-stat success">
              <span class="stat-label">Operational</span>
              <span class="stat-value">{{stats.active}}</span>
            </div>
            <div class="header-stat warning">
              <span class="stat-label">Alerts</span>
              <span class="stat-value">{{alerts.length}}</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Navigation Tabs -->
      <nav class="nav-tabs">
        <button class="tab-button" [class.active]="activeTab === 'dashboard'" (click)="setActiveTab('dashboard')">
          📊 Dashboard
        </button>
        <button class="tab-button" [class.active]="activeTab === 'monitoring'" (click)="setActiveTab('monitoring')">
          🔍 Real-Time Monitoring
        </button>
        <button class="tab-button" [class.active]="activeTab === 'analytics'" (click)="setActiveTab('analytics')">
          📈 Performance Analytics
        </button>
        <button class="tab-button" [class.active]="activeTab === 'alerts'" (click)="setActiveTab('alerts')">
          🔔 Alerts & Anomalies
        </button>
        <button class="tab-button" [class.active]="activeTab === 'maintenance'" (click)="setActiveTab('maintenance')">
          🔧 Predictive Maintenance
        </button>
      </nav>

      <!-- Dashboard Tab -->
      <div class="tab-content" *ngIf="activeTab === 'dashboard'">
        <div class="metrics-grid">
          <div class="metric-card total">
            <div class="metric-icon">🌍</div>
            <div class="metric-info">
              <h3>Total Turbines</h3>
              <p class="metric-value">{{stats.total}}</p>
              <span class="metric-change">Across {{getUniqueFarms().length}} farms</span>
            </div>
          </div>
          
          <div class="metric-card active">
            <div class="metric-icon">✅</div>
            <div class="metric-info">
              <h3>Active</h3>
              <p class="metric-value">{{stats.active}}</p>
              <span class="metric-change">{{getPercentage(stats.active)}}% operational</span>
            </div>
          </div>
          
          <div class="metric-card maintenance">
            <div class="metric-icon">⚠️</div>
            <div class="metric-info">
              <h3>Maintenance</h3>
              <p class="metric-value">{{stats.maintenance}}</p>
              <span class="metric-change">{{getPercentage(stats.maintenance)}}% under service</span>
            </div>
          </div>
          
          <div class="metric-card offline">
            <div class="metric-icon">❌</div>
            <div class="metric-info">
              <h3>Offline</h3>
              <p class="metric-value">{{stats.offline}}</p>
              <span class="metric-change">Requires attention</span>
            </div>
          </div>

          <div class="metric-card energy">
            <div class="metric-icon">⚡</div>
            <div class="metric-info">
              <h3>Total Capacity</h3>
              <p class="metric-value">{{getTotalCapacity()}} MW</p>
              <span class="metric-change">Peak generation potential</span>
            </div>
          </div>

          <div class="metric-card efficiency">
            <div class="metric-icon">📊</div>
            <div class="metric-info">
              <h3>Avg Efficiency</h3>
              <p class="metric-value">{{getAverageEfficiency()}}%</p>
              <span class="metric-change">Fleet-wide performance</span>
            </div>
          </div>
        </div>

        <div class="charts-row">
          <div class="chart-card">
            <h3>Status Distribution</h3>
            <canvas #statusChart></canvas>
          </div>
          <div class="chart-card">
            <h3>Regional Distribution</h3>
            <canvas #regionChart></canvas>
          </div>
        </div>

        <div class="chart-card full-width">
          <h3>Capacity by Farm</h3>
          <canvas #capacityChart></canvas>
        </div>
      </div>

      <!-- Real-Time Monitoring Tab -->
      <div class="tab-content" *ngIf="activeTab === 'monitoring'">
        <div class="filters-section">
          <h3>Filter Turbines</h3>
          <div class="filters">
            <div class="filter-group">
              <label>Region:</label>
              <select [(ngModel)]="selectedRegion" (change)="applyFilters()">
                <option value="">All Regions</option>
                <option *ngFor="let region of getUniqueRegions()" [value]="region">{{region}}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Farm:</label>
              <select [(ngModel)]="selectedFarm" (change)="applyFilters()">
                <option value="">All Farms</option>
                <option *ngFor="let farm of getUniqueFarms()" [value]="farm">{{farm}}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Status:</label>
              <select [(ngModel)]="selectedStatus" (change)="applyFilters()">
                <option value="">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="OFFLINE">Offline</option>
              </select>
            </div>
            <div class="filter-group">
              <label>Search:</label>
              <input type="text" [(ngModel)]="searchQuery" (input)="applyFilters()" placeholder="Search turbine name or ID...">
            </div>
          </div>
        </div>

        <div class="turbine-grid">
          <div *ngFor="let turbine of filteredTurbines" class="turbine-card" [class]="'status-' + turbine.status.toLowerCase()">
            <div class="turbine-header">
              <h4>{{turbine.turbineName}}</h4>
              <span class="status-badge" [class]="'badge-' + turbine.status.toLowerCase()">{{turbine.status}}</span>
            </div>
            <div class="turbine-details">
              <div class="detail-row">
                <span class="label">ID:</span>
                <span class="value">{{turbine.turbineId}}</span>
              </div>
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
                <span class="value">{{turbine.capacity / 1000}} MW</span>
              </div>
              <div class="detail-row">
                <span class="label">Location:</span>
                <span class="value">{{turbine.latitude.toFixed(4)}}, {{turbine.longitude.toFixed(4)}}</span>
              </div>
              <div class="detail-row">
                <span class="label">Installed:</span>
                <span class="value">{{formatDate(turbine.installationDate)}}</span>
              </div>
            </div>
            <div class="turbine-actions">
              <button class="action-btn">📊 View Metrics</button>
              <button class="action-btn">📈 Performance</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Performance Analytics Tab -->
      <div class="tab-content" *ngIf="activeTab === 'analytics'">
        <div class="analytics-header">
          <h2>Performance Analytics & Trends</h2>
          <p>Historical data analysis for efficiency and energy generation tracking</p>
        </div>

        <div class="chart-card full-width">
          <h3>Energy Generation Trend (Simulated)</h3>
          <canvas #trendChart></canvas>
        </div>

        <div class="charts-row">
          <div class="chart-card">
            <h3>Efficiency by Region</h3>
            <canvas #efficiencyChart></canvas>
          </div>
          <div class="chart-card">
            <h3>Capacity Utilization</h3>
            <canvas #utilizationChart></canvas>
          </div>
        </div>

        <div class="data-table-section">
          <h3>Turbine Performance Summary</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>Turbine ID</th>
                <th>Name</th>
                <th>Farm</th>
                <th>Region</th>
                <th>Capacity (MW)</th>
                <th>Status</th>
                <th>Efficiency</th>
                <th>Last Maintenance</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let turbine of turbines" [class]="'row-' + turbine.status.toLowerCase()">
                <td>{{turbine.turbineId}}</td>
                <td>{{turbine.turbineName}}</td>
                <td>{{turbine.farmName}}</td>
                <td>{{turbine.region}}</td>
                <td>{{turbine.capacity / 1000}}</td>
                <td><span class="status-badge" [class]="'badge-' + turbine.status.toLowerCase()">{{turbine.status}}</span></td>
                <td>{{getRandomEfficiency()}}%</td>
                <td>{{turbine.lastMaintenanceDate || 'Not scheduled'}}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Alerts Tab -->
      <div class="tab-content" *ngIf="activeTab === 'alerts'">
        <div class="alerts-header">
          <h2>Alerts & Anomaly Detection</h2>
          <p>Real-time health monitoring and early warning system</p>
        </div>

        <div class="alerts-grid">
          <div *ngFor="let alert of alerts" class="alert-card" [class]="'alert-' + alert.severity">
            <div class="alert-icon">{{alert.icon}}</div>
            <div class="alert-content">
              <h4>{{alert.title}}</h4>
              <p>{{alert.message}}</p>
              <div class="alert-meta">
                <span>{{alert.turbineId}}</span>
                <span>{{alert.timestamp}}</span>
              </div>
            </div>
            <button class="alert-action">Acknowledge</button>
          </div>
        </div>

        <div *ngIf="alerts.length === 0" class="no-alerts">
          <div class="no-alerts-icon">✅</div>
          <h3>All Systems Operational</h3>
          <p>No anomalies detected. All turbines are performing within normal parameters.</p>
        </div>
      </div>

      <!-- Predictive Maintenance Tab -->
      <div class="tab-content" *ngIf="activeTab === 'maintenance'">
        <div class="maintenance-header">
          <h2>Predictive Maintenance Dashboard</h2>
          <p>Proactive maintenance scheduling based on performance analysis</p>
        </div>

        <div class="maintenance-metrics">
          <div class="metric-card">
            <h4>Scheduled Maintenance</h4>
            <p class="big-number">{{stats.maintenance}}</p>
            <span>Turbines under service</span>
          </div>
          <div class="metric-card">
            <h4>Upcoming</h4>
            <p class="big-number">3</p>
            <span>Next 7 days</span>
          </div>
          <div class="metric-card">
            <h4>Overdue</h4>
            <p class="big-number">0</p>
            <span>Requires attention</span>
          </div>
        </div>

        <div class="maintenance-schedule">
          <h3>Maintenance Schedule & Recommendations</h3>
          <div class="schedule-list">
            <div class="schedule-item priority-high">
              <div class="schedule-icon">🔴</div>
              <div class="schedule-content">
                <h4>TRB-005 - East Wind 002</h4>
                <p>Blade inspection and lubrication required</p>
                <span class="schedule-date">Priority: High | Scheduled: Next 48 hours</span>
              </div>
            </div>
            <div class="schedule-item priority-medium">
              <div class="schedule-icon">🟡</div>
              <div class="schedule-content">
                <h4>TRB-008 - Central Wind 001</h4>
                <p>Generator bearing replacement recommended</p>
                <span class="schedule-date">Priority: Medium | Scheduled: Next 7 days</span>
              </div>
            </div>
            <div class="schedule-item priority-low">
              <div class="schedule-icon">🟢</div>
              <div class="schedule-content">
                <h4>TRB-001, TRB-002, TRB-003</h4>
                <p>Routine 6-month inspection cycle</p>
                <span class="schedule-date">Priority: Low | Scheduled: Next 30 days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="error" class="error-banner">
        <p>⚠️ {{error}}</p>
        <button (click)="loadTurbines()">Retry</button>
      </div>

      <!-- Footer -->
      <footer class="main-footer">
        <p>Wind Turbine Health Monitoring System | Enterprise Platform v1.0.0</p>
        <p>Real-Time Monitoring • Predictive Analytics • Anomaly Detection • Cloud-Native Architecture</p>
      </footer>
    </div>
  `,
  styles: [`
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    .app-container {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f0f2f5;
      min-height: 100vh;
    }

    .main-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 24px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo-section h1 {
      font-size: 2em;
      margin-bottom: 8px;
    }

    .subtitle {
      opacity: 0.9;
      font-size: 0.95em;
    }

    .header-stats {
      display: flex;
      gap: 24px;
    }

    .header-stat {
      background: rgba(255,255,255,0.15);
      padding: 12px 20px;
      border-radius: 8px;
      text-align: center;
      backdrop-filter: blur(10px);
    }

    .header-stat.success {
      background: rgba(76, 175, 80, 0.3);
    }

    .header-stat.warning {
      background: rgba(255, 152, 0, 0.3);
    }

    .stat-label {
      display: block;
      font-size: 0.85em;
      opacity: 0.9;
      margin-bottom: 4px;
    }

    .stat-value {
      display: block;
      font-size: 2em;
      font-weight: bold;
    }

    .nav-tabs {
      max-width: 1400px;
      margin: 0 auto;
      padding: 16px 24px 0;
      display: flex;
      gap: 8px;
      border-bottom: 2px solid #e0e0e0;
    }

    .tab-button {
      background: none;
      border: none;
      padding: 12px 24px;
      font-size: 0.95em;
      cursor: pointer;
      color: #666;
      border-bottom: 3px solid transparent;
      transition: all 0.3s;
      font-weight: 500;
    }

    .tab-button:hover {
      color: #667eea;
      background: rgba(102, 126, 234, 0.05);
    }

    .tab-button.active {
      color: #667eea;
      border-bottom-color: #667eea;
      font-weight: 600;
    }

    .tab-content {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .metric-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      gap: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .metric-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
    }

    .metric-icon {
      font-size: 2.5em;
    }

    .metric-info h3 {
      font-size: 0.9em;
      color: #666;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 2.2em;
      font-weight: bold;
      color: #333;
    }

    .metric-change {
      font-size: 0.85em;
      color: #888;
    }

    .metric-card.total { border-left: 4px solid #2196F3; }
    .metric-card.active { border-left: 4px solid #4CAF50; }
    .metric-card.maintenance { border-left: 4px solid #FF9800; }
    .metric-card.offline { border-left: 4px solid #F44336; }
    .metric-card.energy { border-left: 4px solid #9C27B0; }
    .metric-card.efficiency { border-left: 4px solid #00BCD4; }

    .charts-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .chart-card {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .chart-card.full-width {
      margin-bottom: 20px;
    }

    .chart-card h3 {
      margin-bottom: 20px;
      color: #333;
      font-size: 1.1em;
    }

    canvas {
      max-height: 300px;
    }

    .filters-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .filters-section h3 {
      margin-bottom: 16px;
      color: #333;
    }

    .filters {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .filter-group label {
      display: block;
      margin-bottom: 8px;
      color: #666;
      font-size: 0.9em;
      font-weight: 500;
    }

    .filter-group select,
    .filter-group input {
      width: 100%;
      padding: 10px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.95em;
    }

    .turbine-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .turbine-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: transform 0.2s;
    }

    .turbine-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.12);
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

    .turbine-header h4 {
      color: #333;
      font-size: 1.1em;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 0.8em;
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
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.85em;
      cursor: pointer;
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: #5568d3;
    }

    .analytics-header,
    .alerts-header,
    .maintenance-header {
      margin-bottom: 24px;
    }

    .analytics-header h2,
    .alerts-header h2,
    .maintenance-header h2 {
      color: #333;
      font-size: 1.8em;
      margin-bottom: 8px;
    }

    .analytics-header p,
    .alerts-header p,
    .maintenance-header p {
      color: #666;
    }

    .data-table-section {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow-x: auto;
    }

    .data-table-section h3 {
      margin-bottom: 16px;
      color: #333;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead {
      background: #f5f5f5;
    }

    .data-table th,
    .data-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .data-table th {
      font-weight: 600;
      color: #666;
      font-size: 0.9em;
      text-transform: uppercase;
    }

    .data-table tbody tr:hover {
      background: #f9f9f9;
    }

    .row-active { background: rgba(76, 175, 80, 0.05); }
    .row-maintenance { background: rgba(255, 152, 0, 0.05); }
    .row-offline { background: rgba(244, 67, 54, 0.05); }

    .alerts-grid {
      display: grid;
      gap: 16px;
    }

    .alert-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .alert-card.alert-critical { border-left: 4px solid #F44336; }
    .alert-card.alert-warning { border-left: 4px solid #FF9800; }
    .alert-card.alert-info { border-left: 4px solid #2196F3; }

    .alert-icon {
      font-size: 2em;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content h4 {
      color: #333;
      margin-bottom: 8px;
    }

    .alert-content p {
      color: #666;
      margin-bottom: 8px;
    }

    .alert-meta {
      display: flex;
      gap: 16px;
      font-size: 0.85em;
      color: #888;
    }

    .alert-action {
      padding: 8px 16px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .no-alerts {
      background: white;
      border-radius: 12px;
      padding: 60px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .no-alerts-icon {
      font-size: 4em;
      margin-bottom: 16px;
    }

    .maintenance-metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .big-number {
      font-size: 3em;
      font-weight: bold;
      color: #667eea;
      margin: 16px 0;
    }

    .maintenance-schedule {
      background: white;
      border-radius: 12px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .maintenance-schedule h3 {
      margin-bottom: 20px;
      color: #333;
    }

    .schedule-list {
      display: grid;
      gap: 16px;
    }

    .schedule-item {
      display: flex;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      background: #f9f9f9;
    }

    .schedule-item.priority-high { border-left: 4px solid #F44336; }
    .schedule-item.priority-medium { border-left: 4px solid #FF9800; }
    .schedule-item.priority-low { border-left: 4px solid #4CAF50; }

    .schedule-icon {
      font-size: 1.5em;
    }

    .schedule-content h4 {
      color: #333;
      margin-bottom: 8px;
    }

    .schedule-content p {
      color: #666;
      margin-bottom: 8px;
    }

    .schedule-date {
      font-size: 0.85em;
      color: #888;
    }

    .error-banner {
      background: #ffebee;
      color: #c62828;
      padding: 16px;
      border-radius: 8px;
      margin: 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .error-banner button {
      padding: 8px 16px;
      background: #c62828;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }

    .main-footer {
      background: #333;
      color: white;
      text-align: center;
      padding: 24px;
      margin-top: 40px;
    }

    .main-footer p {
      margin: 4px 0;
      opacity: 0.8;
    }
  `]
})
export class AppComponent implements OnInit, OnDestroy {
  @ViewChild('statusChart') statusChartRef!: ElementRef;
  @ViewChild('regionChart') regionChartRef!: ElementRef;
  @ViewChild('capacityChart') capacityChartRef!: ElementRef;
  @ViewChild('trendChart') trendChartRef!: ElementRef;
  @ViewChild('efficiencyChart') efficiencyChartRef!: ElementRef;
  @ViewChild('utilizationChart') utilizationChartRef!: ElementRef;

  turbines: Turbine[] = [];
  filteredTurbines: Turbine[] = [];
  stats: TurbineStats = { total: 0, active: 0, maintenance: 0, offline: 0 };
  error: string = '';
  activeTab: string = 'dashboard';

  // Filters
  selectedRegion: string = '';
  selectedFarm: string = '';
  selectedStatus: string = '';
  searchQuery: string = '';

  // Alerts
  alerts = [
    {
      severity: 'warning',
      icon: '⚠️',
      title: 'Low Efficiency Detected',
      message: 'TRB-005 efficiency dropped below 75% threshold',
      turbineId: 'TRB-005',
      timestamp: '2 hours ago'
    },
    {
      severity: 'critical',
      icon: '🔴',
      title: 'Turbine Offline',
      message: 'TRB-008 has been offline for extended period',
      turbineId: 'TRB-008',
      timestamp: '5 hours ago'
    }
  ];

  private refreshInterval: any;
  private charts: any = {};

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTurbines();
    this.refreshInterval = setInterval(() => this.loadTurbines(), 30000); // Refresh every 30s
  }

  ngOnDestroy() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    this.destroyCharts();
  }

  loadTurbines() {
    this.error = '';
    this.http.get<Turbine[]>('/api/turbines').subscribe({
      next: (data) => {
        this.turbines = data;
        this.filteredTurbines = data;
        this.calculateStats();
        setTimeout(() => this.initializeCharts(), 100);
      },
      error: (err) => {
        this.error = 'Failed to load turbines. Make sure the backend is running.';
        console.error('Error loading turbines:', err);
      }
    });
  }

  calculateStats() {
    this.stats = {
      total: this.turbines.length,
      active: this.turbines.filter(t => t.status === 'ACTIVE').length,
      maintenance: this.turbines.filter(t => t.status === 'MAINTENANCE').length,
      offline: this.turbines.filter(t => t.status === 'OFFLINE').length
    };
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    setTimeout(() => this.initializeCharts(), 100);
  }

  applyFilters() {
    this.filteredTurbines = this.turbines.filter(turbine => {
      const matchesRegion = !this.selectedRegion || turbine.region === this.selectedRegion;
      const matchesFarm = !this.selectedFarm || turbine.farmName === this.selectedFarm;
      const matchesStatus = !this.selectedStatus || turbine.status === this.selectedStatus;
      const matchesSearch = !this.searchQuery ||
        turbine.turbineName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        turbine.turbineId.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return matchesRegion && matchesFarm && matchesStatus && matchesSearch;
    });
  }

  getUniqueRegions(): string[] {
    return [...new Set(this.turbines.map(t => t.region))].sort();
  }

  getUniqueFarms(): string[] {
    return [...new Set(this.turbines.map(t => t.farmName))].sort();
  }

  getTotalCapacity(): number {
    return Math.round(this.turbines.reduce((sum, t) => sum + t.capacity, 0) / 1000);
  }

  getAverageEfficiency(): number {
    return Math.round(85 + Math.random() * 10); // Simulated
  }

  getPercentage(value: number): number {
    return Math.round((value / this.stats.total) * 100);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getRandomEfficiency(): number {
    return Math.round(75 + Math.random() * 20);
  }

  destroyCharts() {
    Object.values(this.charts).forEach((chart: any) => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
    this.charts = {};
  }

  initializeCharts() {
    this.destroyCharts();

    if (this.activeTab === 'dashboard') {
      this.createStatusChart();
      this.createRegionChart();
      this.createCapacityChart();
    } else if (this.activeTab === 'analytics') {
      this.createTrendChart();
      this.createEfficiencyChart();
      this.createUtilizationChart();
    }
  }

  createStatusChart() {
    if (!this.statusChartRef) return;
    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    this.charts.status = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Active', 'Maintenance', 'Offline'],
        datasets: [{
          data: [this.stats.active, this.stats.maintenance, this.stats.offline],
          backgroundColor: ['#4CAF50', '#FF9800', '#F44336']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  createRegionChart() {
    if (!this.regionChartRef) return;
    const regionCounts: any = {};
    this.turbines.forEach(t => {
      regionCounts[t.region] = (regionCounts[t.region] || 0) + 1;
    });

    const ctx = this.regionChartRef.nativeElement.getContext('2d');
    this.charts.region = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(regionCounts),
        datasets: [{
          data: Object.values(regionCounts),
          backgroundColor: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0', '#00BCD4']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  createCapacityChart() {
    if (!this.capacityChartRef) return;
    const farmCapacity: any = {};
    this.turbines.forEach(t => {
      farmCapacity[t.farmName] = (farmCapacity[t.farmName] || 0) + t.capacity / 1000;
    });

    const ctx = this.capacityChartRef.nativeElement.getContext('2d');
    this.charts.capacity = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(farmCapacity),
        datasets: [{
          label: 'Total Capacity (MW)',
          data: Object.values(farmCapacity),
          backgroundColor: '#667eea'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }

  createTrendChart() {
    if (!this.trendChartRef) return;
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = labels.map(() => Math.round(500 + Math.random() * 200));

    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    this.charts.trend = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Energy Generation (MWh)',
          data,
          borderColor: '#667eea',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { display: true }
        }
      }
    });
  }

  createEfficiencyChart() {
    if (!this.efficiencyChartRef) return;
    const regions = this.getUniqueRegions();
    const data = regions.map(() => Math.round(80 + Math.random() * 15));

    const ctx = this.efficiencyChartRef.nativeElement.getContext('2d');
    this.charts.efficiency = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: regions,
        datasets: [{
          label: 'Efficiency (%)',
          data,
          backgroundColor: ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#00BCD4']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }

  createUtilizationChart() {
    if (!this.utilizationChartRef) return;
    const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
    const data = labels.map(() => Math.round(70 + Math.random() * 20));

    const ctx = this.utilizationChartRef.nativeElement.getContext('2d');
    this.charts.utilization = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Capacity Utilization (%)',
          data,
          borderColor: '#FF9800',
          backgroundColor: 'rgba(255, 152, 0, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          y: { beginAtZero: true, max: 100 }
        }
      }
    });
  }
}
