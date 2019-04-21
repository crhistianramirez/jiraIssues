import { WorkspaceConfiguration } from 'vscode';

export interface IExtensionConfig extends WorkspaceConfiguration { 
    baseUrl?: string;
    port?: string;
    username?: string;
    password?: string;
    jqlExpression?: string;
}