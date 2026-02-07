
/**
 * TokenType definitions
 */
export const TokenType = {
    // Structural
    FOLDER: 'FOLDER',
    WHEN: 'WHEN',
    THEN: 'THEN',
    PRIORITY: 'PRIORITY',

    // Logic
    AND: 'AND',
    OR: 'OR',
    NOT: 'NOT',
    IN: 'IN',
    CONTAINS: 'CONTAINS', // Although 'contains' acts like an operator

    // Fields
    FIELD_SENDER: 'FIELD_SENDER',
    FIELD_SUBJECT: 'FIELD_SUBJECT',
    FIELD_BODY: 'FIELD_BODY',

    // Actions (Start words)
    KW_MOVE: 'KW_MOVE',
    KW_REMOVE: 'KW_REMOVE',
    KW_NOTIFY: 'KW_NOTIFY',
    KW_CALL: 'KW_CALL',
    KW_REMIND: 'KW_REMIND',
    KW_MARK: 'KW_MARK',
    KW_AUTO: 'KW_AUTO',

    // Prepositions / Helpers
    KW_TO: 'KW_TO',
    KW_FROM: 'KW_FROM',
    KW_AS: 'KW_AS',
    KW_READ: 'KW_READ',
    KW_UNREAD: 'KW_UNREAD',

    // Literals
    STRING: 'STRING',
    IDENTIFIER: 'IDENTIFIER',

    // Symbols
    LPAREN: 'LPAREN',
    RPAREN: 'RPAREN',
    LBRACKET: 'LBRACKET',
    RBRACKET: 'RBRACKET',
    COMMA: 'COMMA',

    EOF: 'EOF'
};

class Token {
    constructor(type, value, line, column) {
        this.type = type;
        this.value = value;
        this.line = line;
        this.column = column;
    }
}

export class Lexer {
    constructor(input) {
        this.input = input;
        this.pos = 0;
        this.line = 1;
        this.column = 1;
        this.tokens = [];
    }

    tokenize() {
        while (this.pos < this.input.length) {
            const char = this.input[this.pos];

            // Handle whitespace
            if (/\s/.test(char)) {
                if (char === '\n') {
                    this.line++;
                    this.column = 1;
                } else {
                    this.column++;
                }
                this.pos++;
                continue;
            }

            // Handle strings
            if (char === '"') {
                this.readString();
                continue;
            }

            // Handle symbols
            if (char === '(') { this.addToken(TokenType.LPAREN, '('); this.pos++; this.column++; continue; }
            if (char === ')') { this.addToken(TokenType.RPAREN, ')'); this.pos++; this.column++; continue; }
            if (char === '[') { this.addToken(TokenType.LBRACKET, '['); this.pos++; this.column++; continue; }
            if (char === ']') { this.addToken(TokenType.RBRACKET, ']'); this.pos++; this.column++; continue; }
            if (char === ',') { this.addToken(TokenType.COMMA, ','); this.pos++; this.column++; continue; }

            // Handle keywords and identifiers
            if (/[a-zA-Z0-9_]/.test(char)) {
                this.readIdentifierOrKeyword();
                continue;
            }

            // If we reach here, it's an unexpected character
            throw new Error(`Unexpected character '${char}' at line ${this.line}, column ${this.column}`);
        }

        this.addToken(TokenType.EOF, null);
        return this.tokens;
    }

    addToken(type, value) {
        this.tokens.push(new Token(type, value, this.line, this.column));
    }

    readString() {
        let value = '';
        const startColumn = this.column;
        this.pos++; // Skip opening quote
        this.column++;

        while (this.pos < this.input.length && this.input[this.pos] !== '"') {
            value += this.input[this.pos];
            this.pos++;
            this.column++;
        }

        if (this.pos >= this.input.length) {
            throw new Error(`Unterminated string starting at line ${this.line}, column ${startColumn}`);
        }

        this.pos++; // Skip closing quote
        this.column++;
        this.tokens.push(new Token(TokenType.STRING, value, this.line, startColumn));
    }

    readIdentifierOrKeyword() {
        let value = '';
        const startColumn = this.column;

        // Read word
        while (this.pos < this.input.length && /[a-zA-Z0-9_]/.test(this.input[this.pos])) {
            value += this.input[this.pos];
            this.pos++;
            this.column++;
        }

        const key = value.toLowerCase();

        // Mapping of keywords to TokenTypes
        const KEYWORDS = {
            'folder': TokenType.FOLDER,
            'priority': TokenType.PRIORITY,
            'when': TokenType.WHEN,
            'then': TokenType.THEN,
            'and': TokenType.AND,
            'or': TokenType.OR,
            'not': TokenType.NOT,
            'in': TokenType.IN,
            'contains': TokenType.CONTAINS,

            'sender': TokenType.FIELD_SENDER,
            'subject': TokenType.FIELD_SUBJECT,
            'body': TokenType.FIELD_BODY,

            'move': TokenType.KW_MOVE,
            'remove': TokenType.KW_REMOVE,
            'notify': TokenType.KW_NOTIFY,
            'call': TokenType.KW_CALL,
            'remind': TokenType.KW_REMIND,
            'mark': TokenType.KW_MARK,
            'auto': TokenType.KW_AUTO,

            'to': TokenType.KW_TO,
            'from': TokenType.KW_FROM,
            'as': TokenType.KW_AS,
            'read': TokenType.KW_READ,
            'unread': TokenType.KW_UNREAD
        };

        if (KEYWORDS.hasOwnProperty(key)) {
            this.addToken(KEYWORDS[key], value);
        } else {
            this.addToken(TokenType.IDENTIFIER, value);
        }
    }
}
