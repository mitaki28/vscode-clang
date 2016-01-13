# vscode-clang

Completion and Diagnostic for C/C++/Objective-C using Clang

## Configuration

You can change configuration from setting interface of Visual Studio Code. (Press `F1` and type `User Settings` or `Workspace Settings`)

- `clang.executable`: Clang command or the path to the Clang executable (default: `clang`)
- `clang.cflags`, `clang.cxxflags`, `clang.objcflags`: Compiler Options for C/C++/Objective-C


## Acknowledgements

- Regexp for parsing completion result of Clang is based [autocomplete-clang](https://github.com/yasuyuky/autocomplete-clang).
