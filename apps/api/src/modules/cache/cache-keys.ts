export const CacheKeys = {
  dashboard: (tenantId: string) => `dashboard:${tenantId}`,
  tenant: (subdomain: string) => `tenant:${subdomain}`,
};

export const CacheTTL = {
  dashboard: 20, // seconds
  tenant: 60, // seconds
};
