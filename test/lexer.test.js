
import { test } from 'node:test';
import assert from 'node:assert';
import { Lexer, TokenType } from '../src/lexer.js';

test('Lexer should tokenize keywords and identifiers', (t) => {
    const input = 'Folder Alerts WHEN sender contains "github"';
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.FOLDER);
    assert.strictEqual(tokens[1].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[1].value, 'Alerts');
    assert.strictEqual(tokens[2].type, TokenType.WHEN);
    assert.strictEqual(tokens[3].type, TokenType.FIELD_SENDER);
    assert.strictEqual(tokens[4].type, TokenType.CONTAINS);
    assert.strictEqual(tokens[5].type, TokenType.STRING);
    assert.strictEqual(tokens[5].value, 'github');
    assert.strictEqual(tokens[6].type, TokenType.EOF);
});

test('Lexer should tokenize actions correctly', (t) => {
    const input = 'THEN move to Alerts AND mark as read';
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();

    // THEN
    assert.strictEqual(tokens[0].type, TokenType.THEN);

    // move to Alerts
    assert.strictEqual(tokens[1].type, TokenType.KW_MOVE);
    assert.strictEqual(tokens[2].type, TokenType.KW_TO);
    assert.strictEqual(tokens[3].type, TokenType.IDENTIFIER);
    assert.strictEqual(tokens[3].value, 'Alerts');

    // AND
    assert.strictEqual(tokens[4].type, TokenType.AND);

    // mark as read
    assert.strictEqual(tokens[5].type, TokenType.KW_MARK);
    assert.strictEqual(tokens[6].type, TokenType.KW_AS);
    assert.strictEqual(tokens[7].type, TokenType.KW_READ);
});

test('Lexer should be case insensitive for keywords', (t) => {
    const input = 'folder alerts when SENDER CONTAINS "foo"';
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();

    assert.strictEqual(tokens[0].type, TokenType.FOLDER);
    assert.strictEqual(tokens[2].type, TokenType.WHEN);
    assert.strictEqual(tokens[3].type, TokenType.FIELD_SENDER);
    assert.strictEqual(tokens[4].type, TokenType.CONTAINS);
});
