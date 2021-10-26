import { I18nError } from '@vendure/core/dist/i18n/i18n-error';
import { LogLevel } from '@vendure/core';

export interface OTPAuthPluginOptions {
    otp: {
        strategyName?: string;
        clientId: string;
    };
}

export class StrategyNotSupportedError extends I18nError {
    constructor() {
        super('error.strategy-not-supported', {}, 'STRATEGY_NOT_SUPPORTED', LogLevel.Info);
    }
}

export type ExternalLoginMutationArgs = {
    strategy: string;
    token: string;
    identifier: string;
};

export type ExternalProfileData = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
};
