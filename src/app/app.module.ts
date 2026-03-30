import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
  HttpClientModule,
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';

// 1. Importamos la librería OIDC pero SIN su AuthInterceptor
import { AuthModule, LogLevel } from 'angular-auth-oidc-client';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { environment } from '../environments/environment';

// 2. Importamos TUS componentes y TU Interceptor personalizado
import { TwoFactorSetupComponent } from './features/security/two-factor-setup/two-factor-setup.component';
import { AuthInterceptor } from './core/interceptors/auth-interceptor';

@NgModule({
  declarations: [
    AppComponent,
    TwoFactorSetupComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    HttpClientModule,
    FormsModule,
    // Configuración de la librería OIDC (se mantiene igual)
    AuthModule.forRoot({
      config: {
        authority: window.location.origin + environment.apiUrl,
        redirectUrl: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
        clientId: environment.clientId,
        scope: 'openid profile email offline_access roles',
        responseType: 'code',
        silentRenew: true,
        useRefreshToken: true,
        logLevel: environment.production ? LogLevel.None : LogLevel.Debug,
      },
    }),
  ],
  providers: [
    // 3. Habilitamos el uso de interceptores clásicos (DI)
    provideHttpClient(withInterceptorsFromDi()),
    {
      // 4. Registramos tu Interceptor como el proveedor oficial de HTTP_INTERCEPTORS
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}