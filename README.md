# C/C++ Clang

Completion and Diagnostic for C/C++/Objective-C using [Clang](http://clang.llvm.org/)

## Requirements

- Install [Clang](http://clang.llvm.org/)
    - For Max OS X, Clang is installed with XCode Command Line Tools and `PATH` is configured automatically. 
- Configure the `PATH` environment variable so that you can execute `clang` command.
    - or specify `clang.executable` configuration (See the next section for detail) 

## Configuration

You can use configuration interface of Visual Studio Code. (Press `F1` and type `User Settings` or `Workspace Settings`)

- `clang.executable`: Clang command or the path to the Clang executable (default: `clang`)
- `clang.cflags`, `clang.cxxflags`, `clang.objcflags`: Compiler Options for C/C++/Objective-C
- `clang.diagnosticDelay`: The delay in millisecond after which diagnostic starts (default: 500)

## Acknowledgements

- Regexp for parsing completion results of Clang is based [autocomplete-clang](https://github.com/yasuyuky/autocomplete-clang).

## Resources

- Repository: https://github.com/mitaki28/vscode-clang
- Support: https://github.com/mitaki28/vscode-clang/issues
