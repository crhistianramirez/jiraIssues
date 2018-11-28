export interface IJiraConfig{
    protocol?: string;
    host: string;
    username: string;
    password: string;
    apiVersion?: string;
    strictSSL?: boolean;
    jql?: string;
}