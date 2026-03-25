import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class DashboardService {
    private apiUrl = `${environment.apiUrl}/dashboard`;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) { }

    getDashboardSummary(startDate?: string, endDate?: string): Observable<any> {
        const token = this.authService.token;
        let headers = new HttpHeaders();
        if (token) headers = headers.set('Authorization', `Bearer ${token}`);

        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        return this.http.get(`${this.apiUrl}/summary`, { headers, params });
    }

    exportInvoicesMonth(startDate?: string, endDate?: string): Observable<Blob> {
        const token = this.authService.token;
        let headers = new HttpHeaders();
        if (token) headers = headers.set('Authorization', `Bearer ${token}`);
        
        let params = new HttpParams();
        if (startDate) params = params.set('startDate', startDate);
        if (endDate) params = params.set('endDate', endDate);

        // MUY IMPORTANTE: Asegúrate de pasar los { headers, params }
        return this.http.get(`${this.apiUrl}/export`, { 
            headers, 
            params,
            responseType: 'blob' 
        });
    }

    getRevenueTrend(): Observable<any> {
        const token = this.authService.token;
        let headers = new HttpHeaders();
        if (token) headers = headers.set('Authorization', `Bearer ${token}`);
        return this.http.get(`${this.apiUrl}/trend`, { headers });
    }

}