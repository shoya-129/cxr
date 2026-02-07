
import { Parser } from './parser.js';
import { Lexer } from './lexer.js';

export class Executor {
    constructor() {
    }


    static processedEmails = new Set();

    static reset() {
        this.processedEmails.clear();
    }

    static execute(rulesContent, emails, schema = {}) {
        // 1. Lex & Parse
        const lexer = new Lexer(rulesContent);
        const tokens = lexer.tokenize();
        const parser = new Parser(tokens);
        const ast = parser.parse();

        // Sort folders by Priority (descending) -> File Order (stable)
        // Since JS sort is stable, we just sort by priority.
        ast.folders.sort((a, b) => (b.priority || 0) - (a.priority || 0));

        // 2. Prepare Output Structures
        const folders = {
            Inbox: []
        };
        const actionsLog = [];
        let ruleCount = 0;

        // Initialize folder buckets
        for (const folder of ast.folders) {
            // Ensure folder buckets exist, even if empty
            if (!folders[folder.name]) {
                folders[folder.name] = [];
            }
            ruleCount += folder.rules.length;
        }

        const customSchema = {
            sender: 'from',
            subject: 'subject',
            body: 'body',
            ...schema
        };

        // 3. Process Emails
        for (const email of emails) {
            let matched = false;
            let targetFolder = 'Inbox';
            let emailActions = [];
            let matchedFolderName = null;

            // Check if already processed
            if (Executor.processedEmails.has(email.id)) {
                continue;
            }

            // Iterate Folders
            for (const folder of ast.folders) {
                // Iterate Rules in Folder
                for (const rule of folder.rules) {
                    if (Executor.evaluateCondition(rule.condition, email, customSchema)) {
                        matched = true;
                        matchedFolderName = folder.name;

                        // Execute Actions
                        for (const actionNode of rule.actions) {
                            if (actionNode.action === 'move') {
                                targetFolder = actionNode.target;
                            }
                            // Add to log
                            emailActions.push(Executor.serializeAction(actionNode));
                        }
                        break; // Stop checking rules in this folder
                    }
                }
                if (matched) break; // Stop checking other folders (First matching folder wins)
            }

            // Assign to bucket
            if (!folders[targetFolder]) {
                folders[targetFolder] = [];
            }
            folders[targetFolder].push(email);

            // Log actions if matched
            if (matched) {
                Executor.processedEmails.add(email.id);
                actionsLog.push({
                    emailId: email.id,
                    folder: matchedFolderName,
                    actions: emailActions
                });
            }
        }

        return {
            folders,
            actionsLog,
            meta: {
                engine: "cxr",
                version: "1.0.0",
                processedAt: Date.now(),
                ruleCount,
                emailCount: emails.length
            }
        };
    }

    static evaluateCondition(node, email, schema) {
        switch (node.type) {
            case 'BinaryExpression':
                if (node.operator === 'AND') {
                    return Executor.evaluateCondition(node.left, email, schema) && Executor.evaluateCondition(node.right, email, schema);
                } else if (node.operator === 'OR') {
                    return Executor.evaluateCondition(node.left, email, schema) || Executor.evaluateCondition(node.right, email, schema);
                }
                throw new Error(`Unknown binary operator: ${node.operator}`);

            case 'UnaryExpression':
                if (node.operator === 'NOT') {
                    return !Executor.evaluateCondition(node.argument, email, schema);
                }
                throw new Error(`Unknown unary operator: ${node.operator}`);

            case 'Predicate':
                return Executor.evaluatePredicate(node, email, schema);

            case 'InPredicate':
                return Executor.evaluateInPredicate(node, email, schema);

            default:
                throw new Error(`Unknown condition node type: ${node.type}`);
        }
    }

    static evaluatePredicate(node, email, schema) {
        const fieldName = schema[node.field] || node.field;
        const value = (email[fieldName] || '').toString().toLowerCase();

        if (node.operator === 'contains') {
            const targets = Array.isArray(node.value) ? node.value : [node.value];
            return targets.some(target => value.includes(target.toLowerCase()));
        }
        return false;
    }

    static evaluateInPredicate(node, email, schema) {
        const fieldName = schema[node.field] || node.field;
        const value = (email[fieldName] || '').toString();
        const targets = node.value; // Array of strings

        const lowerValue = value.toLowerCase();
        // Check if value includes any of the target strings (case-insensitive)
        return targets.some(target => lowerValue.includes(target.toLowerCase()));
    }

    static serializeAction(actionNode) {
        switch (actionNode.action) {
            case 'move': return `move to ${actionNode.target}`;
            case 'remove': return `remove from ${actionNode.target}`;
            case 'notify': return 'notify';
            case 'call': return 'call';
            case 'remind': return 'remind';
            case 'mark_read': return 'mark as read';
            case 'mark_unread': return 'mark as unread';
            case 'auto': return 'auto';
            default: return actionNode.action;
        }
    }
}
