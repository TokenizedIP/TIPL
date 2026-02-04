---
name: fork-repo
description: Fork a GitHub repo, apply TIPL license, and push changes
disable-model-invocation: true
allowed-tools: Bash(git *), Bash(gh *), Bash(npm run get-token-info), Bash(ls *), Bash(cd *), Bash(curl *), Read, Edit, Write, AskUserQuestion
---

# Fork Repo Skill

This skill forks a GitHub repository, clones it to a sibling directory, applies the TIPL license with your project's token information, and pushes the changes.

## Prerequisites

- `git` installed and configured
- `gh` CLI installed and authenticated (`gh auth status`)
- `TOKEN_ADDRESS` set in `.env` (created by `/create-token` skill)
- Write permissions to parent directory (`C:\Users\andy\cc\`)

## Workflow

Follow these steps in order:

### Step 1: Check Requirements

Verify all prerequisites are met:

```bash
git --version
```

```bash
gh auth status
```

Check that TOKEN_ADDRESS exists in `.env` by reading the file:
- Read the `.env` file in the TIPL directory
- Verify TOKEN_ADDRESS is set and has a valid format (0x followed by 40 hex characters)

If any check fails, inform the user what's missing and stop.

### Step 2: Get Repository Input

If the skill was invoked with an argument (e.g., `/fork-repo https://github.com/owner/repo`):
- Use the provided URL/name as the source repository

If no argument was provided:
- Use AskUserQuestion to ask:
  - "What repository would you like to fork?"
  - Options:
    - "Enter a GitHub repo URL or owner/repo"
    - "Create new empty repo (uses TIPL template)"
  - If user chooses "new" or "empty": Read `.env` and use EMPTY_TIPL_REPO value

### Step 3: Get New Repository Name

Use AskUserQuestion to ask the user for the new repository name:
- Default suggestion: the original repo name (extracted from the source URL)
- The user can accept the default or provide a custom name

### Step 4: Fork Repository

Get the current GitHub username:
```bash
gh api user --jq .login
```

Fork the repository with the new name:
```bash
gh repo fork <source-repo> --clone=false --fork-name <new-name>
```

If forking fails, report the error and stop.

### Step 5: Clone to Sibling Directory

Clone the fork to a sibling directory of the TIPL project:
```bash
git clone https://github.com/<username>/<new-name>.git "C:\Users\andy\cc\<new-name>"
```

The clone location should be `C:\Users\andy\cc\<new-name>` (sibling to the TIPL directory).

### Step 6: Handle Existing License

Check if the cloned repository has an existing license file:
- Look for `LICENSE.md`, `LICENSE`, or `LICENSE.txt` in the root

If a license file exists and is NOT already a TIPL license:
1. Read the existing license file
2. Move/rename it to `INITIALTERMS.md` (overwrite if INITIALTERMS.md already exists)
3. Delete the original license file

To check if it's already TIPL: look for "Tokenized IP License" or "TIPL" in the file content.

### Step 7: Get Token Info

Run the token info script to get the token symbol:
```bash
npm run get-token-info
```

**Expected output**: JSON with `address`, `symbol`, `name`, and `blockchain`

Parse the JSON output to extract:
- `symbol` - the token ticker (e.g., "TKN")
- `address` - the token contract address
- `blockchain` - should be "Base"

### Step 8: Create LICENSE.md

Read the TIPL template from `licenses/TIPL.md` in the TIPL directory.

Create `LICENSE.md` in the cloned repository with these replacements:
- Replace `[Insert Date]` with today's date (format: YYYY-MM-DD)
- Replace `[Insert token blockchain]` with the blockchain from Step 7 (e.g., "Base")
- Replace `[Insert Token Ticker]` with the symbol from Step 7
- Replace `[Insert contract address]` with the address from Step 7

Write the modified content to `C:\Users\andy\cc\<new-name>\LICENSE.md`

### Step 9: Commit and Push

Change to the cloned repository directory and commit the changes:

```bash
git -C "C:\Users\andy\cc\<new-name>" add -A
```

```bash
git -C "C:\Users\andy\cc\<new-name>" commit -m "Add TIPL license

Governed by token: Base <SYMBOL> <ADDRESS>"
```

Push to the fork:
```bash
git -C "C:\Users\andy\cc\<new-name>" push origin main
```

Note: If the default branch is not `main`, detect it first:
```bash
git -C "C:\Users\andy\cc\<new-name>" symbolic-ref refs/remotes/origin/HEAD --short
```

### Step 9.5: Submit to TIPL Dashboard

Submit the project to the TIPL dashboard database.

#### Gather Required Data

Collect the required fields (already available from previous steps):
- `token_address` - from Step 7 JSON output
- `token_symbol` - from Step 7 JSON output
- `token_name` - from Step 7 JSON output
- `treasury_address` - read `PROJECT_TREASURY` from TIPL `.env`
- `repo_url` - `https://github.com/<username>/<new-name>` from Steps 4-5

Read optional fields from TIPL `.env`:
- `uniswap_pool_address` - from `UNISWAP_POOL` (may be empty)

#### Gather Optional User Input

Use a single AskUserQuestion to collect all optional project info at once:

- **notes**: Project description (up to 5 lines of markdown). Suggest a draft based on the repository's README if available.
- **telegram**: Telegram group invite link (e.g., `https://t.me/+xxxxx`)
- **twitter_account**: Twitter/X handle (if user pastes URL like `https://x.com/username`, extract just `username`)
- **maintainer_email**: Contact email address

All fields are optional - user can skip by leaving blank or selecting "Other" with empty input.

#### Submit to API

Build JSON payload with all collected data (omit empty optional fields).

POST to the dashboard:
```bash
curl -X POST https://www.tipl.fun/api/projects \
  -H "Content-Type: application/json" \
  -d '<json-payload>'
```

If the POST fails, warn the user but continue to the summary step (non-fatal error).

### Step 10: Summary

Provide the user with a summary including:
- Fork URL: `https://github.com/<username>/<new-name>`
- Local clone path: `C:\Users\andy\cc\<new-name>`
- Token info: name, symbol, address
- Confirm LICENSE.md was created
- Confirm INITIALTERMS.md was created (if applicable)
- Confirm project was submitted to TIPL dashboard (or show warning if submission failed)

## Error Handling

- If `gh auth status` fails: User needs to run `gh auth login`
- If TOKEN_ADDRESS is missing: User needs to run `/create-token` first
- If fork already exists: Inform user and ask if they want to use the existing fork
- If clone directory already exists: Inform user and ask how to proceed
- If push fails: Check if the branch name is correct (main vs master)

## Example Usage

```
/fork-repo https://github.com/some-org/cool-project
```

Or for an empty new project:
```
/fork-repo
> Select "Create new empty repo"
> Enter repo name: "my-new-project"
```
