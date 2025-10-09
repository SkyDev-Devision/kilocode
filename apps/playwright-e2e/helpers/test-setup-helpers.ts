// kilocode_change - new file
import { type Page } from "@playwright/test"
import { waitForWebviewText, configureApiKeyThroughUI } from "./webview-helpers"
import { verifyExtensionInstalled, waitForAllExtensionActivation } from "./vscode-helpers"
import { clearNotifications } from "./notification-helpers"

export async function setupTestEnvironment(page: Page): Promise<void> {
	await waitForAllExtensionActivation(page)

	await verifyExtensionInstalled(page)
	await waitForWebviewText(page, "Welcome to Kilo Code!")

	await configureApiKeyThroughUI(page)
	await waitForWebviewText(page, "Generate, refactor, and debug code with AI assistance")

	await clearNotifications(page)
}
