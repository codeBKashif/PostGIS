export interface AppConfig {
    databaseUrl: string;
    jwtSecret: string;
    jwtExpiresIn: string;
    logger?: boolean;
    redisHost: string;
    redisPort: number;
}

export interface AuthPluginOptions {
    secret: string;
    expiresIn?: string;
}

export interface RouteOptions {
    jwtExpiresIn: string;
}

export interface SwaggerPluginOptions {
    apiVersion: string;
}