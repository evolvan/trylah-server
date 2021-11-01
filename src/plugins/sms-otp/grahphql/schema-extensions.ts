import { gql } from 'apollo-server-core'

export const schemaExtensions = gql`
    type PhoneNumberInvalidError implements ErrorResult {
        errorCode: ErrorCode!
        message: String!
    }
    type SmsOtpInvalidError implements ErrorResult {
        errorCode: ErrorCode!
        message: String!
    }
    type SmsOtpExpiredError implements ErrorResult {
        errorCode: ErrorCode!
        message: String!
    }

    union RequestCustomerSmsOtpResult = Success | PhoneNumberInvalidError
    union VerifyCustomerSmsOtpResult = Customer | SmsOtpInvalidError | SmsOtpExpiredError

    extend type Mutation {
        requestCustomerSmsOtp(phoneNumber: String!): RequestCustomerSmsOtpResult!
        verifyCustomerSmsOtp(phoneNumber: String!, otp: Int!): VerifyCustomerSmsOtpResult!
    }
`
