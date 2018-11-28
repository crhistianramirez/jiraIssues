'use strict';

import { ExtensionContext, window } from 'vscode';
import { JiraIssuesProvider } from './jira-issues-provider'

export function activate(context: ExtensionContext) {
	window.registerTreeDataProvider('jiraIssues', new JiraIssuesProvider(context));
}
