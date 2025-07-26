/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as callManagement from "../callManagement.js";
import type * as http from "../http.js";
import type * as identityVerification from "../identityVerification.js";
import type * as needsRouting from "../needsRouting.js";
import type * as router from "../router.js";
import type * as voiceProcessing from "../voiceProcessing.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  callManagement: typeof callManagement;
  http: typeof http;
  identityVerification: typeof identityVerification;
  needsRouting: typeof needsRouting;
  router: typeof router;
  voiceProcessing: typeof voiceProcessing;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
