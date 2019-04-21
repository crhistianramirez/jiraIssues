export interface IJiraConfig{
    protocol?: string;
    host: string;
    port?: string;
    username: string;
    password: string;
    apiVersion?: string;
    strictSSL?: boolean;
    jql?: string;
}