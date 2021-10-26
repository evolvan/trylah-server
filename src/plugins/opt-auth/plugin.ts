import { PluginCommonModule, RuntimeVendureConfig, Type, VendurePlugin } from '@vendure/core';
import { apiExtensions } from './graphql/schema-extensions';
import { ExternalAuthResolver } from './graphql/otp-auth.resolver';
import { ExternalAuthService, OTPVerificationService, SessionUtilsService } from './services';
import { OTPAuthPluginOptions } from './types';
import { Otp } from './entities/otp.entity';

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [ExternalAuthService, OTPVerificationService, SessionUtilsService],
    entities: [Otp],
    shopApiExtensions: {
        schema: apiExtensions,
        resolvers: [ExternalAuthResolver],
    },
    // configuration: (config) => OTPAuthPlugin.configure(config),
})
export class OTPAuthPlugin {
    // private static options: OTPAuthPluginOptions;
    // static init(options: OTPAuthPluginOptions): Type<OTPAuthPlugin> {
    // 	OTPAuthPlugin.options = {
    // 		...options
    // 	};
    // 	return this;
    // }
    // static configure(config: RuntimeVendureConfig): RuntimeVendureConfig {
    // 	// Any configuration goes here
    // 	return config;
    // }
}
