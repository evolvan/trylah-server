import { gql } from 'apollo-server-core';

export const apiExtensions = gql`
    extend type Mutation {
        loginExternal(token: String!, identifier: String!): CurrentUser!
        generateOTP(identifier: String): Success!
    }
`;
