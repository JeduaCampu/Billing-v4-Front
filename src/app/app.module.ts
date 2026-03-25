import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AuthInterceptor, AuthModule, LogLevel } from 'angular-auth-oidc-client';
import { HTTP_INTERCEPTORS, HttpClientModule, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { environment } from '../environments/environment';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CoreModule,
    HttpClientModule,
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
    provideHttpClient(withInterceptorsFromDi()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }