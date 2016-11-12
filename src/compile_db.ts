import * as path from 'path';
import * as fs from 'fs';

import * as vscode from 'vscode';

import * as variable from './variable';
import * as clang from './clang';

/// Represents an entry in a compilation database
export interface CompilationDatabaseEntry {
    directory: string;
    command: string;
    file: string;
}

/// The info for a document returned by the CompilationDatabase class
export interface CompileInfoForDocument {
    cwd: string;
    args: string[];
}

/// Helps access the CompilationDatabase
export class CompilationDatabase {
    private _watcher: vscode.FileSystemWatcher;
    private _data: Array<CompilationDatabaseEntry>;

    private _databasePath: string;
    public get databasePath(): string {
        return this._databasePath;
    }
    public set databasePath(v: string) {
        this._databasePath = v;
        this._reloadDatabase();
    }

    public get rawData() {
        return this._data;
    }

    constructor(dbpath: string) {
        this.databasePath = dbpath;
        // We reload our compile flags when the database file changes. We don't
        // want to read the db file each time we ask for flags, as this can add
        // latency to completions, especially on systems with slower filesystems
        const watcher = this._watcher = vscode.workspace.createFileSystemWatcher(this.databasePath);
        watcher.onDidCreate(this._reloadDatabase.bind(this));
        watcher.onDidChange(this._reloadDatabase.bind(this));
    }

    // Open the default compilation database file
    public static openDefault(): CompilationDatabase {
        let db_path = clang.getConf<string>('compilationDatabase');
        if (!db_path) {
            const bindir = vscode.workspace.getConfiguration('cmake').get<string>('buildDirectory') || '${workspaceRoot}/build';
            db_path = path.join(bindir, 'compile_commands.json');
        }
        db_path = variable.resolve(db_path);
        return new CompilationDatabase(db_path);
    }

    /// Reload the content of the database
    private _reloadDatabase(): Thenable<Array<CompilationDatabaseEntry>> {
        return new Promise<Array<CompilationDatabaseEntry>>((resolve, reject) => {
            fs.exists(this.databasePath, exists => {
                if (!exists) {
                    // If it isn't there, just say we have no entries
                    resolve(this._data = []);
                }
                else {
                    fs.readFile(this.databasePath, (err, buf) => {
                        this._data = JSON.parse(buf.toString());
                        resolve(this._data);
                    });
                }
            });
        });
    }

    // Gets the flags required to do completion. We only need include dirs,
    // preprocessor defines, warnings, and standard settings
    public static parseCommandLine(cmd: string): string[] {
        // This regex will split a command line into a list of strings
        const cmd_re = /('(\\'|[^'])*'|"(\\"|[^"])*"|(\\ |[^ ])+|[\w-]+)/g;
        const all_args = cmd.match(cmd_re)
            // Our regex will parse escaped quotes, but they remain. We must
            // remote them ourselves
            .map(arg => arg.replace(/\\(.)/g, '$1'));
        let ret_args = [];
        let i = 0;
        for (let i = 0; i < all_args.length; ++i) {
            let cur = all_args[i];
            // Check for include directories
            if (cur.startsWith('-I') || cur.startsWith('/I')) {
                cur = cur.replace(/^\//, '-');
                if (cur.length > 2) {
                    ret_args.push(cur);
                }
                else {
                    ret_args.push(cur, all_args[++i]);
                }
            }
            // System includes should also be included
            else if (cur.startsWith('-isystem')) {
                if (cur.length == '-isystem'.length) {
                    ret_args.push(cur);
                }
                else {
                    ret_args.push(cur, all_args[++i]);
                    continue;
                }
            }
            // Check for preprocessor definitions
            else if (cur.startsWith('-D') || cur.startsWith('/D')) {
                cur = cur.replace(/^\//, '-');
                if (cur.length > 2) {
                    ret_args.push(cur);
                }
                else {
                    ret_args.push(cur, all_args[++i]);
                }
            }
            // Check for warning settings
            else if (cur.startsWith('-W')) {
                ret_args.push(cur);
            }
            else if (cur.startsWith('-std=')) {
                ret_args.push(cur);
            }
        }
        return ret_args;
    }

    public infoForDocument(filepath: string): CompileInfoForDocument {
        const entries = this._data;
        if (!entries)
            return { args: [], cwd: null };
        // Because we also want to have flags for header files, we
        // must normalize the paths so that headers will receive
        // the appropriate compilation flags
        const stem = path => path
            .replace('\\', '/')
            .replace('source/', '')
            .replace('include/', '')
            .replace('src/', '')
            .replace('inc/')
            .replace('.hpp', '')
            .replace('.hxx', '')
            .replace('.h++', '')
            .replace('.hh', '')
            .replace('.h', '')
            .replace('.cpp', '')
            .replace('.cxx', '')
            .replace('.c++', '')
            .replace('.cc', '')
            .replace('.c', '');
        const norm_path = stem(filepath);
        let entry = entries.find(data => stem(data.file) === norm_path);
        if (!entry) {
            // Didn't find one for this file. Pick a random one :/
            entry = entries[(Math.random() * entries.length) | 0];
        }
        let comp_args = CompilationDatabase.parseCommandLine(entry.command);
        // Since we are compiling from stdin, we need to add the directory containing
        // the file to the include paths for that file.
        comp_args.push('-I' + path.dirname(filepath));
        return {
            args: comp_args,
            cwd: entry.directory,
        };
    }
}