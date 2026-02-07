
import { Executor } from './executor.js';
import fs from 'node:fs';

/**
 * CXR Main Entry Point
 */
const cxr = {
    /**
     * Initialize result engine with rules and emails.
     * @param {Object} config
     * @param {string|string[]} config.rules - The .cxr rules content or file path(s)
     * @param {Array} config.emails - Array of email objects
     * @returns {Object} Result object containing folders and actionsLog
     */
    init: function (config) {
        if (!config || !config.rules) {
            throw new Error("Invalid configuration: 'rules' is required (string or array).");
        }
        if (!Array.isArray(config.emails)) {
            throw new Error("Invalid configuration: 'emails' array is required.");
        }


        // Resolve Rules (Handle Strings and File Paths)
        const inputs = Array.isArray(config.rules) ? config.rules : [config.rules];
        const combinedRules = inputs.map(input => {
            if (typeof input !== 'string') {
                throw new Error("Invalid rule format: expected string content or file path.");
            }


            // Heuristic: If string ends with .cxr, treat as file path.
            if (input.trim().endsWith('.cxr')) {
                try {
                    if (fs.existsSync(input)) {
                        return fs.readFileSync(input, 'utf8');
                    }
                    throw new Error(`Rule file not found: ${input}`);
                } catch (err) {
                    throw err;
                }
            }

            return input;
        }).join('\n'); // Combine with newline for separation

        try {
            return Executor.execute(combinedRules, config.emails, config.schema);
        } catch (error) {
            throw error;
        }
    },
    reset: function () {
        Executor.reset();
    }
};

export default cxr;
