
const vscode = require('vscode');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    // Provide generic completions for .cxr files
    const provider = vscode.languages.registerCompletionItemProvider('cxr', {
        provideCompletionItems(document, position, token, context) {

            // 1. Keywords
            const keywords = [
                'Folder', 'WHEN', 'THEN',
                'AND', 'OR', 'NOT',
                'IN', 'contains'
            ];
            const keywordItems = keywords.map(kw => {
                const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
                return item;
            });

            // 2. Actions (Functions)
            const actions = [
                'move to', 'remove from', 'notify', 'call',
                'remind', 'mark as read', 'mark as unread', 'auto'
            ];
            const actionItems = actions.map(act => {
                const item = new vscode.CompletionItem(act, vscode.CompletionItemKind.Function);
                item.detail = "Action";
                return item;
            });

            // 3. Fields (Variables)
            const fields = ['sender', 'subject', 'body'];
            const fieldItems = fields.map(f => {
                const item = new vscode.CompletionItem(f, vscode.CompletionItemKind.Field);
                item.detail = "Email Field";
                return item;
            });

            // 4. Snippets matches "Folder" logic
            const ruleSnippet = new vscode.CompletionItem('New Rule Block', vscode.CompletionItemKind.Snippet);
            ruleSnippet.detail = "Template for a new Folder rule";
            ruleSnippet.insertText = new vscode.SnippetString(
                'Folder "${1:FolderName}"\n\nWHEN ${2:sender} contains "${3:value}"\nTHEN move to "${1:FolderName}"\nAND ${4:notify}'
            );

            // Snippet for just a condition
            const conditionSnippet = new vscode.CompletionItem('Condition Block', vscode.CompletionItemKind.Snippet);
            conditionSnippet.detail = "Template for WHEN clause";
            conditionSnippet.insertText = new vscode.SnippetString(
                'WHEN ${1:sender} contains "${2:value}"'
            );

            return [
                ...keywordItems,
                ...actionItems,
                ...fieldItems,
                ruleSnippet,
                conditionSnippet
            ];
        }
    });

    context.subscriptions.push(provider);
}

function deactivate() { }

module.exports = {
    activate,
    deactivate
}
