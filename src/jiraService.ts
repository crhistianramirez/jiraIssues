import * as JiraApi from 'jira-client';
import { IExtensionConfig } from './models/extensionConfig.interface';

class JiraService {
    public isInFaultedState: boolean = false;
    public errorMessage: string = '';
    private api;
    private config:IExtensionConfig = null;

    setConfiguration(config: IExtensionConfig) {
        try {
            if(!config.baseUrl) {
                throw new Error('Missing configuration jira.baseUrl. Please update vscode settings');
            }
            if(!config.username) {
                throw new Error('Missing configuration jira.username. Please update vscode settings.');
            }
            if(!config.apiToken && !config.password) {
                throw new Error('Missing configuration jira.apiToken. Please update vscode settings.');
            }
            const baseUrl = config.baseUrl.endsWith('/') ? config.baseUrl.slice(0, -1) : config.baseUrl;
            const [protocol, host] = baseUrl.split('://');
            if(!host || (protocol !== 'http' && protocol != 'https')) {
                throw new Error('Please provide a valid base url');
            }
            this.api = new JiraApi({
                protocol,
                host,
                port: config.port,
                username: config.username,
                password: config.apiToken || config.password,
                apiVersion: '2',
                strictSSL: false
            })
            this.config = config;
            this.isInFaultedState = false;
            this.errorMessage = null;
        } catch(e) {
            this.config = null;
            this.isInFaultedState = true;
            this.errorMessage = e.message || 'An error occurred';
            this.api = null;
        }
    }
    
    searchWithQueryFromConfig = async() => {
        const jqlExpression = this.config.jqlExpression;
        return await this.api.searchJira(jqlExpression);
    }
}

export default new JiraService();