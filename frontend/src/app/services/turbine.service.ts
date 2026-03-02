import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

export interface Turbine {
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

@Injectable({
  providedIn: 'root'
})
export class TurbineService {
  
  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    return this.authService.getAuthHeaders();
  }

  getAllTurbines(): Observable<Turbine[]> {
    return this.http.get<Turbine[]>('/api/turbines', { headers: this.getHeaders() });
  }

  getTurbineById(id: string): Observable<Turbine> {
    return this.http.get<Turbine>(`/api/turbines/${id}`, { headers: this.getHeaders() });
  }

  createTurbine(turbine: Turbine): Observable<Turbine> {
    return this.http.post<Turbine>('/api/turbines', turbine, { headers: this.getHeaders() });
  }

  updateTurbine(id: string, turbine: Turbine): Observable<Turbine> {
    return this.http.put<Turbine>(`/api/turbines/${id}`, turbine, { headers: this.getHeaders() });
  }

  deleteTurbine(id: string): Observable<any> {
    return this.http.delete(`/api/turbines/${id}`, { headers: this.getHeaders() });
  }

  updateTurbineStatus(id: string, status: string): Observable<Turbine> {
    return this.http.patch<Turbine>(`/api/turbines/${id}/status?status=${status}`, {}, { headers: this.getHeaders() });
  }

  getStats(): Observable<any> {
    return this.http.get('/api/turbines/stats', { headers: this.getHeaders() });
  }
}
