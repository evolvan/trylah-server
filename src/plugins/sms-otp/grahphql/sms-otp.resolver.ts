import { Args, Mutation, Resolver, ResolveField } from '@nestjs/graphql'
import { Ctx, Allow, Permission, Transaction, RequestContext, CustomerService } from '@vendure/core'

// generated typescript types
import {
    VerifyCustomerSmsOtpResult,
    RequestCustomerSmsOtpResult,
    MutationRequestCustomerSmsOtpArgs,
    MutationVerifyCustomerSmsOtpArgs,
} from '../../generated-shop-types'

// generated Vendure classes for errors
import { shopErrorOperationTypeResolvers } from '../../generated-graphql-shop-errors'

// services
import { SmsOtpService } from '../services/sms-otp.service'

@Resolver()
export class SmsOtpResolver {
    constructor(private customerService: CustomerService, private smsOtpService: SmsOtpService) {}

    // generate otp to send to phone number
    @Transaction()
    @Mutation()
    @Allow(Permission.Owner)
    async requestCustomerSmsOtp(
        @Args() args: MutationRequestCustomerSmsOtpArgs,
        @Ctx() ctx: RequestContext
    ): Promise<RequestCustomerSmsOtpResult> {
        return this.smsOtpService.generateOtp(ctx, args.phoneNumber)
    }

    @Transaction()
    @Mutation()
    @Allow(Permission.Owner)
    async verifyCustomerSmsOtp(
        @Args() args: MutationVerifyCustomerSmsOtpArgs,
        @Ctx() ctx: RequestContext
    ): Promise<VerifyCustomerSmsOtpResult> {
        return this.smsOtpService.verifyOtp(ctx, args.phoneNumber, args.otp)
    }
}

// union resolvers
@Resolver('RequestCustomerSmsOtpResult')
export class RequestCustomerSmsOtpResultResolver {
    @ResolveField()
    __resolveType(value: any) {
        return shopErrorOperationTypeResolvers.RequestCustomerSmsOtpResult.__resolveType(value)
    }
}

@Resolver('VerifyCustomerSmsOtpResult')
export class VerifyCustomerSmsOtpResultResolver {
    @ResolveField()
    __resolveType(value: any) {
        return shopErrorOperationTypeResolvers.VerifyCustomerSmsOtpResult.__resolveType(value)
    }
}
