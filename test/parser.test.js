
import { test } from 'node:test';
import assert from 'node:assert';
import { Lexer } from '../src/lexer.js';
import { Parser } from '../src/parser.js';

function parse(input) {
    const lexer = new Lexer(input);
    const tokens = lexer.tokenize();
    const parser = new Parser(tokens);
    return parser.parse();
}

test('Parser should parse a simple folder and rule', (t) => {
    const input = `Folder Alerts
    WHEN sender contains "github"
    THEN move to Alerts`;

    const ast = parse(input);

    assert.strictEqual(ast.type, 'Program');
    assert.strictEqual(ast.folders.length, 1);

    const folder = ast.folders[0];
    assert.strictEqual(folder.type, 'Folder');
    assert.strictEqual(folder.name, 'Alerts');
    assert.strictEqual(folder.rules.length, 1);

    const rule = folder.rules[0];
    assert.strictEqual(rule.type, 'Rule');

    assert.strictEqual(rule.condition.type, 'Predicate');
    assert.strictEqual(rule.condition.field, 'sender');
    assert.strictEqual(rule.condition.operator, 'contains');
    assert.strictEqual(rule.condition.value, 'github');

    assert.strictEqual(rule.actions.length, 1);
    assert.strictEqual(rule.actions[0].type, 'Action');
    assert.strictEqual(rule.actions[0].action, 'move');
    assert.strictEqual(rule.actions[0].target, 'Alerts');
});

test('Parser should parse complex logical conditions', (t) => {
    const input = `Folder Test
    WHEN sender contains "a" OR subject contains "b" AND NOT body contains "c"
    THEN notify`;

    const ast = parse(input);
    const rule = ast.folders[0].rules[0];
    const cond = rule.condition;

    // Precedence: OR < AND < NOT
    // (sender contains "a") OR ((subject contains "b") AND (NOT (body contains "c")))

    assert.strictEqual(cond.type, 'BinaryExpression');
    assert.strictEqual(cond.operator, 'OR');

    const right = cond.right;
    assert.strictEqual(right.type, 'BinaryExpression');
    assert.strictEqual(right.operator, 'AND');

    const notExpr = right.right;
    assert.strictEqual(notExpr.type, 'UnaryExpression');
    assert.strictEqual(notExpr.operator, 'NOT');
    assert.strictEqual(notExpr.argument.value, 'c');
});

test('Parser should parse string folder names and multiple actions', (t) => {
    const input = `Folder "My Folder"
    WHEN sender IN ["a", "b"]
    THEN move to "My Folder" AND mark as read`;

    const ast = parse(input);
    const folder = ast.folders[0];
    assert.strictEqual(folder.name, 'My Folder');

    const rule = folder.rules[0];
    assert.strictEqual(rule.condition.type, 'InPredicate');
    assert.deepStrictEqual(rule.condition.value, ['a', 'b']);

    assert.strictEqual(rule.actions.length, 2);
    assert.strictEqual(rule.actions[0].action, 'move');
    assert.strictEqual(rule.actions[0].target, 'My Folder');
    assert.strictEqual(rule.actions[1].action, 'mark_read');
});

test('Parser should throw error on invalid syntax', (t) => {
    const input = `Folder Errors WHEN`;
    assert.throws(() => parse(input), /Parser Error/);
});
