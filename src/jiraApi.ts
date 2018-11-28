import { workspace } from 'vscode'
import { IJiraConfig } from './models/jiraConfig.interface';
import { IExtensionConfig } from './models/extensionConfig.interface';
const JiraApi = require('jira-client');
let config = workspace.getConfiguration('jira')

let jira = instantiateJira(config);
function instantiateJira(config: IExtensionConfig) {
    const urlParts = config.baseUrl.split('://');
    const protocol = urlParts[0];
    const host = urlParts[1];
    if(urlParts.length !== 2 || (protocol !== 'http' && protocol !== 'https')) {
        throw new Error('Please provide a valid base url');
    }
    const jiraConfig: IJiraConfig = {
        protocol,
        host,
        username: config.username,
        password: config.password,
        apiVersion: '2',
        strictSSL: false
    }
    return new JiraApi(jiraConfig)
}

jira.searchWithQueryFromConfig = () => {
    const jqlExpression = config.get('jqlExpression');
    return jira.searchJira(jqlExpression);
}

jira.setConfig = (newconfig: IExtensionConfig) => {
    config = newconfig;
    if(jira && jira.hasValidConfig) {
        jira = instantiateJira(newconfig);
    }
}

jira.hasValidConfig = (newconfig: IJiraConfig) =>{
    let valid = true;
    if(!newconfig) return valid = false;
    if(!newconfig.username || !newconfig.password || !newconfig.host || !newconfig.protocol) valid = false;
    return valid;
}

export default jira;