import { Inject, Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/typeorm';
import {
    AuthenticatedSession,
    Customer,
    EventBus,
    InternalServerError,
    normalizeEmailAddress,
    RequestContext,
    RoleService,
    UnauthorizedError,
    User,
    AttemptedLoginEvent,
    LoginEvent,
    AccountRegistrationEvent,
} from '@vendure/core';
import { Connection } from 'typeorm';
import { Otp } from '../entities/otp.entity';

import { ExternalProfileData, StrategyNotSupportedError } from '../types';

import { OTPVerificationService } from './otp-verification.service';
import { SessionUtilsService } from './session-utils.service';

@Injectable()
export class ExternalAuthService {
    constructor(
        @InjectConnection() private connection: Connection,
        private sessionUtilsService: SessionUtilsService,
        private roleService: RoleService,
        private otpService: OTPVerificationService,
        private eventBus: EventBus,
    ) {}

    async authenticate(ctx: RequestContext, token: string, identifier: string) {
        this.eventBus.publish(new AttemptedLoginEvent(ctx, token));
        let profileData: ExternalProfileData;
        try {
            profileData = await this.otpService.verify(ctx, {
                otp: token,
                identifier,
            });
        } catch (up: any) {
            if (up instanceof StrategyNotSupportedError || up instanceof UnauthorizedError) {
                throw up; //haha
            }

            throw new InternalServerError(up.message);
        }

        let user = await this.getUserByIdentifier(profileData.id);
        if (!user) {
            user = await this.createExternalUser(profileData);
            this.eventBus.publish(new AccountRegistrationEvent(ctx, user));
        }

        if (ctx.session && ctx.session.activeOrderId) {
            await this.sessionUtilsService.deleteSessionsByActiveOrder(ctx.session && ctx.session.activeOrderId);
        }

        const session = await this.sessionUtilsService.createNewAuthenticatedSession(ctx, user);
        const newSession = await this.connection.getRepository(AuthenticatedSession).save(session);

        this.eventBus.publish(new LoginEvent(ctx, user));
        return newSession;
    }

    private async getUserByIdentifier(identifier: string): Promise<User | undefined> {
        const user = await this.connection.getRepository(User).findOne({
            where: { identifier },
            relations: ['roles', 'roles.channels'],
        });

        return user;
    }

    private async createExternalUser(profileData: ExternalProfileData): Promise<User> {
        const user = new User({
            identifier: profileData.id,
            verified: true,
            roles: [await this.roleService.getCustomerRole()],
        });
        await this.connection.getRepository(User).save(user);

        const customer = new Customer({
            emailAddress: normalizeEmailAddress(profileData.email),
            firstName: profileData.firstName,
            lastName: profileData.lastName,
            user: user,
        });
        await this.connection.getRepository(Customer).save(customer);

        return await this.connection.getRepository(User).findOneOrFail({
            where: { identifier: profileData.id },
            relations: ['roles', 'roles.channels'],
        });
    }

    async generateOTP(ctx: RequestContext, input: any) {
        if (input.identifier) {
            const otp = await this.generate(6);
            const otpRepository = this.connection.getRepository(Otp);

            let userOTP = await otpRepository.findOne({
                where: [{ identifier: input.identifier }],
            });
            if (!userOTP) userOTP = new Otp({});

            userOTP.identifier = input.identifier;
            userOTP.user_otp = otp;
            /** Assign expiry time to the otp */
            const otpExpiryTime = new Date();
            otpExpiryTime.setMinutes(otpExpiryTime.getMinutes() + 3);
            userOTP.expires = otpExpiryTime;
            userOTP.invalidated = false;
            await otpRepository.save(userOTP);
            return { success: true };
        } else return { success: false };
    }
    /** Generate OTP as per provided length as parameter */
    generate(len: number): number {
        return Math.floor(100000 + Math.random() * 900000);
    }
}
