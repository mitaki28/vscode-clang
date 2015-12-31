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

export function exec(...options: string[]): process.ChildProcess {
    return process.exec(command(...options));
}

export function complete(text: string, line: number, char: number) {
    let proc = exec(
        '-fsyntax-only',
        '-Xclang',
        `-code-completion-at='<stdin>:${line}:${char}'`,
        '-');
    proc.stdin.write(text, () => {
        proc.stdin.end();
    });
    return proc;
}

export function check(text: string): process.ChildProcess {
    let proc = exec(
        '-fsyntax-only',
        '-fno-caret-diagnostics',
        '-fdiagnostics-print-source-range-info',
        '-fno-color-diagnostics',
        '-');
    proc.stdin.write(text, () => {
        proc.stdin.end();
    });
    return proc;
}