// kilocode_change - new file
import { type Page } from "@playwright/test"
import { executeVSCodeCommand } from "./vscode-helpers"

/**
 * Dismisses all notifications using VSCode's "Clear All Notifications" command
 */
export async function clearNotifications(page: Page): Promise<void> {
	console.log("🔔 Clearing all notifications...")
	await executeVSCodeCommand(page, "Notifications:Clear")
}
