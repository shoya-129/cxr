
# CXR Language Support

This extension adds syntax highlighting and language support for **CXR** files (`.cxr`), used by the **CXR Email Rule Engine**.

## Features

- **Syntax Highlighting**: Recognizes all CXR keywords (`Folder`, `WHEN`, `THEN`), operators, and fields.
- **Bracket Matching**: Helps you keep your rules organized.
- **Colorization**: Distinct colors for actions, conditions, strings, and folder names.

## Usage

1. Open a `.cxr` file.
2. The syntax should automatically highlight.
3. If not, click the language mode in the bottom right corner and select `CXR`.

## Example

```cxr
Folder "Important"
WHEN sender contains "boss"
THEN move to "Important"
AND notify
```

## Contributing

See the [GitHub Repository](https://github.com/cxr-project/cxr) for more details.
