import * as vscode from 'vscode';
import * as child_process from 'child_process';

import * as clang from './clang'


export class ConfigurationTester implements vscode.Disposable{
    processes: Map<number, child_process.ChildProcess>;
    constructor() {
        this.processes = new Map<number, child_process.ChildProcess>();
    }
    test(language: string): void {
        let [cmd, args] = clang.version(language);
        let proc = child_process.execFile(cmd, args, (error, stdout, stderr) => {
            if (error) {
                if ((<any>error).code == 'ENOENT') {
                    vscode.window.showErrorMessage('Please install [clang](http://clang.llvm.org/) or check configuration `clang.executable`')
                } else {
                    vscode.window.showErrorMessage('Please check your configurations')
                }
                vscode.window.showErrorMessage(stderr.toString());
            }
            this.processes.delete(proc.pid);
        });
        this.processes.set(proc.pid, proc);
    }
    dispose() {
        for (let proc of Array.from(this.processes.values())) {
            proc.kill();
        }
    }
}

export class ConfigurationViewer implements vscode.Disposable {
    chan: vscode.OutputChannel;
    constructor() {
        this.chan = vscode.window.createOutputChannel('Clang Configuration');
    }
    show(document: vscode.TextDocument) {
        let [command, args] = clang.command(document.languageId)
        this.chan.clear();
        this.chan.appendLine(`Executable: ${command}`);
        args.forEach((arg, i) => {
            this.chan.appendLine(`Option ${i}: ${arg}`);
        });
        this.chan.show(vscode.ViewColumn.Two);    
    }
    dispose() {
        this.chan.dispose();
    }
}