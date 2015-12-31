// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as diagnostic from '../src/diagnostic';

assert.equal = assert.strictEqual;

// Defines a Mocha test suite to group tests of similar kind together
suite("Checker Tests", () => {
    test("Checker RegExp error", () => {
        let matched = diagnostic.CHECK_REGEXP.exec(`<stdin>:23:45:{1:12-23:45}: error: no member named 'vect' in namespace 'std'`);
        assert.equal(matched[1], '23');
        assert.equal(matched[2], '45');
        assert.equal(matched[4], '1');
        assert.equal(matched[5], '12');
        assert.equal(matched[6], '23');
        assert.equal(matched[7], '45');
        assert.equal(matched[8], 'error');
        assert.equal(matched[9], "no member named 'vect' in namespace 'std'");
    });

    test("Checker RegExp no range error", () => {
        let matched = diagnostic.CHECK_REGEXP.exec(`<stdin>:6:13: error: expected ';' at end of declaration`);
        assert.equal(matched[1], '6');
        assert.equal(matched[2], '13');
        assert.equal(matched[4], undefined);
        assert.equal(matched[5], undefined);
        assert.equal(matched[6], undefined);
        assert.equal(matched[7], undefined);        
        assert.equal(matched[8], 'error');
        assert.equal(matched[9], "expected ';' at end of declaration");
    });
    
    test("Checker RegExp no stdin", () => {
        let matched = diagnostic.CHECK_REGEXP.exec(`hoge.cpp:6:13: error: expected ';' at end of declaration`);
        assert.equal(matched, null);
    });
    
    test("Checker RegExp warning", () => {
        let matched = diagnostic.CHECK_REGEXP.exec(`<stdin>:6:13: warning: expected ';' at end of declaration`);
        assert.equal(matched[1], '6');
        assert.equal(matched[2], '13');
        assert.equal(matched[8], 'warning');
        assert.equal(matched[9], "expected ';' at end of declaration");
    });
});