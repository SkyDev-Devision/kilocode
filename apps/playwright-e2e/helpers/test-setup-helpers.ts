import { type Page } from "@playwright/test"
import { waitForWebviewText, configureApiKeyThroughUI, findWebview } from "./webview-helpers"
import { verifyExtensionInstalled, waitForAllExtensionActivation } from "./vscode-helpers"

/**
 * Freezes all GIFs on the page by converting them to static PNG images.
 * Also sets up a MutationObserver to handle dynamically added GIFs.
 * Works inside the VSCode extension webview iframe.
 */
export async function freezeGifs(page: Page): Promise<void> {
	await page.emulateMedia({ reducedMotion: "reduce" })

	// Get the webview frame to work inside the extension iframe
	const webviewFrame = await findWebview(page)

	await webviewFrame.locator("body").evaluate(() => {
		// Function to freeze a single GIF
		const freezeGif = (img: HTMLImageElement) => {
			if (!img.src.toLowerCase().includes(".gif")) return
			if (img.dataset.gifFrozen === "true") return // Already processed

			const canvas = document.createElement("canvas")
			const ctx = canvas.getContext("2d")
			if (!ctx) return

			const frame = new Image()
			frame.crossOrigin = "anonymous"
			frame.onload = () => {
				canvas.width = frame.naturalWidth || frame.width
				canvas.height = frame.naturalHeight || frame.height
				ctx.drawImage(frame, 0, 0)
				img.src = canvas.toDataURL("image/png")
				img.dataset.gifFrozen = "true"
			}
			frame.onerror = () => {
				// Fallback: just mark as processed to avoid infinite loops
				img.dataset.gifFrozen = "true"
			}
			frame.src = img.src
		}

		// Freeze existing GIFs in the webview
		document.querySelectorAll('img[src*=".gif"]').forEach((img) => {
			freezeGif(img as HTMLImageElement)
		})

		// Set up observer for dynamically added GIFs
		const observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const element = node as Element

						// Check if the added node is an img with GIF
						if (element.tagName === "IMG") {
							const img = element as HTMLImageElement
							if (img.src.toLowerCase().includes(".gif") && !img.dataset.gifFrozen) {
								freezeGif(img)
							}
						}

						// Check for GIF images within the added node
						element.querySelectorAll('img[src*=".gif"]').forEach((img) => {
							const gifImg = img as HTMLImageElement
							if (!gifImg.dataset.gifFrozen) {
								freezeGif(gifImg)
							}
						})
					}
				})

				// Handle attribute changes (src changes)
				if (mutation.type === "attributes" && mutation.attributeName === "src") {
					const img = mutation.target as HTMLImageElement
					if (img.tagName === "IMG" && img.src.toLowerCase().includes(".gif") && !img.dataset.gifFrozen) {
						freezeGif(img)
					}
				}
			})
		})

		// Start observing the webview document
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["src"],
		})

		// Store observer reference for potential cleanup
		;(window as any).__gifFreezeObserver = observer
	})
}

export async function setupTestEnvironment(page: Page): Promise<void> {
	await waitForAllExtensionActivation(page)

	await verifyExtensionInstalled(page)
	await waitForWebviewText(page, "Welcome to Kilo Code!")

	await configureApiKeyThroughUI(page)
	await waitForWebviewText(page, "Generate, refactor, and debug code with AI assistance")
}
