import { describe, it, expect, vi, beforeEach } from "vitest"
import { GhostProfileManager } from "../GhostProfileManager"
import { ProviderSettingsManager } from "../../../core/config/ProviderSettingsManager"
import { DEFAULT_GHOST_STRATEGY_ID } from "../../../shared/ghost-strategies"

describe("GhostProfileManager", () => {
	let mockProviderSettingsManager: ProviderSettingsManager

	beforeEach(() => {
		vi.clearAllMocks()
		mockProviderSettingsManager = {
			listConfig: vi.fn(),
		} as any
	})

	describe("createGhostProfileFromSettings", () => {
		it("should create profile with custom ghost strategy ID and auto-selected API config", async () => {
			const mockApiConfigs = [
				{
					id: "mistral-config",
					name: "Mistral Config",
					apiProvider: "mistral",
				},
			]

			mockProviderSettingsManager.listConfig = vi.fn().mockResolvedValue(mockApiConfigs)

			const settings = {
				ghostStrategyId: "xml-default",
			}

			const result = await GhostProfileManager.createGhostProfileFromSettings(
				settings,
				mockProviderSettingsManager,
			)

			expect(result).toEqual({
				id: "default",
				name: "Auto-Selected (mistral)",
				apiConfigId: "mistral-config",
				strategyId: "xml-default",
			})
		})

		it("should use default strategy when no ghost strategy ID provided", async () => {
			const mockApiConfigs = [
				{
					id: "kilocode-config",
					name: "Kilocode Config",
					apiProvider: "kilocode",
				},
			]

			mockProviderSettingsManager.listConfig = vi.fn().mockResolvedValue(mockApiConfigs)

			const settings = {}

			const result = await GhostProfileManager.createGhostProfileFromSettings(
				settings,
				mockProviderSettingsManager,
			)

			expect(result).toEqual({
				id: "default",
				name: "Auto-Selected (kilocode)",
				apiConfigId: "kilocode-config",
				strategyId: DEFAULT_GHOST_STRATEGY_ID,
			})
		})

		it("should fallback to default strategy for invalid ghost strategy ID", async () => {
			const mockApiConfigs = [
				{
					id: "openrouter-config",
					name: "OpenRouter Config",
					apiProvider: "openrouter",
				},
			]

			mockProviderSettingsManager.listConfig = vi.fn().mockResolvedValue(mockApiConfigs)

			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

			const settings = {
				ghostStrategyId: "invalid-strategy",
			}

			const result = await GhostProfileManager.createGhostProfileFromSettings(
				settings,
				mockProviderSettingsManager,
			)

			expect(result).toEqual({
				id: "default",
				name: "Auto-Selected (openrouter)",
				apiConfigId: "openrouter-config",
				strategyId: DEFAULT_GHOST_STRATEGY_ID,
			})

			expect(consoleSpy).toHaveBeenCalledWith(
				"Invalid Ghost Strategy ID: invalid-strategy, falling back to default",
			)

			consoleSpy.mockRestore()
		})

		it("should prioritize supported providers in correct order", async () => {
			const mockApiConfigs = [
				{
					id: "openrouter-config",
					name: "OpenRouter Config",
					apiProvider: "openrouter",
				},
				{
					id: "mistral-config",
					name: "Mistral Config",
					apiProvider: "mistral",
				},
				{
					id: "kilocode-config",
					name: "Kilocode Config",
					apiProvider: "kilocode",
				},
			]

			mockProviderSettingsManager.listConfig = vi.fn().mockResolvedValue(mockApiConfigs)

			const settings = {
				ghostStrategyId: "xml-default",
			}

			const result = await GhostProfileManager.createGhostProfileFromSettings(
				settings,
				mockProviderSettingsManager,
			)

			// Should select mistral (first in SUPPORTED_DEFAULT_PROVIDERS order)
			expect(result).toEqual({
				id: "default",
				name: "Auto-Selected (mistral)",
				apiConfigId: "mistral-config",
				strategyId: "xml-default",
			})
		})

		it("should filter out unsupported providers", async () => {
			const mockApiConfigs = [
				{
					id: "unsupported-config",
					name: "Unsupported Config",
					apiProvider: "unsupported-provider",
				},
				{
					id: "mistral-config",
					name: "Mistral Config",
					apiProvider: "mistral",
				},
			]

			mockProviderSettingsManager.listConfig = vi.fn().mockResolvedValue(mockApiConfigs)

			const settings = {}

			const result = await GhostProfileManager.createGhostProfileFromSettings(
				settings,
				mockProviderSettingsManager,
			)

			// Should select mistral and ignore the unsupported provider
			expect(result).toEqual({
				id: "default",
				name: "Auto-Selected (mistral)",
				apiConfigId: "mistral-config",
				strategyId: DEFAULT_GHOST_STRATEGY_ID,
			})
		})

		it("should throw error when no valid API profiles found", async () => {
			mockProviderSettingsManager.listConfig = vi.fn().mockResolvedValue([])

			const settings = {}

			await expect(
				GhostProfileManager.createGhostProfileFromSettings(settings, mockProviderSettingsManager),
			).rejects.toThrow("No valid API profiles found for ghost. Please configure an API provider.")
		})

		it("should throw error when only unsupported providers are available", async () => {
			const mockApiConfigs = [
				{
					id: "unsupported-config",
					name: "Unsupported Config",
					apiProvider: "unsupported-provider",
				},
			]

			mockProviderSettingsManager.listConfig = vi.fn().mockResolvedValue(mockApiConfigs)

			const settings = {}

			await expect(
				GhostProfileManager.createGhostProfileFromSettings(settings, mockProviderSettingsManager),
			).rejects.toThrow("No valid API profiles found for ghost. Please configure an API provider.")
		})
	})
})
