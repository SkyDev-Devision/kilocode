import { ToolArgs } from "./types"

export function getExecuteCommandDescription(args: ToolArgs): string | undefined {
	return `## execute_command
Description: Request to execute a CLI command on the system. Use this when you need to perform system operations or run specific commands to accomplish any step in the user's task. You must tailor your command to the user's system and provide a clear explanation of what the command does. For command chaining, use the appropriate chaining syntax for the user's shell. Prefer to execute complex CLI commands over creating executable scripts, as they are more flexible and easier to run. Prefer relative commands and paths that avoid location sensitivity for terminal consistency, e.g: \`touch ./testdata/example.file\`, \`dir ./examples/model1/data/yaml\`, or \`go test ./cmd/front --config ./cmd/front/config.yml\`. Critically, use the 'cwd' parameter instead of 'cd directory && command'.**

Parameters:
- cwd: (optional) Working directory to execute the command in (default: ${args.cwd})
- command: (required) The CLI command to execute a valid for the current operating system. Ensure the command is properly formatted and does not contain any harmful instructions. Use cwd param instead of starting w/ 'cd' or 'chdir'
Usage:
<execute_command>
<command>Your command here</command>
<cwd>Working directory path (optional)</cwd>
</execute_command>

Example: Request to execute npm run dev in a subdirectory
<execute_command>
<command>npm run dev</command>
<cwd>./frontend</cwd>
</execute_command>

Example: Requesting to execute ls in a specific directory if directed
<execute_command>
<command>ls -la</command>
<cwd>/home/user/projects</cwd>
</execute_command>`
}
