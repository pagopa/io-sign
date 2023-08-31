"use client";

import { createContext } from "react";

import { ApiKey } from "./index";

export const ApiKeyContext = createContext<ApiKey | undefined>(undefined);
