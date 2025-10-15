#!/usr/bin/env node

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
// @ts-expect-error no types for this library
import apib2swagger from "apib2swagger";
import openapiTS, { astToString } from "openapi-typescript";

const DIR = "./app/lib/services/trakt/api";

interface OpenApiDefinition {
    paths: { [path: string]: { [method: string]: { operationId: string } } };
}

export async function ensureDir(dir: string) {
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

function deduplicate(definition: OpenApiDefinition): OpenApiDefinition {
    const operationIdCounter: Record<string, number> = {};
    const deduplicated: OpenApiDefinition = definition;

    deduplicated.paths = Object.entries(deduplicated.paths).reduce(
        (acc, [pathKey, pathValue]) => {
            const newPathValue = Object.entries(pathValue).reduce(
                (methodAcc, [methodKey, methodValue]) => {
                    const operationId = methodValue.operationId;

                    if (operationIdCounter[operationId]) {
                        const newOperationId = `${operationId} ${operationIdCounter[operationId]}`;
                        operationIdCounter[operationId]++;
                        methodValue.operationId = newOperationId;
                    } else {
                        operationIdCounter[operationId] = 1;
                    }

                    methodAcc[methodKey] = methodValue;
                    return methodAcc;
                },
                {} as OpenApiDefinition["paths"][string],
            );

            acc[pathKey] = newPathValue;
            return acc;
        },
        {} as OpenApiDefinition["paths"],
    );

    return deduplicated;
}

async function generateTypes(file: string): Promise<string> {
    const openApi = await new Promise<string>((resolve, reject) => {
        apib2swagger.convert(
            file,
            { openApi3: true },
            (error: unknown, result: { swagger: OpenApiDefinition }) => {
                if (error) reject(error);
                if (result) {
                    resolve(JSON.stringify(deduplicate(result.swagger)));
                }
            },
        );
    });

    const ast = await openapiTS(openApi);
    return astToString(ast);
}

const response = await fetch("https://trakt.docs.apiary.io/api-description-document");
const apiBlueprint = await response.text();
const typeDefinitions = await generateTypes(apiBlueprint);
await ensureDir(DIR);
await writeFile(`${DIR}/types.ts`, typeDefinitions);
