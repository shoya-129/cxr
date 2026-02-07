
# CXR Grammar Specification

This document defines the formal grammar and syntax for the `.cxr` file format.

## Language Overview

A `.cxr` file consists of one or more **Folder** definitions. Each folder contains a set of **Rules** that determine which emails should be sorted into that folder.

The engine evaluates rules from top to bottom. The **first matching folder wins**.

---

## Basic Structure

```
Folder <FolderName>

WHEN <Condition>
THEN <Actions>
```

### Example

```text
Folder "Important"

WHEN sender contains "boss"
THEN move to "Important"
AND notify
```

---

## 1. Folder Definition

Every rule block must start with a `Folder` declaration.

- **Syntax**: `Folder <Name>`
- **Name**: Can be a simple word (`Alerts`) or a quoted string (`"My Alerts"`).

```text
Folder Personal
Folder "Work Projects"
```

---

## 2. Conditions (`WHEN`)

The `WHEN` clause defines the logic for matching an email.

### Fields
- `sender`: The email address of the sender (mapped to `from`).
- `subject`: The subject line.
- `body`: The email body content.

### Operators
- `contains`: Checks if the field contains a substring (case-insensitive).
- `IN`: Checks if the field matches any value in a list.

### Examples

**Simple Match:**
```text
WHEN subject contains "urgent"
```

**List Match:**
```text
WHEN sender IN ["mom@family.com", "dad@family.com"]
```

**Logical Operators:**
- `AND`: Both conditions must be true.
- `OR`: At least one condition must be true.
- `NOT`: The condition must be false.

**Complex Logic:**
```text
WHEN (sender contains "github" OR subject contains "login")
AND NOT sender contains "newsletter"
```

*Note: You can use parentheses `()` to group logic.*

---

## 3. Actions (`THEN`)

The `THEN` clause defines what happens when a rule matches. Multiple actions can be chained with `AND`.

### Supported Actions

| Action | Description |
| :--- | :--- |
| `move to <Folder>` | Sorts the email into the specified folder. |
| `remove from <Folder>` | (Metadata) Indicates removal from a source folder. |
| `notify` | Flags the email for a notification. |
| `call` | Flags the email for a phone call alert. |
| `remind` | Sets a reminder flag. |
| `mark as read` | Marks the email as read. |
| `mark as unread` | Marks the email as unread. |
| `auto` | Generic automation flag. |

### Example

```text
THEN move to "Finance"
AND notify
AND mark as read
```

---

## Formal EBNF Grammar

For parser implementers, here is the Extended Backus-Naur Form (EBNF) grammar:

```ebnf
program         = { folder_block } ;
folder_block    = "Folder" , identifier , { rule } ;
rule            = "WHEN" , condition_expr , "THEN" , action_list ;

condition_expr  = or_term ;
or_term         = and_term , { "OR" , and_term } ;
and_term        = not_factor , { "AND" , not_factor } ;
not_factor      = [ "NOT" ] , factor ;
factor          = "(" , condition_expr , ")" | predicate ;

predicate       = field , op_contains , string_literal
                | field , "IN" , ( string_literal | string_list ) ;

field           = "sender" | "subject" | "body" ;
op_contains     = "contains" ;

action_list     = action , { "AND" , action } ;
action          = "move to" , identifier
                | "remove from" , identifier
                | "notify"
                | "call"
                | "remind"
                | "mark as read"
                | "mark as unread"
                | "auto" ;

identifier      = ? alphanumeric string or quoted string ? ;
string_literal  = '"' , { ? characters ? } , '"' ;
string_list     = "[" , string_literal , { "," , string_literal } , "]" ;
```
