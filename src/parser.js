
import { TokenType } from './lexer.js';

export class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.pos = 0;
    }

    parse() {
        const folders = [];
        while (this.peek().type !== TokenType.EOF) {
            if (this.peek().type === TokenType.FOLDER) {
                folders.push(this.parseFolder());
            } else {
                throw this.error(`Expected 'Folder' declaration, found ${this.peek().value}`);
            }
        }
        return { type: 'Program', folders };
    }

    parseFolder() {
        this.consume(TokenType.FOLDER);
        const name = this.parseTarget();

        let priority = 0;
        if (this.match(TokenType.PRIORITY)) {
            const prioToken = this.consume(TokenType.IDENTIFIER, "Expected priority value");
            priority = parseInt(prioToken.value, 10);
            if (isNaN(priority)) {
                throw this.error(`Invalid priority value: ${prioToken.value}`);
            }
        }

        const rules = [];
        while (this.peek().type === TokenType.WHEN) {
            rules.push(this.parseRule());
        }

        if (rules.length === 0) {
            throw this.error(`Folder '${name}' must have at least one rule.`);
        }

        return { type: 'Folder', name, rules, priority };
    }

    parseRule() {
        this.consume(TokenType.WHEN);
        const condition = this.parseCondition();

        this.consume(TokenType.THEN);
        const actions = this.parseActions();

        return { type: 'Rule', condition, actions };
    }

    parseCondition() {
        return this.parseOr();
    }

    parseOr() {
        let left = this.parseAnd();

        while (this.match(TokenType.OR)) {
            const right = this.parseAnd();
            left = {
                type: 'BinaryExpression',
                operator: 'OR',
                left,
                right
            };
        }
        return left;
    }

    parseAnd() {
        let left = this.parseNot();

        while (this.match(TokenType.AND)) {
            const right = this.parseNot();
            left = {
                type: 'BinaryExpression',
                operator: 'AND',
                left,
                right
            };
        }
        return left;
    }

    parseNot() {
        if (this.match(TokenType.NOT)) {
            return {
                type: 'UnaryExpression',
                operator: 'NOT',
                argument: this.parseNot()
            };
        }
        return this.parseFactor();
    }

    parseFactor() {
        if (this.match(TokenType.LPAREN)) {
            const expr = this.parseCondition();
            this.consume(TokenType.RPAREN, "Expected ')'");
            return expr;
        }

        const field = this.parseField();

        if (this.match(TokenType.CONTAINS)) {
            let val;
            if (this.match(TokenType.LBRACKET)) {
                const values = [];
                do {
                    const v = this.consume(TokenType.STRING, "Expected string in list").value;
                    values.push(v);
                } while (this.match(TokenType.COMMA));
                this.consume(TokenType.RBRACKET, "Expected ']'");
                val = values;
            } else {
                val = this.consume(TokenType.STRING, "Expected string literal or list after 'contains'").value;
            }
            return {
                type: 'Predicate',
                field: field.value,
                operator: 'contains',
                value: val
            };
        }

        if (this.match(TokenType.IN)) {
            if (this.peek().type === TokenType.STRING) {
                const val = this.consume(TokenType.STRING).value;
                return {
                    type: 'InPredicate',
                    field: field.value,
                    value: [val]
                };
            } else if (this.match(TokenType.LBRACKET)) {
                const values = [];
                do {
                    const val = this.consume(TokenType.STRING, "Expected string in list").value;
                    values.push(val);
                } while (this.match(TokenType.COMMA));
                this.consume(TokenType.RBRACKET, "Expected ']'");
                return {
                    type: 'InPredicate',
                    field: field.value,
                    value: values
                };
            } else {
                throw this.error("Expected string or list after 'IN'");
            }
        }

        throw this.error(`Unexpected token in condition: ${this.peek().value}`);
    }

    parseField() {
        if (this.check(TokenType.FIELD_SENDER) ||
            this.check(TokenType.FIELD_SUBJECT) ||
            this.check(TokenType.FIELD_BODY) ||
            this.check(TokenType.IDENTIFIER)) {
            return this.advance();
        }
        throw this.error("Expected field (sender, subject, body, or custom field)");
    }

    parseActions() {
        const actions = [];
        actions.push(this.parseAction());

        while (this.match(TokenType.AND)) {
            actions.push(this.parseAction());
        }
        return actions;
    }

    parseTarget() {
        if (this.check(TokenType.IDENTIFIER) || this.check(TokenType.STRING)) {
            return this.advance().value;
        }
        throw this.error("Expected folder name (identifier or string)");
    }

    parseAction() {
        const token = this.peek();

        if (this.match(TokenType.KW_MOVE)) {
            this.consume(TokenType.KW_TO, "Expected 'to' after 'move'");
            const folder = this.parseTarget();
            return { type: 'Action', action: 'move', target: folder };
        }

        if (this.match(TokenType.KW_REMOVE)) {
            this.consume(TokenType.KW_FROM, "Expected 'from' after 'remove'");
            const folder = this.parseTarget();
            return { type: 'Action', action: 'remove', target: folder };
        }

        if (this.match(TokenType.KW_NOTIFY)) {
            return { type: 'Action', action: 'notify' };
        }

        if (this.match(TokenType.KW_CALL)) {
            return { type: 'Action', action: 'call' };
        }

        if (this.match(TokenType.KW_REMIND)) {
            return { type: 'Action', action: 'remind' };
        }

        if (this.match(TokenType.KW_AUTO)) {
            return { type: 'Action', action: 'auto' };
        }

        if (this.match(TokenType.KW_MARK)) {
            if (this.match(TokenType.KW_AS)) {
                if (this.match(TokenType.KW_READ)) {
                    return { type: 'Action', action: 'mark_read' };
                } else if (this.match(TokenType.KW_UNREAD)) {
                    return { type: 'Action', action: 'mark_unread' };
                }
            }
            throw this.error("Expected 'as read' or 'as unread' after 'mark'");
        }

        throw this.error(`Unknown or invalid action start: ${token.value}`);
    }

    peek() {
        return this.tokens[this.pos];
    }

    advance() {
        if (this.pos < this.tokens.length - 1) {
            this.pos++;
        }
        return this.tokens[this.pos - 1];
    }

    check(type) {
        return this.peek().type === type;
    }

    match(type) {
        if (this.check(type)) {
            this.advance();
            return true;
        }
        return false;
    }

    consume(type, errorMessage) {
        if (this.check(type)) {
            return this.advance();
        }
        throw this.error(errorMessage || `Expected ${type}, found ${this.peek().type}`);
    }

    error(message) {
        const token = this.peek();
        return new Error(`Parser Error at line ${token.line}, column ${token.column}: ${message}`);
    }
}
