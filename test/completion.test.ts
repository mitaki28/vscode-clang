// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as completion from '../src/completion';

const COMPLETION_EXAMPLE = `COMPLETION: at : [#reference#]at(<#size_type __n#>)`
const COMPLETION_EXAMPLES = `COMPLETION: at : [#reference#]at(<#size_type __n#>)
COMPLETION: at : [#const_reference#]at(<#size_type __n#>)[# const#]
COMPLETION: back : [#reference#]back()
`


// Defines a Mocha test suite to group tests of similar kind together
suite("Completion Tests", () => {
	test("Completion RegExp", () => {
        let matched = completion.REGEXP_COMPILATION.exec(COMPLETION_EXAMPLE);
        assert.equal(matched[1], 'at');
        assert.equal(matched[2], '[#reference#]at(<#size_type __n#>)');
	});
    
    test('Completion Parse', () => {
        let provider = new completion.ClangCompletionItemProvider;
        let parsed = provider.parseCompletionItems(COMPLETION_EXAMPLES);
        assert.equal(parsed[0].label, 'at');
        assert.equal(parsed[0].detail, '[#reference#]at(<#size_type __n#>)');
        assert.equal(parsed[1].label, 'at');
        assert.equal(parsed[1].detail, '[#const_reference#]at(<#size_type __n#>)[# const#]');
        assert.equal(parsed[2].label, 'back');
        assert.equal(parsed[2].detail, '[#reference#]back()');
    });
    
    
});