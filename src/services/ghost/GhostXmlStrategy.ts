import { GhostSuggestionContext } from "./types"
import { GhostStreamingParser, StreamingParseResult } from "./GhostStreamingParser"
import { PromptGenerator } from "./types/PromptGenerator"
import { UserRequestPromptGenerator } from "./strategies/UserRequestPromptGenerator"

export class GhostXmlStrategy {
	private streamingParser: GhostStreamingParser
	private promptGenerator: PromptGenerator
	private debug: boolean

	constructor(options?: { debug: boolean }) {
		this.streamingParser = new GhostStreamingParser()
		this.promptGenerator = new UserRequestPromptGenerator()
		this.debug = options?.debug ?? false
	}

	/**
	 * Get the system prompt based on context using the new strategy system
	 * Overloaded to support both new context-based and legacy string-only calls
	 */
	getSystemPrompt(): string {
		return this.promptGenerator.getSystemInstructions()
	}

	/**
	 * Get the user prompt based on context using the new strategy system
	 * @param context The suggestion context
	 * @returns The user prompt
	 */
	getUserPrompt(context: GhostSuggestionContext): string {
		return this.promptGenerator.getUserPrompt(context)
	}

	/**
	 * Initialize streaming parser for incremental parsing
	 */
	public initializeStreamingParser(context: GhostSuggestionContext): void {
		this.streamingParser.initialize(context)
	}

	/**
	 * Process a chunk of streaming response and return any newly completed suggestions
	 */
	public processStreamingChunk(chunk: string): StreamingParseResult {
		return this.streamingParser.processChunk(chunk)
	}

	/**
	 * Reset the streaming parser for a new parsing session
	 */
	public resetStreamingParser(): void {
		this.streamingParser.reset()
	}

	/**
	 * Finish the streaming parser and apply sanitization if needed
	 */
	public finishStreamingParser(): StreamingParseResult {
		return this.streamingParser.finishStream()
	}

	/**
	 * Get the current buffer content from the streaming parser (for debugging)
	 */
	public getStreamingBuffer(): string {
		return this.streamingParser.getBuffer()
	}

	/**
	 * Get completed changes from the streaming parser (for debugging)
	 */
	public getStreamingCompletedChanges() {
		return this.streamingParser.getCompletedChanges()
	}
}
