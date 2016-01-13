import * as vscode from 'vscode';
import * as process from 'child_process';

export function command(language: string, ...options: string[]): string {
    let clangConf = vscode.workspace.getConfiguration('clang');
    let buf: string[] = [];
    buf.push(clangConf.get<string>('executable'));
    if (language === 'cpp') {
        buf.push(...clangConf.get<string[]>('cxxflags'));
        buf.push('-x', 'c++');
    } else if (language === 'c') {
        buf.push(...clangConf.get<string[]>('cflags'));
        buf.push('-x', 'c');
    } else if (language === 'objective-c') {
        buf.push(...clangConf.get<string[]>('objcflags'));
        buf.push('-x', 'objective-c');
    }
    buf.push(...options);
    return buf.join(' ');
}

export function complete(language: string, line: number, char: number): string {
    return command(language, 
        '-fsyntax-only',
        '-fparse-all-comments',
        '-Xclang', '-code-completion-macros',
        '-Xclang', '-code-completion-brief-comments',
        '-Xclang', `-code-completion-at='<stdin>:${line}:${char}'`,
        '-');
}

export function check(language: string): string {
    return command(language, 
        '-fsyntax-only',
        '-fno-caret-diagnostics',
        '-fdiagnostics-print-source-range-info',
        '-fno-color-diagnostics',
        '-');
}