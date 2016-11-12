import * as path from "path";
import * as child_process from "child_process";

import * as vscode from "vscode";

import * as variable from "./variable";

const deprecatedMap: Map<string, string> = new Map<string, string>(
    new Array<[string, string]>(
        ["diagnostic.delay", "diagnosticDelay"],
        ["diagnostic.enable", "enableDiagnostic"],
        ["completion.enable", "enableCompletion"]
    )
);

export function getConf<T>(name: string): T {
    let conf = vscode.workspace.getConfiguration("clang");
    if (deprecatedMap.has(name)) {
        let depName = deprecatedMap.get(name);
        let value = conf.get<T>(depName);
        if (value != null) {
            vscode.window.showWarningMessage(
                `clang.${depName} is deprecated. Please use ${name} instead.`
            );
            return value;
        }
    }
    let value = conf.get<T>(name);
    if (value == null) {
        vscode.window.showErrorMessage(`Error: invalid configuration ${name}`);
    }
    return value;
}

export function command(language: string, ...options: string[]): [string, string[]] {
    let cmd = variable.resolve(getConf<string>("executable"));
    let args: string[] = [];
    if (language === "cpp") {
        args.push("-x", "c++");
        args.push(...getConf<string[]>("cxxflags").map(variable.resolve));
    } else if (language === "c") {
        args.push("-x", "c");
        args.push(...getConf<string[]>("cflags").map(variable.resolve));
    } else if (language === "objective-c") {
        args.push("-x", "objective-c");
        args.push(...getConf<string[]>("objcflags").map(variable.resolve));
    }
    args.push(...options);
    return [cmd, args];
}

export function complete(language: string, line: number, char: number): [string, string[]] {
    let args = [];
    args.push("-fsyntax-only");
    args.push("-fparse-all-comments");
    if (getConf<boolean>("completion.completeMacros")) {
        args.push("-Xclang", "-code-completion-macros");
    }
    args.push("-Xclang", "-code-completion-brief-comments");
    args.push("-Xclang", `-code-completion-at=<stdin>:${line}:${char}`);
    args.push("-");
    return command(language, ...args);
}

export function check(language: string): [string, string[]] {
    return command(language,
        "-fsyntax-only",
        "-fno-caret-diagnostics",
        "-fdiagnostics-print-source-range-info",
        "-fno-color-diagnostics",
        "-");
}

export function version(language: string): [string, string[]] {
    return command(language, "--version");
}
