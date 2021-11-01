import { VendurePlugin, PluginCommonModule } from '@vendure/core'
import { SmsOtpService } from './services/sms-otp.service'
import { SmsOtp } from './entities/sms-otp.entity'
import { schemaExtensions } from './grahphql/schema-extensions'
import {
    SmsOtpResolver,
    RequestCustomerSmsOtpResultResolver,
    VerifyCustomerSmsOtpResultResolver,
} from './grahphql/sms-otp.resolver'

@VendurePlugin({
    imports: [PluginCommonModule],
    providers: [SmsOtpService],
    entities: [SmsOtp],
    shopApiExtensions: {
        schema: schemaExtensions,
        resolvers: [
            SmsOtpResolver,
            RequestCustomerSmsOtpResultResolver,
            VerifyCustomerSmsOtpResultResolver,
        ],
    },
})
export class SmsOtpPlugin {}
