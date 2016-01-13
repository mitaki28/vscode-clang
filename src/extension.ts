import * as vscode from 'vscode';
import * as clang from './clang'
import * as configuration from "./configuration"
import * as diagnostic from './diagnostic'
import * as completion from './completion'

const CLANG_MODE: vscode.DocumentSelector = [
    { language: 'cpp', scheme: 'file' },
    { language: 'c', scheme: 'file' },
    { language: 'objective-c', scheme: 'file' }
];

export function activate(context: vscode.ExtensionContext) {
    
    let confTester = new configuration.ConfigurationTester;
    context.subscriptions.push(confTester);
    
    let subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!vscode.languages.match(CLANG_MODE, editor.document)) return;
        confTester.test(editor.document.languageId);
    }, null, subscriptions);
    
    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            CLANG_MODE,
            new completion.ClangCompletionItemProvider(),
            '.', ':', '>'
        ));


    let diagnosticCollection = vscode.languages.createDiagnosticCollection('clang');
    context.subscriptions.push(diagnosticCollection);
    context.subscriptions.push(
        diagnostic.registerDiagnosticProvider(
            CLANG_MODE,
            new diagnostic.ClangDiagnosticProvider,
            diagnosticCollection
        ));
    context.subscriptions.push(vscode.Disposable.from(...subscriptions));
}

export function deactivate() {
}