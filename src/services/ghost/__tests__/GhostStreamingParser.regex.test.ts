import { CHANGE_BLOCK_REGEX } from "../GhostStreamingParser"

describe("CHANGE_BLOCK_REGEX", () => {
	beforeEach(() => {
		CHANGE_BLOCK_REGEX.lastIndex = 0
	})

	describe("basic matching", () => {
		it("matches single-line format", () => {
			const input =
				"<change><search><![CDATA[old code]]></search><replace><![CDATA[new code]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("old code")
			expect(matches[0][2]).toBe("new code")
		})

		it("matches multi-line format with whitespace", () => {
			const input = `<change>
	<search>
		<![CDATA[old code]]>
	</search>
	<replace>
		<![CDATA[new code]]>
	</replace>
</change>`
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("old code")
			expect(matches[0][2]).toBe("new code")
		})

		it("matches format with varying whitespace", () => {
			const input =
				"<change>  <search>  <![CDATA[old]]>  </search>  <replace>  <![CDATA[new]]>  </replace>  </change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("old")
			expect(matches[0][2]).toBe("new")
		})
	})

	describe("CDATA content variations", () => {
		it("matches CDATA with newlines", () => {
			const input = `<change><search><![CDATA[line1
line2
line3]]></search><replace><![CDATA[new1
new2]]></replace></change>`
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("line1\nline2\nline3")
			expect(matches[0][2]).toBe("new1\nnew2")
		})

		it("matches CDATA with special characters", () => {
			const input =
				'<change><search><![CDATA[const x = "<>"]]></search><replace><![CDATA[const y = "[]"]]></replace></change>'
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe('const x = "<>"')
			expect(matches[0][2]).toBe('const y = "[]"')
		})

		it("matches CDATA with code containing XML-like tags", () => {
			const input =
				"<change><search><![CDATA[<div>test</div>]]></search><replace><![CDATA[<span>test</span>]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("<div>test</div>")
			expect(matches[0][2]).toBe("<span>test</span>")
		})

		it("matches CDATA with tabs and special whitespace", () => {
			const input =
				"<change><search><![CDATA[\t\tindented\r\n\tcode]]></search><replace><![CDATA[\tnew\tcode]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("\t\tindented\r\n\tcode")
			expect(matches[0][2]).toBe("\tnew\tcode")
		})

		it("matches empty CDATA sections", () => {
			const input = "<change><search><![CDATA[]]></search><replace><![CDATA[]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("")
			expect(matches[0][2]).toBe("")
		})

		it("matches CDATA with only whitespace", () => {
			const input = "<change><search><![CDATA[   \n   ]]></search><replace><![CDATA[\t\t]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("   \n   ")
			expect(matches[0][2]).toBe("\t\t")
		})
	})

	describe("CDATA with autocomplete markers", () => {
		it("matches CDATA containing autocomplete marker", () => {
			const input = `<change><search><![CDATA[
import { ApiStream } from "../transform/stream"

import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"
<<<AUTOCOMPLETE_HERE>>>
export class FeatherlessHandler extends BaseOpenAiCompatibleProvider<FeatherlessModelId> {
]]></search><replace><![CDATA[
import { ApiStream } from "../transform/stream"

import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"

export class FeatherlessHandler extends BaseOpenAiCompatibleProvider<FeatherlessModelId> {
]]></replace></change>`
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe(`
import { ApiStream } from "../transform/stream"

import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"
<<<AUTOCOMPLETE_HERE>>>
export class FeatherlessHandler extends BaseOpenAiCompatibleProvider<FeatherlessModelId> {
`)
			expect(matches[0][2]).toBe(`
import { ApiStream } from "../transform/stream"

import { BaseOpenAiCompatibleProvider } from "./base-openai-compatible-provider"

export class FeatherlessHandler extends BaseOpenAiCompatibleProvider<FeatherlessModelId> {
`)
		})
	})

	describe("multiple change blocks", () => {
		it("matches multiple consecutive change blocks", () => {
			const input = `<change><search><![CDATA[first]]></search><replace><![CDATA[1st]]></replace></change><change><search><![CDATA[second]]></search><replace><![CDATA[2nd]]></replace></change>`
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(2)
			expect(matches[0][1]).toBe("first")
			expect(matches[0][2]).toBe("1st")
			expect(matches[1][1]).toBe("second")
			expect(matches[1][2]).toBe("2nd")
		})

		it("matches change blocks separated by whitespace", () => {
			const input = `<change><search><![CDATA[a]]></search><replace><![CDATA[A]]></replace></change>

<change><search><![CDATA[b]]></search><replace><![CDATA[B]]></replace></change>`
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(2)
			expect(matches[0][1]).toBe("a")
			expect(matches[1][1]).toBe("b")
		})

		it("matches change blocks with text between them", () => {
			const input = `<change><search><![CDATA[x]]></search><replace><![CDATA[X]]></replace></change>
Some explanatory text here
<change><search><![CDATA[y]]></search><replace><![CDATA[Y]]></replace></change>`
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(2)
		})
	})

	describe("non-matching cases", () => {
		it("does not match incomplete change block", () => {
			const input = "<change><search><![CDATA[test]]></search>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(0)
		})

		it("does not match missing CDATA in search", () => {
			const input = "<change><search>test</search><replace><![CDATA[new]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(0)
		})

		it("does not match missing CDATA in replace", () => {
			const input = "<change><search><![CDATA[old]]></search><replace>new</replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(0)
		})

		it("does not match incomplete CDATA opening", () => {
			const input = "<change><search><![CDATA[test]></search><replace><![CDATA[new]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(0)
		})

		it("does not match incomplete CDATA closing", () => {
			const input = "<change><search><![CDATA[test]></search><replace><![CDATA[new]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(0)
		})

		it("does not match missing closing change tag", () => {
			const input = "<change><search><![CDATA[old]]></search><replace><![CDATA[new]]></replace>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(0)
		})

		it("does not match swapped search/replace order", () => {
			const input = "<change><replace><![CDATA[new]]></replace><search><![CDATA[old]]></search></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(0)
		})
	})

	describe("edge cases", () => {
		it("uses non-greedy matching for CDATA content", () => {
			const input = "<change><search><![CDATA[]]>]]></search><replace><![CDATA[new]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("]]>")
		})

		it("matches when CDATA contains CDATA-like strings", () => {
			const input =
				"<change><search><![CDATA[test <![CDATA[ nested ]]></search><replace><![CDATA[new]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("test <![CDATA[ nested ")
		})

		it("matches large CDATA content", () => {
			const largeContent = "x".repeat(10000)
			const input = `<change><search><![CDATA[${largeContent}]]></search><replace><![CDATA[y]]></replace></change>`
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe(largeContent)
		})

		it("matches with unicode characters", () => {
			const input =
				"<change><search><![CDATA[🚀 test 中文]]></search><replace><![CDATA[✨ new 日本語]]></replace></change>"
			const matches = [...input.matchAll(CHANGE_BLOCK_REGEX)]

			expect(matches).toHaveLength(1)
			expect(matches[0][1]).toBe("🚀 test 中文")
			expect(matches[0][2]).toBe("✨ new 日本語")
		})
	})

	describe("regex behavior", () => {
		it("resets lastIndex between uses", () => {
			const input = "<change><search><![CDATA[a]]></search><replace><![CDATA[A]]></replace></change>"

			CHANGE_BLOCK_REGEX.lastIndex = 0
			const firstMatch = CHANGE_BLOCK_REGEX.exec(input)
			expect(firstMatch).not.toBeNull()

			CHANGE_BLOCK_REGEX.lastIndex = 0
			const secondMatch = CHANGE_BLOCK_REGEX.exec(input)
			expect(secondMatch).not.toBeNull()
			expect(secondMatch![0]).toBe(firstMatch![0])
		})

		it("captures groups correctly", () => {
			const input =
				"<change><search><![CDATA[search content]]></search><replace><![CDATA[replace content]]></replace></change>"
			const match = CHANGE_BLOCK_REGEX.exec(input)

			expect(match).not.toBeNull()
			expect(match![0]).toContain("<change>")
			expect(match![1]).toBe("search content")
			expect(match![2]).toBe("replace content")
			expect(match!.length).toBe(3)
		})
	})
})
