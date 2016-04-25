# C/C++ Clang

Completion and Diagnostic for C/C++/Objective-C using [Clang](http://clang.llvm.org/)

## Requirements

- Install [Clang](http://clang.llvm.org/)
    - For Max OS X, Clang is installed with Xcode Command Line Tools and `PATH` is configured automatically. 
- Configure the `PATH` environment variable so that you can execute `clang` command.
    - or specify `clang.executable` configuration (See the next section for detail) 

## Configuration

You can use configuration interface of Visual Studio Code. (Press `F1` and type `User Settings` or `Workspace Settings`)

### Common
- `clang.executable`: Clang command or the path to the Clang executable (default: `clang`)
- `clang.cflags`, `clang.cxxflags`, `clang.objcflags`: Compiler Options for C/C++/Objective-C

### Completion

- `clang.completion.enable`: Enable/disable completion feature (default: `true`)
- `clang.completion.maxBuffer`: Tolerable size of clang output for completion (default: `8 * 1024 * 1024` bytes)
- `clang.completion.triggerChars`: Trigger completion when the user types one of the characters (default: `[".". ":", ">"]`)

### Diagnostic

- `clang.diagnostic.enable`: Enable/disable diagnostic feature (default: `true`)
- `clang.diagnostic.maxBuffer`: Tolerable size of clang output for diagnostic. (default: `256 * 1024` bytes)
- `clang.diagnostic.delay`: The delay in millisecond after which diagnostic starts (default: `500`)

### Variables

Configurations support some variables which are available in `tasks.json`.
They can be used inside of strings (e.g. `"-I${workspaceRoot}/include"`)

- `${workspaceRoot}`
- `${cwd}`
- `${env.ENVIRONMENT_VARIABLE}`

### Note

Since version 0.2.0, `clang.diagnosticDelay`, `clang.enableCompletion`, `clang.enableDiagnostic` is deprecated. 
Please update as follows:

- `clang.enableCompletion` -> `clang.completion.enable`
- `clang.enableDiagnostic` -> `clang.diagnostic.enable` 
- `clang.diagnosticDelay` -> `clang.diagnostic.delay`

## Command

- `Show Executable and Compile Options`: Showing Clang executable and compile options for the active editor.

## Acknowledgements

- Regexp for parsing completion results of Clang is based [autocomplete-clang](https://github.com/yasuyuky/autocomplete-clang).

## Resources

- Repository: https://github.com/mitaki28/vscode-clang
- Support: https://github.com/mitaki28/vscode-clang/issues
