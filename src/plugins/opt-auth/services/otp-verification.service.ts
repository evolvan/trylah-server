import { Inject, Injectable } from '@nestjs/common';
import { ExternalProfileData } from '../types';
import { Ctx, RequestContext, TransactionalConnection, UnauthorizedError } from '@vendure/core';

import { Otp } from '../entities/otp.entity';
import { Raw } from 'typeorm';

@Injectable()
export class OTPVerificationService {
    constructor(private connection: TransactionalConnection) {}

    async verify(@Ctx() ctx: RequestContext, input: any): Promise<ExternalProfileData> {
        const otpRepository = this.connection.getRepository(ctx, Otp);
        const userOTP = await otpRepository.findOne({
            where: [
                {
                    identifier: input.identifier,
                    user_otp: input.otp,
                    invalidated: false,
                    expires: Raw(alias => `${alias} > datetime('now')`),
                },
            ],
        });
        if (userOTP) {
            userOTP.invalidated = true;
            await otpRepository.save(userOTP);
            const profileData: ExternalProfileData = {
                id: userOTP?.identifier,
                email: userOTP.identifier!,
                firstName: userOTP.identifier || '',
                lastName: userOTP.identifier || '',
            };
            return profileData;
        } else {
            throw new UnauthorizedError();
        }
    }
}
