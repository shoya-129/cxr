
export interface Email {
    id: string;
    from: string; // Mapped from 'sender' in rules
    subject: string;
    body: string;
    unread: boolean;
    receivedAt: number;
    [key: string]: any; // Allow other properties
}

export interface ActionLog {
    emailId: string;
    folder: string;
    actions: string[];
}

export interface ResultMeta {
    engine: string;
    version: string;
    processedAt: number;
    ruleCount: number;
    emailCount: number;
}

export interface ExecutionResult {
    folders: Record<string, Email[]>;
    actionsLog: ActionLog[];
    meta: ResultMeta;
}

export interface InitConfig {
    /**
     * Rule content or file paths.
     * Can be a single string (content or .cxr path) or an array of strings.
     * If a string ends with '.cxr', it is treated as a file path and read from disk.
     * 
     * @example
     * // Load from file
     * rules: "./rules/alerts.cxr"
     * 
     * @example
     * // Inline content
     * rules: `Folder Alerts WHEN sender contains "github" THEN move to Alerts`
     * 
     * @example
     * // Combined
     * rules: ["./common.cxr", "./personal.cxr"]
     */
    rules: string | string[];

    /**
     * List of email objects to process.
     * Each email object must minimally contain: id, from, subject, body, unread, receivedAt.
     */
    emails: Email[];

    /**
     * Optional custom schema mapping.
     * Maps rule field names to email object property names.
     * Default schema: { sender: 'from', subject: 'subject', body: 'body' }
     * 
     * @example
     * // Map 'priority' in rules to 'X-Priority' in email object
     * schema: { priority: 'X-Priority' }
     */
    schema?: Record<string, string>;
}

/**
 * Initialize the CXR engine with rules and emails.
 * 
 * This is the main entry point. It parses the provided rules (from strings or files)
 * and executes them against the provided list of emails.
 * 
 * @param config Configuration object containing rules and emails.
 * @returns The classification result and action logs.
 * 
 * @example
 * const result = cxr.init({
 *   rules: "./my-rules.cxr",
 *   emails: myEmails
 * });
 * console.log(result.folders);
 */
export function init(config: InitConfig): ExecutionResult;

/**
 * **CXR - Email Rule eXecutor**
 * 
 * A rule engine / compiler for email filtering logic.
 * 
 * CXR parses a custom `.cxr` domain language and executes deterministically against normalized email objects without mutation.
 * 
 * ### Features
 * - **Safe**: No `eval`, no `Function`, purely AST-based execution.
 * - **Deterministic**: Input -> Output is always the same.
 * - **Explainable**: Returns metadata and logs of all actions taken.
 * - **Extensible**: Pure JSON output format.
 * - **Zero Dependencies**: Lightweight and fast.
 * 
 * ### Example Usage
 * ```javascript
 * import cxr from "cxr";
 * 
 * // 1. Define Rules (.cxr content)
 * const rules = `
 * Folder "Important"
 * WHEN sender contains "boss"
 * THEN move to "Important"
 * AND notify
 * `;
 * 
 * // 2. Run Engine
 * const result = cxr.init({
 *   rules,
 *   emails: [{ 
 *     id: '1', 
 *     from: 'boss@company.com', 
 *     subject: 'Urgent', 
 *     body: 'Read this', 
 *     unread: true, 
 *     receivedAt: Date.now() 
 *   }]
 * });
 * 
 * // 3. Use Results
 * console.log(result.folders['Important']); // [ { id: '1', ... } ]
 * ```
 */
declare const cxr: {
    /**
     * Initialize the CXR engine.
     * 
     * @param config {InitConfig} Configuration object containing rules and emails.
     * @returns {ExecutionResult} The classification result and action logs.
     */
    init: typeof init;
};

export default cxr;
