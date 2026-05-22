import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const cassetteRoot = path.join(__dirname, "..", "cassettes");

export const sortJson = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, sortJson(nested)])
    );
  }
  return value;
};

const cassetteFile = (scenario: string, fileName: string) =>
  path.join(cassetteRoot, scenario, fileName);

export const writeScenarioCassette = async (
  scenario: string,
  layers: Record<string, unknown>
) => {
  await Promise.all(
    Object.entries(layers).map(async ([fileName, payload]) => {
      await mkdir(path.dirname(cassetteFile(scenario, fileName)), {
        recursive: true
      });
      await writeFile(
        cassetteFile(scenario, fileName),
        `${JSON.stringify(sortJson(payload), null, 2)}\n`,
        "utf8"
      );
    })
  );
};

export const readScenarioLayer = async (scenario: string, fileName: string) =>
  JSON.parse(await readFile(cassetteFile(scenario, fileName), "utf8"));

export const scenarioExists = async (
  scenario: string,
  fileName: string
): Promise<boolean> => {
  try {
    await readFile(cassetteFile(scenario, fileName), "utf8");
    return true;
  } catch {
    return false;
  }
};
