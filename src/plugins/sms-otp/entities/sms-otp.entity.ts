import { DeepPartial, VendureEntity } from '@vendure/core'
import { Entity, Column } from 'typeorm'

@Entity()
export class SmsOtp extends VendureEntity {
    constructor(input?: DeepPartial<SmsOtp>) {
        super(input)
    }

    @Column({ unique: true })
    phoneNumber: string

    @Column()
    userIdentifier: string

    @Column()
    otp: number

    @Column({ type: Date })
    expiry: Date
}
