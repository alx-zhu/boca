import { validateSpec, type ValidationResult } from "./validateSpec";

export function runChartBuilder(input: unknown): ValidationResult {
  return validateSpec(input);
}
