#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import openapiTS, { astToString } from "openapi-typescript";

const DIR = "./app/lib/services/tmdb/api";

export async function ensureDir(dir: string) {
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

const response = await fetch("https://developer.themoviedb.org/openapi/tmdb-api.json");
const typeDefinitions = astToString(await openapiTS(JSON.parse(await response.text())));
await ensureDir(DIR);
await writeFile(`${DIR}/types.ts`, typeDefinitions);
