import { IJiraConfig } from './models/jiraConfig.interface';
import { IExtensionConfig } from './models/extensionConfig.interface';
const JiraApi = require('jira-client');

const jiraFactory = {
    instantiateJira,
    hasValidJiraConfig
}

function instantiateJira(config: IExtensionConfig) {
    if(!config.baseUrl) {
        throw new Error('Configuration missing - please check vscode settings');
    }
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
    let jira;
    try {
        jira = new JiraApi(jiraConfig)
    } catch(e) {
        console.log(e);
    }
    
    jira.loaded = true;

    jira.searchWithQueryFromConfig = async () => {
        const jqlExpression = config.get('jqlExpression');
        return await jira.searchJira(jqlExpression);
    }
    return jira;
}

function hasValidJiraConfig(newconfig: IJiraConfig){
    let valid = true;
    if(!newconfig) return valid = false;
    if(!newconfig.username || !newconfig.password || !newconfig.host || !newconfig.protocol) valid = false;
    return valid;
}

export default jiraFactory;