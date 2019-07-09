import * as path from 'path';
import { copy } from 'copy-paste';
import { EventEmitter, TreeDataProvider, TreeItem, ExtensionContext, 
	window, workspace, commands, Uri } from 'vscode';
import jiraFactory from './jiraFactory';
let jiraClient;

try {
	const config = workspace.getConfiguration('jira');
	jiraClient = jiraFactory.instantiateJira(config);
} catch(error) {
	jiraClient = {
		loadError: error.message
	}
}

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
		var that = this;
		if(jiraClient.loadError) {
			return [new TreeItem(jiraClient.loadError)];
		}
		try {
			return await jiraClient.searchWithQueryFromConfig()
				.then(async function(data: any){
					var children: JiraIssue[] = [];
					var promises = data.issues.map( async(issue: any) => {
						var description = `${issue.key}: (${issue.fields.status.name}) ${issue.fields.summary}`
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
					await Promise.all(promises);
					if(!children.length) {
						return [new TreeItem('No issues found - try updating jqlExpression')];
					}
					return children;
				})
		} catch(e){
			if(e.message.includes('Unauthorized (401)')) {
				return [new TreeItem('Username or password is incorrect')];
			}
			return [new TreeItem(`Error retrieving issues: ${JSON.stringify(e)}`)]
		}
	}

	private async refresh(config ?: any) {
		if (!this.fetching) {
			if(config) {
				try {
					jiraClient = jiraFactory.instantiateJira(config);
				} catch(error) {
					jiraClient = {
						loadError: error.message
					}
				}
			}
			this.children = await this.getChildren();
			this._onDidChangeTreeData.fire();
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
