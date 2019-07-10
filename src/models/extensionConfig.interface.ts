import { WorkspaceConfiguration } from 'vscode';

export interface IExtensionConfig extends WorkspaceConfiguration { 
    baseUrl?: string;
    port?: string;
    username?: string;
    apiToken?: string;
    jqlExpression?: string;
    password?: string; // deprecated
}