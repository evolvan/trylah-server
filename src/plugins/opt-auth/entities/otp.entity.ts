import { DeepPartial, User, VendureEntity } from '@vendure/core';
import { Column, Entity, ManyToOne } from 'typeorm';

@Entity()
export class Otp extends VendureEntity {
    constructor(input?: DeepPartial<Otp>) {
        super(input);
    }

    @Column()
    user_otp!: number;

    @Column()
    identifier!: string;

    @Column()
    expires!: Date;

    @Column()
    invalidated: boolean = false;
}
