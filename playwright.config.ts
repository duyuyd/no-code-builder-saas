import {defineConfig,devices} from "@playwright/test";

const baseURL=process.env.E2E_BASE_URL;
if(!baseURL)throw new Error("E2E_BASE_URL must point at an explicitly verified Vercel deployment");
const target=new URL(baseURL);
if(target.protocol!=="https:"||!target.hostname.endsWith(".vercel.app"))
 throw new Error("E2E_BASE_URL must be an HTTPS Vercel production or preview URL");

export default defineConfig({
 testDir:"./tests/e2e",
 timeout:120000,
 expect:{timeout:18000},
 fullyParallel:false,
 workers:1,
 retries:0,
 reporter:[["list"],["html",{open:"never",outputFolder:"playwright-report"}]],
 outputDir:"test-results",
 use:{
  ...devices["Desktop Chrome"],
  baseURL:target.origin,
  ...(process.env.E2E_VERCEL_OIDC_TOKEN?{extraHTTPHeaders:{"x-vercel-trusted-oidc-idp-token":process.env.E2E_VERCEL_OIDC_TOKEN}}:{}),
  screenshot:"on",
  video:"on",
  trace:"off",
  actionTimeout:30000,
  navigationTimeout:60000
 }
});
