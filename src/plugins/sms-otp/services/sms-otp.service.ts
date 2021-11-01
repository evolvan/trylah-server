import { Injectable } from '@nestjs/common'
import {
    Ctx,
    UserService,
    RequestContext,
    CustomerService,
    InternalServerError,
    TransactionalConnection,
} from '@vendure/core'
import { SmsOtp } from '../entities/sms-otp.entity'
import {
    Success,
    Customer,
    VerifyCustomerSmsOtpResult,
    RequestCustomerSmsOtpResult,
} from '../../generated-shop-types'
import {
    PhoneNumberInvalidError,
    SmsOtpInvalidError,
    SmsOtpExpiredError,
} from '../../generated-graphql-shop-errors'

const successful: Success = { success: true }

@Injectable()
export class SmsOtpService {
    constructor(
        private userService: UserService,
        private customerService: CustomerService,
        private connection: TransactionalConnection
    ) {}

    async generateOtp(
        @Ctx() ctx: RequestContext,
        phoneNumber: string
    ): Promise<RequestCustomerSmsOtpResult> {
        // verify phone number validity
        if (!this.isValidPhoneNumber(phoneNumber)) {
            return new PhoneNumberInvalidError()
        }

        // find activeUser, assert ctx has activeUserId set
        let activeUser = await this.userService.getUserById(ctx, ctx.activeUserId!)

        const smsOtpRepository = this.connection.getRepository(SmsOtp)
        let record = await smsOtpRepository.findOne({ phoneNumber: phoneNumber })
        if (!record) {
            record = smsOtpRepository.create()
            record.phoneNumber = phoneNumber
        }
        // assert activeUser will have identifier field
        record.userIdentifier = activeUser?.identifier!
        record.otp = this.makeOtp()
        record.expiry = this.makeExpiry(3)
        await smsOtpRepository.save(record)
        return successful
    }

    async verifyOtp(
        @Ctx() ctx: RequestContext,
        phoneNumber: string,
        otp: number
    ): Promise<VerifyCustomerSmsOtpResult> {
        const smsOtpRepository = this.connection.getRepository(SmsOtp)
        const record = await smsOtpRepository.findOne({ phoneNumber: phoneNumber })
        if (!record) {
            throw new InternalServerError('Cannot find matching phone number.')
        }
        if (otp !== record.otp) {
            return new SmsOtpInvalidError()
        }
        if (new Date() > record.expiry) {
            return new SmsOtpExpiredError()
        }

        //valid otp, update customer phone number, and phone number verified status
        // find current customer, assert ctx has activeUserId set
        const customer = await this.customerService.findOneByUserId(ctx, ctx.activeUserId!)
        // result should return Customer
        const result: unknown = await this.customerService.update(ctx, {
            id: customer!.id,
            phoneNumber: phoneNumber,
        })
        return result as Customer
    }

    /** Verify if phone number is a valid Singapore number
     * Valid Singapore phone number are 9xxxxxxx or 8xxxxxxx
     */
    private isValidPhoneNumber(n: string) {
        let re = /^[89]\d{7}/
        return re.test(n.replace(/[^0-9]/g, ''))
    }

    /** Generate a random 6-digit code as OTP */
    private makeOtp(): number {
        return Math.floor(100000 + Math.random() * 900000)
    }

    /** Generate expiry date x minutes from Now */
    private makeExpiry(offset: number): Date {
        const now = new Date()
        let expiry = new Date(now)
        expiry.setMinutes(now.getMinutes() + offset)
        return expiry
    }
}
