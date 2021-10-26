import { Mutation, Args, Context, Resolver } from '@nestjs/graphql';
import { Allow, Ctx, RequestContext, Permission, User, ConfigService, Transaction } from '@vendure/core';
import { Request, Response } from 'express';
import { ExternalLoginMutationArgs } from '../types';
import { getUserChannelsPermissions, CurrentUser, CurrentUserChannel, setSessionToken } from '../internal-types';
import { ExternalAuthService } from '../services';

@Resolver()
export class ExternalAuthResolver {
    constructor(private externalAuthService: ExternalAuthService, private configService: ConfigService) {}

    @Mutation()
    @Transaction()
    @Allow(Permission.Public)
    async loginExternal(
        @Args() args: ExternalLoginMutationArgs,
        @Ctx() ctx: RequestContext,
        @Context('req') req: Request,
        @Context('res') res: Response,
    ): Promise<CurrentUser> {
        return await this.createExternalAuthSession(ctx, args, req, res);
    }

    private async createExternalAuthSession(
        ctx: RequestContext,
        args: ExternalLoginMutationArgs,
        req: Request,
        res: Response,
    ) {
        console.log(args);

        const session = await this.externalAuthService.authenticate(ctx, args.token, args.identifier);

        setSessionToken({
            sessionToken: session.token,
            rememberMe: true,
            authOptions: this.configService.authOptions,
            req,
            res,
        });

        return this.publiclyAccessibleUser(session.user);
    }

    private publiclyAccessibleUser(user: User): CurrentUser {
        return {
            id: user.id as string,
            identifier: user.identifier,
            channels: getUserChannelsPermissions(user) as CurrentUserChannel[],
        };
    }

    @Transaction()
    @Mutation()
    async generateOTP(@Ctx() ctx: RequestContext, @Args() input: any) {
        return await this.externalAuthService.generateOTP(ctx, input);
    }
}
