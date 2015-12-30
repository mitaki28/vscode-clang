import * as vscode from 'vscode';
import * as process from 'child_process';

export const REGEXP_COMPILATION = /^COMPLETION: (.*?) : (.*?)$/;

export class ClangCompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        return this.fetchCompletionItems(document.getText(), position.line + 1, position.character + 1, token)
        .then((data) => {
            return this.parseCompletionItems(data);
        });
    }
    
    fetchCompletionItems(text: string, line: number, char: number, token: vscode.CancellationToken): Thenable<string> {
        return new Promise((resolve, reject) => {
            let proc = process.exec(`clang++ -x c++ -fsyntax-only -Xclang -code-completion-at='<stdin>:${line}:${char}' -`);
            proc.stdin.write(text, () => {
                proc.stdin.end();                
            });
            let buf: string[] = [];
            proc.stdout.on('data', (data) => {
                buf.push(data);
            });
            proc.stdout.on('end', () => {
                resolve(buf.join(''));
            });
            proc.on('error', () => resolve("")); 
            token.onCancellationRequested(() => {
                console.log('interupted');
                proc.kill();  
                resolve("");
            });
        });        
    }
    
    parseCompletionItems(data: string): vscode.CompletionItem[] {
        let result: vscode.CompletionItem[] = []; 
        data.split('\n').forEach((line) => {
            let matched = REGEXP_COMPILATION.exec(line);
            if (!matched) return;
            let item = new vscode.CompletionItem(matched[1]);
            item.detail = matched[2];
            result.push(item);
        });
        return result;
    }
}