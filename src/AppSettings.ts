export const authSettings = {
  domain: "dev-qjg8tcy86dt7zrfv.us.auth0.com",
  clientId: "5S1RtjB0SgnvKlMaHujF8PMnYnGdiIgj",
  authorizationParams: {
    redirect_uri: window.location.origin + "/signin-callback",
    scope: "openid profile QandAAPI email",
    audience: "https://qanda",
  },
  //   cacheLocation: 'localstorage',
  //   useRefreshTokens: true,
} as const;
