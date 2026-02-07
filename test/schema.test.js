
import { test, beforeEach } from 'node:test';
import assert from 'node:assert';
import cxr from '../src/index.js';

beforeEach(() => {
    if (cxr.reset) cxr.reset();
});

test('Custom Schema Mapping', (t) => {
    // Rule uses 'priority' and 'sender'
    const rules = `
    Folder "High Priority"
    WHEN priority contains "high"
    THEN move to Important

    Folder "From Boss"
    WHEN sender contains "boss"
    THEN move to Boss
    `;

    // Email objects use 'X-Priority' instead of 'priority'
    // And 'from_address' instead of 'from' (standard default is 'from')
    const emails = [
        {
            id: '1',
            from_address: 'user@example.com',
            'X-Priority': 'High',
            subject: 'Test',
            body: ''
        },
        {
            id: '2',
            from_address: 'boss@company.com',
            'X-Priority': 'Normal',
            subject: 'Work',
            body: ''
        }
    ];

    const result = cxr.init({
        rules,
        emails,
        schema: {
            // Map rule field 'priority' -> email property 'X-Priority'
            priority: 'X-Priority',
            // Map rule field 'sender' -> email property 'from_address'
            sender: 'from_address'
        }
    });

    // Email 1 should be in "Important" because X-Priority is High
    assert.ok(result.folders['Important']);
    assert.ok(result.folders['Important'].find(e => e.id === '1'));

    // Email 2 should be in "Boss" because sender (from_address) contains "boss"
    assert.ok(result.folders['Boss']);
    assert.ok(result.folders['Boss'].find(e => e.id === '2'));
});
