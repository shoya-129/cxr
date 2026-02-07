
# CXR - Email Rule eXecutor

**CXR** is a production-ready, open-source rule engine / compiler for email filtering logic, written in JavaScript (Node.js, ESM).
It parses a custom `.cxr` domain language and executes deterministically against normalized email objects.

## Features

- **Safe**: No `eval`, no `Function`, purely AST-based execution.
- **Deterministic**: Input -> Output is always the same.
- **Explainable**: Returns metadata and logs of all actions taken.
- **Extensible**: Pure JSON output format.
- **Zero Dependencies**: Lightweight and fast.
- **Flexible Loading**: Load rules from strings, files (`.cxr`), or combine multiple sources.

## Rule Execution Model

**Single-Execution Guarantee**:
- Each email is evaluated once per run.
- At most one rule may apply to an email.
- Once a rule matches, the email is assigned to that folder and its actions are logged. No other rules are checked for that email.

**State & Deduplication**:
- The engine maintains a set of processed email IDs.
- Re-running the engine without resetting state will **ignore** already-processed emails.
- Use `cxr.reset()` to clear this state and re-process emails.

## Rule Priority

You can explicitly set the priority of a folder. Higher priority folders are evaluated first.

```cxr
Folder Important priority 100
WHEN sender contains "boss" THEN move to Important

Folder Work priority 50
WHEN subject contains "meeting" THEN move to Work
```

- Default priority is 0.
- If priorities are equal, file order is preserved.

## List Syntax

Conditions support lists for checking multiple values concisely.

```cxr
WHEN subject contains ["urgent", "asap", "alert"]
THEN move to HighPriority

WHEN sender IN ["github.com", "gitlab.com", "bitbucket.org"]
THEN move to Dev
```

- `contains [a, b]`: Matches if the field contains *any* of the strings.
- `IN [a, b]`: Matches if the field contains *any* of the strings (same behavior as contains for now).

## Installation

```bash
npm install @ezetgalaxy/cxr
```

## Usage

```javascript
import cxr from "@ezetgalaxy/cxr";

// 1. Prepare email objects
const emails = [
    {
        id: "1",
        from: "notifications@github.com",
        subject: "New login from Chrome",
        body: "...",
        unread: true,
        receivedAt: Date.now()
    }
];

// 2. Execute using file path
const result = cxr.init({
    rules: "./rules/alerts.cxr", // Path to .cxr file
    emails
});

// Or combine multiple files/strings
const resultCombined = cxr.init({
    rules: [
        "./rules/alerts.cxr", 
        "./rules/personal.cxr",
        `Folder Temporary WHEN subject contains "urgent" THEN notify`
    ],
    emails
});


console.log("Folders:", result.folders);
console.log("Actions Log:", result.actionsLog);
```

## Output Example

The `result` object is pure JSON, making it easy to consume:

```json
{
  "folders": {
    "Inbox": [],
    "Alerts": [
      {
        "id": "1",
        "from": "notifications@github.com",
        "subject": "New login from Chrome",
        "unread": true
      }
    ]
  },
  "actionsLog": [
    {
      "emailId": "1",
      "folder": "Alerts",
      "actions": ["move to Alerts", "notify", "mark as unread"]
    }
  ],
  "meta": {
    "engine": "cxr",
    "version": "1.0.0",
    "processedAt": 1700000000000,
    "ruleCount": 5,
    "emailCount": 1
  }
}
```

## UI Integration Example (React)

Because CXR returns structured data, building a UI is straightforward.

```jsx
import React from 'react';
import cxr from 'cxr';

function EmailClient({ rules, rawEmails }) {
  // 1. Run the engine
  const { folders } = cxr.init({ rules, emails: rawEmails });

  return (
    <div className="email-client">
      {Object.entries(folders).map(([folderName, emails]) => (
        <div key={folderName} className="folder">
          <h3>📂 {folderName} <span className="count">({emails.length})</span></h3>
          
          <ul className="email-list">
            {emails.map(email => (
              <li key={email.id} className={email.unread ? 'unread' : ''}>
                <span className="sender">{email.from}</span>
                <span className="subject">{email.subject}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```


## Language Syntax

See [GRAMMAR.md](./grammar.md) for full specification.

### File Extension

```
.cxr
```

### Example Rule File (`alerts.cxr`)

```
Folder Alerts

WHEN sender contains "github"
OR subject contains "login"
AND NOT sender contains "newsletter"

THEN move to Alerts
AND notify
AND mark as unread

Folder Personal

WHEN sender IN ["mom@family.com", "dad@family.com"]
THEN move to Personal
AND mark as read
```

## API

### `cxr.init(config)`

- `config.rules` (string | string[]): 
    - A string containing rule content.
    - A string containing a file path (must end in `.cxr`).
    - An array of strings (content or file paths).

- `config.emails` (Array): List of email objects.
    - Each email must have: `id`, `from`, `subject`, `body`, `unread`, `receivedAt` (by default).
- `config.schema` (Object, optional): Custom field mapping.
    - Maps rule field names (e.g., `sender`) to your email object keys (e.g., `from_address`).
    - Default: `{ sender: 'from', subject: 'subject', body: 'body' }`

### Custom Schema Example

If your email objects look different, you can map the fields:

```javascript
/* Email Object:
{
  id: '1',
  author: 'admin@site.com', // Instead of 'from'
  content: 'Text...',       // Instead of 'body'
  'X-Priority': 'High'      // Custom header
}
*/

/* Rule:
Folder Urgent
WHEN priority contains "High" AND sender contains "admin"
THEN move to Urgent
*/

cxr.init({
  rules: rules,
  emails: myEmails,
  schema: {
    sender: 'author',
    body:   'content',
    priority: 'X-Priority'
  }
});
```


Returns an object with:
- `folders`: Mapping of folder names to arrays of matched emails.

- `actionsLog`: Array of action records per email.
- `meta`: Execution metadata (engine name: "cxr").

## VS Code Extension

Included in this repository is a VS Code extension for `.cxr` files.

**Features:**
- Syntax Highlighting for Keywords, Actions, and Fields.
- Autocomplete / IntelliSense for rule structures.
- Snippets for quick rule creation.


**Installation (Manual):**
1.  **Download**: Get the `cxr-language-support-0.0.1.vsix` file from this repository.
2.  **Open VS Code / Cursor**:
    - Go to the **Extensions View** (Ctrl+Shift+X).
    - Click the **... (More Actions)** menu (top right of the pane).
    - Select **Install from VSIX...**.
3.  **Select File**: Choose the `.vsix` file you downloaded.
4.  **Restart**: Reload the window to activate full support.

*Note: This extension is not yet published to the Visual Studio Marketplace so it will not appear in search results.*


## License

ISC
