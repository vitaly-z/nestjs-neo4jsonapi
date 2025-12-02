import { Injectable } from "@nestjs/common";
import { DataModelInterface } from "../../../common/interfaces/datamodel.interface";
import { modelRegistry } from "../../../common/registries/registry";

export interface DynamicTokenResult {
  model: DataModelInterface<any>;
  fieldName: string;
  dynamicPart: string;
}

@Injectable()
export class TokenResolverService {
  constructor() {}

  /**
   * Resolves dynamic tokens from Neo4j record fields based on patterns
   * @param pattern Pattern like "{parent}_{*}" where {parent} is the parent node name and {*} is the dynamic part
   * @param parentName The parent node name (e.g., "person")
   * @param availableFields Array of field names from Neo4j record
   * @returns Array of resolved token results
   */
  resolveDynamicTokens(params: {
    pattern: string;
    parentName: string;
    availableFields: string[];
  }): DynamicTokenResult[] {
    const results: DynamicTokenResult[] = [];
    const { pattern, parentName, availableFields } = params;

    // Convert pattern to regex
    const regex = this.patternToRegex(pattern, parentName);

    for (const fieldName of availableFields) {
      const match = fieldName.match(regex);

      if (match && match.groups?.dynamicPart) {
        const dynamicPart = match.groups.dynamicPart;

        // Try to resolve the dynamic part to a model
        const model = modelRegistry.resolveModel(dynamicPart);

        if (model) {
          results.push({
            model,
            fieldName,
            dynamicPart,
          });
        }
      }
    }

    return results;
  }

  /**
   * Converts a pattern string to a regular expression
   * @param pattern Pattern like "{parent}_{*}"
   * @param parentName Actual parent name to substitute for {parent}
   * @returns RegExp for matching field names
   */
  patternToRegex(pattern: string, parentName: string): RegExp {
    // Escape special regex characters in parentName
    const escapedParentName = parentName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Replace pattern placeholders
    let regexPattern = pattern.replace(/\{parent\}/g, escapedParentName).replace(/\{\*\}/g, "(?<dynamicPart>[^_]+)"); // Capture the dynamic part

    // Escape other regex special characters that might be in the pattern
    regexPattern = regexPattern.replace(/[.*+?^${}()|[\]\\]/g, (char) => {
      // Don't escape characters we just added for our named group
      if (
        regexPattern.includes("(?<dynamicPart>") &&
        (char === "(" ||
          char === "?" ||
          char === "<" ||
          char === ">" ||
          char === ")" ||
          char === "[" ||
          char === "]" ||
          char === "+" ||
          char === "^")
      ) {
        return char;
      }
      return "\\" + char;
    });

    return new RegExp(`^${regexPattern}$`);
  }

  /**
   * Validates if a pattern is well-formed
   * @param pattern Pattern to validate
   * @returns true if valid, false otherwise
   */
  validatePattern(pattern: string): boolean {
    // Check if pattern contains required placeholders
    if (!pattern.includes("{parent}")) {
      return false;
    }

    if (!pattern.includes("{*}")) {
      return false;
    }

    // Basic validation for balanced braces
    const openBraces = (pattern.match(/\{/g) || []).length;
    const closeBraces = (pattern.match(/\}/g) || []).length;

    return openBraces === closeBraces;
  }
}
