// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as diagnostic from './diagnostic'
import * as completion from './completion'

const CPP_MODE: vscode.DocumentSelector = { language: 'cpp', scheme: 'file' };

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "vscode-clang" is now active!');

    context.subscriptions.push(
        vscode.languages.registerCompletionItemProvider(
            CPP_MODE,
            new completion.ClangCompletionItemProvider(),
            '.'
        ));


    let diagnosticCollection = vscode.languages.createDiagnosticCollection('cpp');
    context.subscriptions.push(diagnosticCollection);
    context.subscriptions.push(
        diagnostic.registerDiagnosticProvider(
            CPP_MODE,
            new diagnostic.ClangDiagnosticProvider,
            diagnosticCollection
        ));
    
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.sayHello', () => {
        // The code you place here will be executed every time your command is executed

        // Display a message box to the user
        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        let selection = editor.selection;
        let text = editor.document.getText(selection);
        vscode.window.showInformationMessage(`Selected Characters: ${text.length}`);
    });

    context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {
}