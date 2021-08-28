import * as path from 'path';
import { copy } from 'copy-paste';
import { EventEmitter, TreeDataProvider, TreeItem, ExtensionContext, 
	window, workspace, commands, Uri } from 'vscode';
import jiraService from './jiraService';
import { IExtensionConfig } from './models/extensionConfig.interface';

const config = workspace.getConfiguration('jira');
jiraService.setConfiguration(config);

class JiraIssue extends TreeItem {
	constructor(label: string, public item: any) {
		super(label);
	}
}

export class JiraIssuesProvider implements TreeDataProvider<TreeItem> {

	private _onDidChangeTreeData = new EventEmitter<TreeItem | undefined>();
	readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

	private fetching: boolean = false;
	private lastFetch: number;
	private children: TreeItem[] | undefined;

	constructor(private context: ExtensionContext) {
		context.subscriptions.push(commands.registerCommand('jiraIssues.refresh', this.refresh, this));
		context.subscriptions.push(commands.registerCommand('jiraIssues.copyJiraIssue', this.copyJiraIssue, this));
		context.subscriptions.push(commands.registerCommand('jiraIssues.openIssue', this.openIssue, this));
		context.subscriptions.push(window.onDidChangeActiveTextEditor(this.poll, this));

		context.subscriptions.push(workspace.onDidChangeConfiguration(() => {
			const newconfig = workspace.getConfiguration('jira');
			this.refresh(newconfig);
		}));
	}

	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	async getChildren(): Promise<TreeItem[]> {
		return await this.getJiraIssues();
	}

	private async getJiraIssues(): Promise<TreeItem[]>{
		const that = this;
		if(jiraService.isInFaultedState) {
			return [new TreeItem(jiraService.errorMessage)];
		}
		try {
			return await jiraService.searchWithQueryFromConfig()
				.then(async function(data: any){
					let children: JiraIssue[] = [];
					let requests = data.issues.map( async(issue: any) => {
						const description = `${issue.key}: (${issue.fields.status.name}) ${issue.fields.summary}`
						const jiraIssue = new JiraIssue(description, issue);
						if (issue.fields.resolution == null) {
							var icon = `${issue.fields.issuetype.name.toLowerCase()}.svg`;
						} else {
							var icon = `${issue.fields.issuetype.name.toLowerCase()}_complete.svg`;
						};
						jiraIssue.iconPath = {
							light: that.context.asAbsolutePath(path.join('assets', 'icons', 'light', icon)),
							dark: that.context.asAbsolutePath(path.join('assets', 'icons', 'dark', icon))
						}
						jiraIssue.command = {
							title: 'Open',
							command: 'jiraIssues.openIssue',
							arguments: [jiraIssue]
						}
						jiraIssue.contextValue = 'issue';
						children.push(jiraIssue);
					});
					await Promise.all(requests);
					if(!children.length) {
						return [new TreeItem('No issues found - try updating jqlExpression')];
					}
					return children;
				})
		} catch(e){
			if(e.message.includes('Unauthorized (401)')) {
				return [new TreeItem('Username or api token is incorrect')];
			}
			return [new TreeItem(`Error retrieving issues: ${e.message}`)]
		}
	}

	private async refresh(newConfig ?: IExtensionConfig) {
		if (!this.fetching) {
			if(newConfig) {
				jiraService.setConfiguration(newConfig);
			}
			this.children = await this.getChildren();
			this._onDidChangeTreeData.fire(null);
		}
	}

	private async poll() {
		const thirtyMinutes = 30 * 60 * 1000;
		if (!this.lastFetch || (this.lastFetch + thirtyMinutes < Date.now())) {
			return this.refresh();
		}
	}

	private openIssue(issue: JiraIssue) {
		var base = issue.item.self.split('/rest')[0];
		var url = Uri.parse(`${base}/browse/${issue.item.key}`)
		commands.executeCommand('vscode.open', url);
	}

	private copyJiraIssue(issue: JiraIssue) {
		copy(issue.item.key);
	}
}