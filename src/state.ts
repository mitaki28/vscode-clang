import * as vscode from "vscode";

const KEYS = {
    WORKSPACE_IS_TRUSTED: 'WORKSPACE_IS_TRUSTED',
} as const;

export class WorkspaceState {
    constructor(private state: vscode.Memento) {

    }

    getWorkspaceIsTrusted(): boolean|undefined {
        return this.state.get<boolean>(KEYS.WORKSPACE_IS_TRUSTED);
    }

    updateWorkspaceIsTrusted(value: boolean): Thenable<void> {
        return this.state.update(KEYS.WORKSPACE_IS_TRUSTED, value);
    }

    reset(): Thenable<void> {
        let result: Thenable<void> = Promise.resolve();
        for (const key of Object.keys(KEYS)) {
            result = result.then(() => this.state.update(key, undefined));
        }
        return result;
    }
}
let workspaceState: WorkspaceState;
export function initWorkspaceState(state: vscode.Memento) {
    workspaceState = new WorkspaceState(state);
}
export function getWorkspaceState(): WorkspaceState {
    if (workspaceState === undefined) {
        throw new Error('workspaceState is not initialized');
    }
    return workspaceState;
}

