import * as vscode from 'vscode';

import * as clang from './clang';

export const COMPILATION_REGEXP = /^COMPLETION: (.*?) : (.*?)$/;

const DELIMITERS = '~`!@#$%^&*()-+={}[]|\\\'";:/?<>,. \t\n';

function is_delimiter(c: string) {
    return DELIMITERS.indexOf(c) != -1;
}

function findPreviousDelimiter(document: vscode.TextDocument, position: vscode.Position): vscode.Position {
    let line = position.line;
    let char = position.character;
    while (char < 1000 // ignore too long line for performance
            && char > 0
            && !is_delimiter(document.getText(new vscode.Range(line, char - 1, line, char)))) char--;
    return new vscode.Position(line, char); 
}


export class ClangCompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        // Currently, Clang does NOT complete token partially (e.g. std::vec is not completed at all)
        // So we find a previous delimiter and start complete from there.
        let delPos = findPreviousDelimiter(document, position);
        return this.fetchCompletionItems(document.getText(), delPos.line + 1, delPos.character + 1, token)
        .then((data) => {
            return this.parseCompletionItems(data);
        });
    }
    
    fetchCompletionItems(text: string, line: number, char: number, token: vscode.CancellationToken): Thenable<string> {
        return new Promise((resolve, reject) => {
            let proc = clang.complete(text, line, char);
            let buf: string[] = [];
            proc.stdout.on('data', (data) => {
                buf.push(data);
            });
            proc.stdout.on('close', () => {
                resolve(buf.join(''));
            });
            token.onCancellationRequested(() => {
                proc.kill();
                resolve('');
            });
        });        
    }
    
    parseCompletionItems(data: string): vscode.CompletionItem[] {
        let result: vscode.CompletionItem[] = []; 
        data.split('\n').forEach((line) => {
            let matched = COMPILATION_REGEXP.exec(line);
            if (!matched) return;
            let item = new vscode.CompletionItem(matched[1]);
            item.detail = matched[2];
            result.push(item);
        });
        return result;
    }
}