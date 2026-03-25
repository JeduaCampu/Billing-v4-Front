export const environment = {
  production: false,
  
  // URL de tu API Node.js (MVP 1)
  apiUrl: 'http://localhost:4002/api',

  // Configuración para MVP 2: Microsoft OAuth2 (MSAL)
  azureAd: {
    clientId: 'PONER_AQUI_EL_CLIENT_ID_DE_AZURE',
    tenantId: 'PONER_AQUI_EL_TENANT_ID_DE_LA_EMPRESA',
    redirectUri: 'http://localhost:4200',
    postLogoutRedirectUri: 'http://localhost:4200/login',
    authority: 'https://login.microsoftonline.com/PONER_AQUI_EL_TENANT_ID',
    
    // Scopes necesarios para que Microsoft nos dé el token
    scopes: ['user.read', 'openid', 'profile', 'email']
  }
};