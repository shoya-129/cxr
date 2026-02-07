
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

## Installation

```bash
npm install cxr
```

## Usage

```javascript
import cxr from "cxr";

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

## License

MIT
