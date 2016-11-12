import * as path from "path";
import * as vscode from "vscode";

export function resolve(s: string): string {
    return s.replace(/\$\{(.*?)\}/ig, (match: string, $1: string): string => {
        switch ($1) {
            case "workspaceRoot": {
                if (vscode.workspace.rootPath != null) {
                    return vscode.workspace.rootPath;
                } else {
                    vscode.window.showWarningMessage(`${"${workspaceRoot}"} is undefined. Alternatively use cwd (${process.cwd()}).`);
                    return process.cwd();
                }
            }
            case "cwd": {
                return process.cwd();
            }
        }
        if ($1.startsWith("env.")) {
            return process.env[$1.slice("env.".length)];
        }
        vscode.window.showWarningMessage(`configuration variable ${match} is not supported.`);
        return match;
    });
}
