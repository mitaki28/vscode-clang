import * as vscode from "vscode";
import * as path from "path";
import * as child_process from "child_process";

import * as clang from "./clang";
import * as execution from "./execution";

export const completionRe = /^COMPLETION: (.*?)(?: : (.*))?$/;
export const descriptionRe = /^(.*?)(?: : (.*))?$/;
export const returnTypeRe = /\[#([^#]+)#\]/ig;
export const argumentTypeRe = /\<#([^#]+)#\>/ig;
export const optionalArgumentLeftRe = /\{#(,? ?.+?)(?=#\}|\{#)/ig;
export const optionalArgumentRightRe = /#\}/ig;

const DELIMITERS = "~`!@#$%^&*()-+={}[]|\\'\";:/?<>,. \t\n";

function isDelimiter(c: string) {
    return DELIMITERS.indexOf(c) !== -1;
}

function findPreviousDelimiter(document: vscode.TextDocument, position: vscode.Position): vscode.Position {
    let line = position.line;
    let char = position.character;
    const s = document.getText(new vscode.Range(line, 0, line, char));
    while (char > 0 && !isDelimiter(s[char - 1])) char--;
    return new vscode.Position(line, char);
}


export class ClangCompletionItemProvider implements vscode.CompletionItemProvider {
    provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        return this.fetchCompletionItems(document, position, token)
            .then(
            (data) => {
                return this.parseCompletionItems(data);
            },
            (e: execution.FailedExecution) => {
                if (e.errorCode === execution.ErrorCode.BufferLimitExceed) {
                    vscode.window.showWarningMessage(
                        "Completion was interpreted due to rack of buffer size. " +
                        "The buffer size can be increased using `clang.completion.maxBuffer`. "
                    );
                }
                return [];
            }
            );
    }

    fetchCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<string> {
        // Currently, Clang does NOT complete token partially 
        // So we find a previous delimiter and start complete from there.
        let delPos = findPreviousDelimiter(document, position);
        let [cmd, args] = clang.complete(document.languageId, delPos.line + 1, delPos.character + 1);
        return execution.processString(cmd, args,
            {
                cwd: path.dirname(document.uri.fsPath),
                maxBuffer: clang.getConf<number>("completion.maxBuffer")
            },
            token,
            document.getText()
        ).then((result) => result.stdout.toString());
    }

    parseCompletionItem(line: string): vscode.CompletionItem | void {
        let matched = line.match(completionRe);
        if (matched == null) return;
        let [_line, symbol, description] = matched;
        let item = new vscode.CompletionItem(symbol);
        if (description == null) {
            item.detail = symbol;
            item.kind = vscode.CompletionItemKind.Class;
            return item;
        }
        let [_description, signature, comment] = description.match(descriptionRe);
        if (comment != null) {
            item.documentation = comment;
        }
        let hasValue = false;
        signature = signature.replace(returnTypeRe, (match: string, arg: string): string => {
            hasValue = true;
            return arg + " ";
        });
        signature = signature.replace(argumentTypeRe, (match: string, arg: string): string => {
            return arg;
        });
        signature = signature.replace(optionalArgumentLeftRe, (match: string, arg: string): string => {
            return arg + "=?";
        });
        signature = signature.replace(optionalArgumentRightRe, (match: string, arg: string): string => {
            return "";
        });
        item.detail = signature;
        if (signature.indexOf("(") !== -1) {
            item.kind = vscode.CompletionItemKind.Function;
        } else if (hasValue) {
            item.kind = vscode.CompletionItemKind.Variable;
        } else {
            item.kind = vscode.CompletionItemKind.Class;
        }
        return item;
    }

    parseCompletionItems(data: string): vscode.CompletionItem[] {
        let result: vscode.CompletionItem[] = [];
        data.split(/\r\n|\r|\n/).forEach((line) => {
            let item = this.parseCompletionItem(line);
            if (item instanceof vscode.CompletionItem) {
                result.push(item);
            }
        });
        return result;
    }
}
