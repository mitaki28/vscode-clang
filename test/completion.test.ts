// 
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module "assert" provides assertion methods from node
import * as assert from "assert";

// You can import and use all API from the "vscode" module
// as well as import your extension to test it
import * as vscode from "vscode";
import * as completion from "../src/completion";

// Defines a Mocha test suite to group tests of similar kind together
suite("Completion Tests", () => {
    let provider = new completion.ClangCompletionItemProvider;
    test("method", () => {
        let item = provider.parseCompletionItem("COMPLETION: at : [#reference#]at(<#size_type __n#>)");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "at");
            assert.equal(item.detail, "reference at(size_type __n)");
            assert.equal(item.documentation, undefined);
            assert.equal(item.kind, vscode.CompletionItemKind.Function);
        } else {
            assert(false);
        }
    });
    test("const method", () => {
        let item = provider.parseCompletionItem("COMPLETION: at : [#const_reference#]at(<#size_type __n#>)[# const#]");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "at");
            assert.equal(item.detail, "const_reference at(size_type __n) const ");
            assert.equal(item.documentation, undefined);
            assert.equal(item.kind, vscode.CompletionItemKind.Function);
        } else {
            assert(false);
        }
    });

    test("no argument method", () => {
        let item = provider.parseCompletionItem("COMPLETION: back : [#reference#]back()");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "back");
            assert.equal(item.detail, "reference back()");
            assert.equal(item.documentation, undefined);
            assert.equal(item.kind, vscode.CompletionItemKind.Function);
        } else {
            assert(false);
        }
    });

    test("function with comment", () => {
        let item = provider.parseCompletionItem("COMPLETION: hoge : [#int#]hoge() : f function");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "hoge");
            assert.equal(item.detail, "int hoge()");
            assert.equal(item.documentation, "f function");
            assert.equal(item.kind, vscode.CompletionItemKind.Function);
        } else {
            assert(false);
        }
    });

    test("function with comment which includes \":\"", () => {
        let item = provider.parseCompletionItem("COMPLETION: hoge : [#int#]hoge() : f function : g function");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "hoge");
            assert.equal(item.detail, "int hoge()");
            assert.equal(item.documentation, "f function : g function");
            assert.equal(item.kind, vscode.CompletionItemKind.Function);
        } else {
            assert(false);
        }
    });

    test("function with optional argument", () => {
        let item = provider.parseCompletionItem("COMPLETION: hoge : [#int#]hoge(<#int a#>{#, <#int b#>{#, <#int c#>#}#}) : f function");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "hoge");
            assert.equal(item.detail, "int hoge(int a, int b=?, int c=?)");
            assert.equal(item.documentation, "f function");
            assert.equal(item.kind, vscode.CompletionItemKind.Function);
        } else {
            assert(false);
        }
    });

    test("function with all optional argument", () => {
        let item = provider.parseCompletionItem("COMPLETION: hoge : [#int#]hoge({#<#int a#>{#, <#int b#>{#, <#int c#>#}#}#}) : f function");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "hoge");
            assert.equal(item.detail, "int hoge(int a=?, int b=?, int c=?)");
            assert.equal(item.documentation, "f function");
            assert.equal(item.kind, vscode.CompletionItemKind.Function);
        } else {
            assert(false);
        }
    });

    test("template class with optional argument", () => {
        let item = provider.parseCompletionItem("COMPLETION: Fuga : Fuga<<#typename T#>{#, <#typename I#>#}> : fuga struct");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "Fuga");
            assert.equal(item.detail, "Fuga<typename T, typename I=?>");
            assert.equal(item.documentation, "fuga struct");
            assert.equal(item.kind, vscode.CompletionItemKind.Class);
        } else {
            assert(false);
        }
    });

    test("template class with all optional argument", () => {
        let item = provider.parseCompletionItem("COMPLETION: Fuga : Fuga<{#<#typename T#>{#, <#typename I#>#}#}> : fuga struct");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "Fuga");
            assert.equal(item.detail, "Fuga<typename T=?, typename I=?>");
            assert.equal(item.documentation, "fuga struct");
            assert.equal(item.kind, vscode.CompletionItemKind.Class);
        } else {
            assert(false);
        }
    });

    test("no detail", () => {
        let item = provider.parseCompletionItem("COMPLETION: wchar_t");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "wchar_t");
            assert.equal(item.detail, "wchar_t");
            assert.equal(item.documentation, undefined);
            assert.equal(item.kind, vscode.CompletionItemKind.Class);
        } else {
            assert(false);
        }
    });

    test("variable", () => {
        let item = provider.parseCompletionItem("COMPLETION: hoge : [#int#]hoge : int variable");
        if (item instanceof vscode.CompletionItem) {
            assert.equal(item.label, "hoge");
            assert.equal(item.detail, "int hoge");
            assert.equal(item.documentation, "int variable");
            assert.equal(item.kind, vscode.CompletionItemKind.Variable);
        } else {
            assert(false);
        }
    });

    test("illegal line", () => {
        let item = provider.parseCompletionItem("b.cc:44:41: error: unknown type name");
        assert(typeof item === "undefined");
    });

    test("lineEnds", () => {
        let lines = [
            `COMPLETION: at : [#reference#]at(<#size_type __n#>)`,
            `COMPLETION: at : [#const_reference#]at(<#size_type __n#>)[# const#]`,
            `COMPLETION: back : [#reference#]back()`
        ];
        for (let lineEnd of ["\r\n", "\r", "\n"]) {
            let items = provider.parseCompletionItems(lines.join(lineEnd));
            assert.equal(items.length, 3);
            let item = items[0];
            if (item instanceof vscode.CompletionItem) {
                assert.equal(item.label, "at");
                assert.equal(item.detail, "reference at(size_type __n)");
                assert.equal(item.documentation, undefined);
                assert.equal(item.kind, vscode.CompletionItemKind.Function);
            } else {
                assert(false);
            }
            item = items[1];
            if (item instanceof vscode.CompletionItem) {
                assert.equal(item.label, "at");
                assert.equal(item.detail, "const_reference at(size_type __n) const ");
                assert.equal(item.documentation, undefined);
                assert.equal(item.kind, vscode.CompletionItemKind.Function);
            } else {
                assert(false);
            }
            item = items[2];
            if (item instanceof vscode.CompletionItem) {
                assert.equal(item.label, "back");
                assert.equal(item.detail, "reference back()");
                assert.equal(item.documentation, undefined);
                assert.equal(item.kind, vscode.CompletionItemKind.Function);
            } else {
                assert(false);
            }
        }
    });
});
