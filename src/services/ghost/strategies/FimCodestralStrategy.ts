import { GhostSuggestionContext } from "../types"
import { BasePromptStrategy } from "./BasePromptStrategy"
import { UseCaseType } from "../types/PromptStrategy"
import { CURSOR_MARKER } from "../ghostConstants"

/**
 * Strategy using Fill-In-the-Middle (FIM) format for Codestral
 * Uses the [SUFFIX][PREFIX] format optimized for Mistral Codestral models
 *
 * This strategy implements the FIM prompt template with special [SUFFIX] and [PREFIX] markers
 * that Codestral models are trained to understand for code completion.
 */
export class FimCodestralStrategy extends BasePromptStrategy {
	name = "FIM Codestral"
	type = UseCaseType.AUTO_TRIGGER

	canHandle(_context: GhostSuggestionContext): boolean {
		// This strategy can handle all cases when explicitly selected
		// In production, you'd add specific logic here
		return true
	}

	getSystemInstructions(): string {
		return (
			this.getBaseSystemInstructions() +
			`You are an AI assistant specialized in code completion using Fill-In-the-Middle (FIM) format.

## FIM Format Understanding
The user prompt follows the Codestral FIM format:
- [SUFFIX] marker followed by code that comes AFTER the cursor
- [PREFIX] marker followed by code that comes BEFORE the cursor
- The ${CURSOR_MARKER} marker indicates the exact cursor position

## Your Task
Generate code to fill in at the cursor position. The code should:
1. Fit naturally between the prefix and suffix
2. Follow the existing code style and patterns
3. Be syntactically correct
4. Complete the intended functionality
5. Be minimal - only complete what's necessary

## Important Rules
1. Your <search> block MUST include the ${CURSOR_MARKER} marker
2. Include sufficient context around the cursor to uniquely identify the location
3. The <replace> block should contain the complete text including your completion
4. Generate only ONE <change> block
5. Focus on the immediate completion need
6. Consider common code patterns and idioms
7. Maintain consistency with surrounding code`
		)
	}

	getUserPrompt(context: GhostSuggestionContext): string {
		if (!context.document || !context.range) {
			return "No context available for completion."
		}

		const document = context.document
		const position = context.range.start

		// Get the code before and after the cursor
		const textBeforeCursor = document.getText(
			new (context.range.constructor as any)(new (position.constructor as any)(0, 0), position),
		)
		const textAfterCursor = document.getText(
			new (context.range.constructor as any)(position, new (position.constructor as any)(document.lineCount, 0)),
		)

		// Get recent operations for additional context (from existing system)
		const recentOpsContext = this.getRecentOperationsContext(context)

		// Build the prompt using Continue's codestral format
		// Format: [SUFFIX]suffix[PREFIX]prefix with recent operations context
		let prompt = `[SUFFIX]${textAfterCursor}[PREFIX]${recentOpsContext}${textBeforeCursor}${CURSOR_MARKER}`

		return prompt
	}

	/**
	 * Get recent operations as context string from existing GhostDocumentStore
	 * Includes both current file operations and global operations from other files
	 */
	private getRecentOperationsContext(context: GhostSuggestionContext): string {
		const contextParts: string[] = []

		// Add global operations from other files first (most recent 2)
		if (context.globalRecentOperations && context.globalRecentOperations.length > 0) {
			const globalOps = context.globalRecentOperations
				.slice(0, 2)
				.map((op) => {
					const filename = op.filepath.split("/").pop() || op.filepath
					return `// Recent in ${filename}: ${op.description}\n${op.content || ""}`
				})
				.join("\n\n")

			if (globalOps) {
				contextParts.push(globalOps)
			}
		}

		// Add current file operations (most recent 2)
		if (context.recentOperations && context.recentOperations.length > 0) {
			const currentFileOps = context.recentOperations
				.slice(0, 2)
				.map((op) => {
					return `// Recent: ${op.description}\n${op.content || ""}`
				})
				.join("\n\n")

			if (currentFileOps) {
				contextParts.push(currentFileOps)
			}
		}

		return contextParts.length > 0 ? `${contextParts.join("\n\n")}\n\n` : ""
	}
}
