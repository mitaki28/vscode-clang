import * as path from "path"
import * as child_process from 'child_process';

import * as vscode from 'vscode';

import * as variable from "./variable"

export function command(language: string, ...options: string[]): [string, string[]] {
    let clangConf = vscode.workspace.getConfiguration('clang');
    let cmd = variable.resolve(clangConf.get<string>('executable'));
    let args: string[] = [];    
    if (language === 'cpp') {
        args.push(...clangConf.get<string[]>('cxxflags').map(variable.resolve));
        args.push('-x', 'c++');
    } else if (language === 'c') {
        args.push(...clangConf.get<string[]>('cflags').map(variable.resolve));
        args.push('-x', 'c');
    } else if (language === 'objective-c') {
        args.push(...clangConf.get<string[]>('objcflags').map(variable.resolve));
        args.push('-x', 'objective-c');
    }
    args.push(...options);
    return [cmd, args];
}

export function complete(language: string, line: number, char: number): [string, string[]] {
    return command(language, 
            '-fsyntax-only',
            '-fparse-all-comments',
            '-Xclang', '-code-completion-macros',
            '-Xclang', '-code-completion-brief-comments',
            '-Xclang', `-code-completion-at=<stdin>:${line}:${char}`,
            '-');    
}

export function check(language: string): [string, string[]] {
    return command(language, 
        '-fsyntax-only',
        '-fno-caret-diagnostics',
        '-fdiagnostics-print-source-range-info',
        '-fno-color-diagnostics',
        '-');
}