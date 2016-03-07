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

class ResidentExtension implements vscode.Disposable {
    extensions: Map<string, vscode.Disposable>;
    constructor() {
        this.extensions = new Map<string, vscode.Disposable>();
        this.update();
    }
    private _updateProvider(enable: boolean, name: string, create: () => vscode.Disposable): void {
        if (enable && !this.extensions.has(name)) {
            this.extensions.set(name, create());
        } else if (!enable && this.extensions.has(name)) {
            this.extensions.get(name).dispose();
            this.extensions.delete(name);
        }
    }
    
    update() {
        this._updateProvider(
            clang.getConf<boolean>('completion.enable'),
            'completion',
            () => vscode.languages.registerCompletionItemProvider(
                CLANG_MODE,
                new completion.ClangCompletionItemProvider(),
                '.', ':', '>'
            )
        );
        this._updateProvider(
            clang.getConf<boolean>('diagnostic.enable'),
            'diagnostic',
            () => diagnostic.registerDiagnosticProvider(
                CLANG_MODE,
                new diagnostic.ClangDiagnosticProvider,
                'clang'
            )
        );
    }
    
    dispose() {
        for (let disposable of Array.from(this.extensions.values())) {
            disposable.dispose();
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    
    let confViewer = new configuration.ConfigurationViewer;
    context.subscriptions.push(confViewer);
    context.subscriptions.push(vscode.commands.registerCommand('clang.showExecConf', () => {
        let editor = vscode.window.activeTextEditor;
        if (editor == null) {
            vscode.window.showErrorMessage(`No active editor.`);
            return;
        }
        if (!vscode.languages.match(CLANG_MODE, editor.document)) {
            vscode.window.showErrorMessage(`Current language is not C, C++ or Objective-C`);
            return;            
        }
        confViewer.show(editor.document);
    }));    
    
    let confTester = new configuration.ConfigurationTester;
    context.subscriptions.push(confTester);
    let subscriptions: vscode.Disposable[] = [];
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (!vscode.languages.match(CLANG_MODE, editor.document)) return;
        confTester.test(editor.document.languageId);
    }, null, subscriptions);
    

    let residentExtension: ResidentExtension = new ResidentExtension();
    context.subscriptions.push(residentExtension);
    vscode.workspace.onDidChangeConfiguration(() => {
        residentExtension.update();
    }, null, subscriptions);
    context.subscriptions.push(vscode.Disposable.from(...subscriptions));
}

export function deactivate() {
}