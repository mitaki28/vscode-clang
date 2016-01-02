import * as vscode from 'vscode';
import * as path from 'path';
import * as child_process from 'child_process';

import * as clang from './clang';

export const COMPILATION_REGEXP = /^COMPLETION: (.*?) : (.*?)$/;

const DELIMITERS = '~`!@#$%^&*()-+={}[]|\\\'";:/?<>,. \t\n';

function isDelimiter(c: string) {
    return DELIMITERS.indexOf(c) != -1;
}

function findPreviousDelimiter(document: vscode.TextDocument, position: vscode.Position): vscode.Position {
    let line = position.line;
    let char = position.character;
    while (char < 1000 // ignore too long line for performance
            && char > 0
            && !isDelimiter(document.getText(new vscode.Range(line, char - 1, line, char)))) char--;
    return new vscode.Position(line, char); 
}


export class ClangCompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        return this.fetchCompletionItems(document, position, token)
        .then((data) => {
            return this.parseCompletionItems(data);
        });
    }
    
    fetchCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<string> {
        return new Promise((resolve, reject) => {
            // Currently, Clang does NOT complete token partially (e.g. std::vec is not completed at all)
            // So we find a previous delimiter and start complete from there.
            let delPos = findPreviousDelimiter(document, position);
            let proc = child_process.exec(
                clang.complete(delPos.line + 1, delPos.character + 1),
                {cwd: path.dirname(document.uri.fsPath)},
                (error, stdout, stderr) => {
                    resolve(stdout);
                }
            );
            proc.stdin.end(document.getText());
            token.onCancellationRequested(() => {
                proc.kill();
                resolve('');
            });
        });        
    }
    
    parseCompletionItems(data: string): vscode.CompletionItem[] {
        let result: vscode.CompletionItem[] = []; 
        data.split('\n').forEach((line) => {
            let matched = line.match(COMPILATION_REGEXP);
            if (!matched) return;
            let item = new vscode.CompletionItem(matched[1]);
            item.detail = matched[2];
            result.push(item);
        });
        return result;
    }
}