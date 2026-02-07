
import { test, beforeEach } from 'node:test';
import assert from 'node:assert';
import cxr from '../src/index.js';

// Ensure clean state before each test
beforeEach(() => {
    if (cxr.reset) cxr.reset();
});

test('Rule Priority Sorting', () => {
    const rules = `
    Folder Low priority 10
    WHEN subject contains "test" THEN move to Low

    Folder High priority 100
    WHEN subject contains "test" THEN move to High
    `;

    const emails = [
        { id: 'p1', from: 'me@test.com', subject: 'test priority', body: '', unread: true, receivedAt: Date.now() }
    ];

    const result = cxr.init({ rules, emails });

    // Should match "High" because priority 100 > 10
    assert.ok(result.folders['High']);
    assert.strictEqual(result.folders['High'].length, 1);
    assert.strictEqual(result.folders['High'][0].id, 'p1');

    // Should NOT be in Low because single-execution guarantees stop after first match
    if (result.folders['Low']) {
        assert.strictEqual(result.folders['Low'].length, 0);
    }
});

test('List Syntax Support', () => {
    const rules = `
    Folder Lists
    WHEN subject contains ["urgent", "important"]
    THEN move to Lists
    `;

    const emails = [
        { id: 'l1', from: 'me', subject: 'this is urgent', body: '', unread: true, receivedAt: 0 },
        { id: 'l2', from: 'me', subject: 'this is important', body: '', unread: true, receivedAt: 0 },
        { id: 'l3', from: 'me', subject: 'normal msg', body: '', unread: true, receivedAt: 0 }
    ];

    const result = cxr.init({ rules, emails });

    assert.ok(result.folders['Lists']);
    assert.strictEqual(result.folders['Lists'].length, 2);
    const ids = result.folders['Lists'].map(e => e.id).sort();
    assert.deepStrictEqual(ids, ['l1', 'l2']);
});

test('IN Operator with List', () => {
    const rules = `
    Folder Domains
    WHEN sender IN ["github.com", "google.com"]
    THEN move to Domains
    `;

    // Note: implementation currently uses 'includes' for IN as well (substring match)
    // based on evaluateInPredicate logic
    const emails = [
        { id: 'd1', from: 'notifications@github.com', subject: 's', body: '', unread: true, receivedAt: 0 },
        { id: 'd2', from: 'me@yahoo.com', subject: 's', body: '', unread: true, receivedAt: 0 }
    ];

    const result = cxr.init({ rules, emails });

    assert.ok(result.folders['Domains']);
    assert.strictEqual(result.folders['Domains'].length, 1);
    assert.strictEqual(result.folders['Domains'][0].id, 'd1');
});

test('Deduplication Across Runs', () => {
    const rules = `
    Folder Dedupe
    WHEN subject contains "chk" THEN move to Dedupe
    `;

    const email = { id: 'dup1', from: 'me', subject: 'chk', body: '', unread: true, receivedAt: 0 };

    // Run 1
    const res1 = cxr.init({ rules, emails: [email] });
    assert.strictEqual(res1.folders['Dedupe'].length, 1);
    assert.strictEqual(res1.actionsLog.length, 1);

    // Run 2 (Should skip)
    const res2 = cxr.init({ rules, emails: [email] });
    // Should be empty or not contain this email
    if (res2.folders['Dedupe']) {
        assert.strictEqual(res2.folders['Dedupe'].length, 0);
    }
    assert.strictEqual(res2.actionsLog.length, 0);

    // Reset and Run 3 (Should process again)
    cxr.reset();
    const res3 = cxr.init({ rules, emails: [email] });
    assert.strictEqual(res3.folders['Dedupe'].length, 1);
});
