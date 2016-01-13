import * as vscode from 'vscode';
import * as diagnostic from './diagnostic'
import * as completion from './completion'

const CLANG_MODE: vscode.DocumentSelector = [
    { language: 'cpp', scheme: 'file' },
    { language: 'c', scheme: 'file' },
    { language: 'objective-c', scheme: 'file' }
];

export function activate(context: vscode.ExtensionContext) {
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
}

export function deactivate() {
}