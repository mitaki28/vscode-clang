import * as vscode from "vscode";

import * as variable from "./variable";
import * as state from "./state";

const renamedKeyMap: Map<string, string> = new Map<string, string>(
    new Array<[string, string]>(
        ["diagnostic.delay", "diagnosticDelay"],
        ["diagnostic.enable", "" + "enableDiagnostic"],
        ["completion.enable", `enableCompletion`]
    )
);

const insecureKeys: Set<string> = new Set<string>([
    'executable',
    `cflags`,
    `cflags`,
    'objcflags',
]);

export function checkInsecureKeys(): Thenable<void> {
    if (state.getWorkspaceState().getWorkspaceIsTrusted() !== undefined) {
        return Promise.resolve();
    }
    const customInsecureSettings = [];
    for (const key of insecureKeys) {
        if (getConf(key) !== undefined && JSON.stringify(getConf(key)) !== JSON.stringify(vscode.workspace.getConfiguration("clang").get(key))) {
            customInsecureSettings.push(key);
        }
    }

    return customInsecureSettings.length > 0 ? vscode.window.showWarningMessage(
        `Some of workspace-level setting (${customInsecureSettings.map((s) => "`clang." + s + "`").join(", ")}) is disabled by default. These settings may cause security issue, if you are opening a malicious workspace.Do you trust the current workspace and enable these settings?`,
        {modal: false},
        {title: "Yes"}, {title: "No"}, {title: "More Info"},
    ).then((answer: { title: any; }) => {
        switch (answer?.title) {
            case "Yes": {
                state.getWorkspaceState().updateWorkspaceIsTrusted(true);
                break;
            }
            case "No": {
                state.getWorkspaceState().updateWorkspaceIsTrusted(false);
                break;
            }
            case "More Info":
                vscode.env.openExternal(
                    vscode.Uri.parse(`https://github.com/mitaki28/vscode-clang/blob/master/README.md#Security`)
                );
                return checkInsecureKeys();
            default:
                // do nothing (keep unanswerd state)
        }
    }) : Promise.resolve();
}

export function getConf<T>(name: string): T {
    const conf = vscode.workspace.getConfiguration("clang");
    if (renamedKeyMap.has(name)) {
        let deprecatedName = renamedKeyMap.get(name)!;
        if (conf.has(deprecatedName)) {
            vscode.window.showWarningMessage(
                `clang.${deprecatedName} is deprecated. Please use ${name} instead.`
            );
            name = deprecatedName;
        }
    }
    if (!conf.has(name)) {
        throw new Error(`implementation error: ${name} is not defined`);
    }
    if (insecureKeys.has(name) && state.getWorkspaceState().getWorkspaceIsTrusted() !== true) {
        const inspection = conf.inspect<T>(name)!;
        return (inspection.globalLanguageValue ?? inspection.globalValue ?? inspection.defaultValue)!;
    } else {
        return conf.get<T>(name)!;
    }
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
    let args;
    args = [];
    args.push('-fsyntax-only');
    args.push('-fparse-all-comments');
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
