/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as ai_ask from "../ai/ask.js";
import type * as ai_constants from "../ai/constants.js";
import type * as ai_embed from "../ai/embed.js";
import type * as assets from "../assets.js";
import type * as auth from "../auth.js";
import type * as documents from "../documents.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as images from "../images.js";
import type * as importer_jobs from "../importer/jobs.js";
import type * as importer_map from "../importer/map.js";
import type * as importer_templates from "../importer/templates.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_imageWalker from "../lib/imageWalker.js";
import type * as logs from "../logs.js";
import type * as qa from "../qa.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  "ai/ask": typeof ai_ask;
  "ai/constants": typeof ai_constants;
  "ai/embed": typeof ai_embed;
  assets: typeof assets;
  auth: typeof auth;
  documents: typeof documents;
  files: typeof files;
  http: typeof http;
  images: typeof images;
  "importer/jobs": typeof importer_jobs;
  "importer/map": typeof importer_map;
  "importer/templates": typeof importer_templates;
  "lib/auth": typeof lib_auth;
  "lib/imageWalker": typeof lib_imageWalker;
  logs: typeof logs;
  qa: typeof qa;
  seed: typeof seed;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
