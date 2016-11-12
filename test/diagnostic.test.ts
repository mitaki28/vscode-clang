// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as diagnostic from "../src/diagnostic";

const fixtures = [
    `<stdin>:23:45:{1:12-23:45}: error: no member named 'vect' in namespace 'std'`,
    `<stdin>:23:45:{1:12-23:45}{56:67-78:89}: error: no member named 'vect' in namespace 'std'`,
    `<stdin>:6:13: error: expected ';' at end of declaration`,
    `hoge.cpp:6:13: error: expected ';' at end of declaration`,
    `<stdin>:6:13: warning: expected ';' at end of declaration`,
    `<stdin>:5:10: fatal error: 'lib.hpp' file not found`
];

// Defines a Mocha test suite to group tests of similar kind together
suite("Diagnostic Tests", () => {
    test("Diagnostic", () => {
        let diag = new diagnostic.ClangDiagnosticProvider;
        for (let lineEnd of ["\r\n", "\r", "\n"]) {
            let result = diag.parseDiagnostic(fixtures.join(lineEnd));
            assert.equal(result[0].severity, vscode.DiagnosticSeverity.Error);
            assert.equal(result[0].range.start.line, 1 - 1);
            assert.equal(result[0].range.start.character, 12 - 1);
            assert.equal(result[0].range.end.line, 23 - 1);
            assert.equal(result[0].range.end.character, 45 - 1);
            assert.equal(result[0].message, `no member named 'vect' in namespace 'std'`);

            assert.equal(result[1].severity, vscode.DiagnosticSeverity.Error);
            assert.equal(result[1].range.start.line, 1 - 1);
            assert.equal(result[1].range.start.character, 12 - 1);
            assert.equal(result[1].range.end.line, 78 - 1);
            assert.equal(result[1].range.end.character, 89 - 1);
            assert.equal(result[1].message, `no member named 'vect' in namespace 'std'`);

            assert.equal(result[2].severity, vscode.DiagnosticSeverity.Error);
            assert.equal(result[2].range.start.line, 6 - 1);
            assert.equal(result[2].range.start.character, 13 - 1);
            assert.equal(result[2].range.end.line, 6 - 1);
            assert.equal(result[2].range.end.character, 13 - 1);
            assert.equal(result[2].message, `expected ';' at end of declaration`);

            assert.equal(result[3].severity, vscode.DiagnosticSeverity.Warning);
            assert.equal(result[3].range.start.line, 6 - 1);
            assert.equal(result[3].range.start.character, 13 - 1);
            assert.equal(result[3].range.end.line, 6 - 1);
            assert.equal(result[3].range.end.character, 13 - 1);
            assert.equal(result[3].message, `expected ';' at end of declaration`);

            assert.equal(result[4].severity, vscode.DiagnosticSeverity.Error);
            assert.equal(result[4].range.start.line, 5 - 1);
            assert.equal(result[4].range.start.character, 10 - 1);
            assert.equal(result[4].range.end.line, 5 - 1);
            assert.equal(result[4].range.end.character, 10 - 1);
            assert.equal(result[4].message, `'lib.hpp' file not found`);
        }
    });
});
