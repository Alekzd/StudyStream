/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chat from "../chat.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as livekit from "../livekit.js";
import type * as pomodoro from "../pomodoro.js";
import type * as rooms from "../rooms.js";
import type * as servers from "../servers.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  helpers: typeof helpers;
  http: typeof http;
  livekit: typeof livekit;
  pomodoro: typeof pomodoro;
  rooms: typeof rooms;
  servers: typeof servers;
  users: typeof users;
}>;

export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
