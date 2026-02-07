
import { test, beforeEach } from 'node:test';
import assert from 'node:assert';
import cxr from '../src/index.js';

beforeEach(() => {
    if (cxr.reset) cxr.reset();
});

test('End-to-End Execution', (t) => {
    const rules = `
Folder Alerts

WHEN (sender contains "github" OR subject contains "login")
AND NOT sender contains "newsletter"

THEN move to Alerts
AND notify
AND mark as unread

Folder CleanGithub

WHEN (sender contains "github" OR subject contains "github")
AND sender contains "newsletter"

THEN move to CleanGithub

Folder ArbitraryField

WHEN department contains "sales"
THEN move to Sales
`;

    const emails = [
        { id: '1', from: 'notifications@github.com', subject: 'New login', body: '...' },
        { id: '2', from: 'newsletter@github.com', subject: 'Newsletter', body: '' },
        { id: '3', from: 'bob@company.com', subject: 'Hi', body: '' },
        { id: '4', from: 'alice@company.com', subject: 'Sales Report', body: '', department: 'sales' }
    ];

    const result = cxr.init({ rules, emails });

    // Check meta
    assert.strictEqual(result.meta.emailCount, 4);
    assert.strictEqual(result.meta.engine, 'cxr');

    // Check classification

    // Email 1: Matches Alerts
    assert.ok(result.folders['Alerts']);
    assert.ok(result.folders['Alerts'].find(e => e.id === '1'));
    assert.strictEqual(result.folders['Alerts'].length, 1);

    // Email 2: Matches CleanGithub
    assert.ok(result.folders['CleanGithub']);
    assert.ok(result.folders['CleanGithub'].find(e => e.id === '2'));

    // Email 3: Inbox
    assert.ok(result.folders['Inbox']);
    assert.ok(result.folders['Inbox'].find(e => e.id === '3'));

    // Email 4: Matches ArbitraryField (department: sales)
    assert.ok(result.folders['Sales']);
    assert.ok(result.folders['Sales'].find(e => e.id === '4'));

    // Verify Action Logs
    const log1 = result.actionsLog.find(l => l.emailId === '1');
    assert.ok(log1);
    assert.strictEqual(log1.folder, 'Alerts');
    assert.deepStrictEqual(log1.actions, [
        'move to Alerts',
        'notify',
        'mark as unread'
    ]);
});

test('Parentheses override precedence', (t) => {
    // A AND (B OR C)
    const rules = `
    Folder Test
    WHEN sender contains "A" AND (subject contains "B" OR subject contains "C")
    THEN move to Test
    `;

    const emails = [
        { id: '1', from: 'A', subject: 'B', body: '' }, // Matches
        { id: '2', from: 'A', subject: 'D', body: '' }, // Fails
        { id: '3', from: 'X', subject: 'B', body: '' }  // Fails
    ];

    const result = cxr.init({ rules, emails });

    assert.ok(result.folders['Test'].find(e => e.id === '1'));
    assert.strictEqual(result.folders['Test'].length, 1);
});
