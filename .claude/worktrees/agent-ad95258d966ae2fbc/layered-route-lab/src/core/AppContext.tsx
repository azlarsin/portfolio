"use client";

import { createContext } from "react";

export type QueryStringPayload = Record<string, string>;
export type QueryStringCacheMap = Record<string, QueryStringPayload>;

export interface AppContextValue {
  readonly queryStringCacheMap: QueryStringCacheMap;
  getQueryString: (absolutePath: string) => QueryStringPayload;
  setQueryStringCache: (
    absolutePath: string,
    query?: QueryStringPayload,
  ) => void;
}

export const AppContext = createContext<AppContextValue>({
  queryStringCacheMap: {},
  getQueryString: () => ({}),
  setQueryStringCache: () => {},
});
