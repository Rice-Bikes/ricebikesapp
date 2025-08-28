
export const FEATURE_FLAGS: Record<string, { default: boolean; description: string }> = {
  newCheckoutFlow: { default: false, description: "Enable new checkout UI" },
  debugMode: { default: false, description: "Show debug info to admins" },
  betaSearch: { default: false, description: "Enable beta search experience" },
  maintenanceMode: { default: false, description: "Show maintenance banner" },
};
