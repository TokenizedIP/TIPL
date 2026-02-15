# rename-fork

Edit the README.md in the current directory to add a new project name and goals at the top, pushing existing content below.

This is for repositories forked from an existing open source project that need their own identity and goals.

## Steps

1. Look for a README.md file in the current directory. If one does not exist, create one.
2. Ask the user for the name of the new project.
3. Chat with the user to find out the goals for the new project. The user can type a response, or paste in a document or a link. Summarize any document or link content into a list of goals.
4. Confirm the name and the list of goals with the user before making changes.
5. Write new content at the top of the README.md, pushing existing content below it.

## New content format

The new section should have a header: `# <project name> Overview`

Under the header, list the project goals. If the project is a fork of an existing project, the first two goals must always be:

- Contribute to the source project (refer to the source project by name)
- Accelerate development with AI and user contributions

Additional goals from the user follow after these.
