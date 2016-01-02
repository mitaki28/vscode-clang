import * as vscode from 'vscode';
import * as process from 'child_process';

export function command(...options: string[]): string {
    let clangConf = vscode.workspace.getConfiguration('clang');
    let buf: string[] = [];
    buf.push(clangConf.get<string>('command'));
    // TODO configulation for C
    buf.push(...clangConf.get<string[]>('cxxflags'));
    buf.push('-x', 'c++');
    buf.push(...options);
    return buf.join(' ');
}

export function complete(line: number, char: number): string {
    return command(
        '-fsyntax-only',
        '-Xclang',
        `-code-completion-at='<stdin>:${line}:${char}'`,
        '-');
}

export function check(): string {
    return command(
        '-fsyntax-only',
        '-fno-caret-diagnostics',
        '-fdiagnostics-print-source-range-info',
        '-fno-color-diagnostics',
        '-');
}