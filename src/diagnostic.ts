import * as vscode from 'vscode';
import * as child_process from 'child_process';
import * as path from 'path';

import * as clang from './clang';

export const CHECK_REGEXP = /^\<stdin\>:(\d+):(\d+):(?:((?:\{.+?\})+):)? ((?:fatal )?error|warning): (.*?)$/;  
function str2diagserv(str: string): vscode.DiagnosticSeverity {
    switch(str) {
        case 'fatal error': return vscode.DiagnosticSeverity.Error;
        case 'error': return vscode.DiagnosticSeverity.Error;
        case 'warning': return vscode.DiagnosticSeverity.Warning;
        default: return vscode.DiagnosticSeverity.Information;
    }
}

export interface DiagnosticProvider {
    provideDiagnostic(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.Diagnostic[]>
}

const DELAY_TIME = 500;

    
function delay(token: vscode.CancellationToken): Thenable<void> {
    return new Promise<void>((resolve, reject) => {
        let timer = setTimeout(() => {
            resolve();
        }, DELAY_TIME);
        token.onCancellationRequested(() => {
            clearTimeout(timer);
            //reject();
        });
    });
}

export function registerDiagnosticProvider(selector: vscode.DocumentSelector, provider: DiagnosticProvider, collection: vscode.DiagnosticCollection) : vscode.Disposable {         
    let cancellers = new Map<string, vscode.CancellationTokenSource>();
    vscode.workspace.onDidChangeTextDocument((change) => {
        if (!vscode.languages.match(selector, change.document)) return;
        const uri = change.document.uri;
        const uriStr = uri.toString();
        if (cancellers.has(uriStr)) {
            cancellers.get(uriStr).dispose();
        }
        cancellers.set(uriStr, new vscode.CancellationTokenSource);
        delay(cancellers.get(uriStr).token).then(() => {
            cancellers.get(uriStr).dispose();
            cancellers.set(uriStr, new vscode.CancellationTokenSource);                            
            return provider.provideDiagnostic(change.document, cancellers.get(uriStr).token);
        }).then((diagnostics) => {
            cancellers.get(uriStr).dispose();
            cancellers.delete(uriStr);
            collection.set(uri, diagnostics);
        }, (_) => { /* do nothing */});
    });
    return {
        dispose() {
            for (let canceller of Array.from(cancellers.values())) {
                canceller.dispose();
            }        
        }
    };
}

function parseRanges(s: string): vscode.Range[] {
    let p = 0;
    let parseDigit = () => {
        let ans = 0;
        while (s[p].match(/[0-9]/)) {
            ans = 10 * ans + parseInt(s[p++], 10);
        }
        return ans;
    }
    let result: vscode.Range[] = [];
    while (s[p] == '{') {
        s[p++]; // s[p] == '{'
        let ans = 0;
        let sline = parseDigit();
        s[p++]; // s[p] == ':'
        let schar = parseDigit();
        s[p++]; // s[p] == '-'
        let eline = parseDigit();
        s[p++]; // s[p] == ':'
        let echar = parseDigit();
        s[p++]; // s[p] == '}'
        result.push(new vscode.Range(sline, schar, eline, echar));
    }
    return result;
}

export class ClangDiagnosticProvider implements DiagnosticProvider {
    provideDiagnostic(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<vscode.Diagnostic[]> {
        return this.fetchDiagnostic(document, token)
        .then((data) => {
            return this.parseDiagnostic(data);
        });
    }

    fetchDiagnostic(document: vscode.TextDocument, token: vscode.CancellationToken): Thenable<string> {
        return new Promise((resolve, reject) => {
            let proc = child_process.exec(
                clang.check(document.languageId),
                {cwd: path.dirname(document.uri.fsPath)},
                (error, stdout, stderr) => {
                    resolve(stderr);
                }
            );
            proc.stdin.end(document.getText());
            token.onCancellationRequested(() => {
                reject();
                proc.kill();
            });
        });    
    }

    parseDiagnostic(data: string): vscode.Diagnostic[] {
        let result: vscode.Diagnostic[] = []
        data.split('\n').forEach((line) => {
            let matched = line.match(CHECK_REGEXP);
            if (!matched) return;
            let range: vscode.Range;
            if (matched[3] == null) {
                let line = parseInt(matched[1], 10);
                let char = parseInt(matched[2], 10);
                range = new vscode.Range(line - 1, char - 1, line - 1, char - 1);
            } else {
                let ranges = parseRanges(matched[3]);
                range = new vscode.Range(
                    ranges[0].start.line - 1,
                    ranges[0].start.character - 1,                    
                    ranges[ranges.length - 1].end.line - 1,
                    ranges[ranges.length - 1].end.character - 1                    
                );
            }
            let msg: string = matched[5];
            let type: vscode.DiagnosticSeverity = str2diagserv(matched[4]);

            result.push(new vscode.Diagnostic(range, msg, type));
        });
        return result; 
    }    
}