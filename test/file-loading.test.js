
import { test } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import cxr from '../src/index.js';

test('Initialization with .cxr file path', (t) => {
    const rulePath = path.resolve('test/fixtures/external_rules.cxr');

    const emails = [{
        id: '1',
        from: 'external@partner.com',
        subject: 'Hello',
        body: '...',
        unread: true,
        receivedAt: 100
    }];

    const result = cxr.init({
        rules: rulePath,
        emails
    });

    // Verify external rule logic loaded
    // Rule: WHEN sender contains "external" THEN move to External
    assert.ok(result.folders['External']);
    assert.ok(result.folders['External'].find(e => e.id === '1'), 'Should match rule loaded from file');
});

test('Initialization with multiple .cxr files and strings', (t) => {
    const rulePath = path.resolve('test/fixtures/external_rules.cxr');
    const inlineRules = `
    Folder Inline
    WHEN subject contains "inline"
    THEN move to Inline
  `;

    const emails = [
        { id: '1', from: 'external@partner.com', subject: 'A', body: '' },
        { id: '2', from: 'other@com.com', subject: 'inline test', body: '' }
    ];

    const result = cxr.init({
        rules: [rulePath, inlineRules],
        emails
    });

    assert.ok(result.folders['External'].find(e => e.id === '1'));
    assert.ok(result.folders['Inline'].find(e => e.id === '2'));
});

test('Should throw error for missing .cxr file', (t) => {
    assert.throws(() => {
        cxr.init({
            rules: 'missing_file.cxr',
            emails: []
        });
    }, /Rule file not found/);
});
