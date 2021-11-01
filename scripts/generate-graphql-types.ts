import fs from 'fs'
import path from 'path'

import { buildClientSchema } from 'graphql'
import { generate } from '@graphql-codegen/cli'

import { downloadIntrospectionSchema } from './download-introspection-schema'

const ADMIN_API_PATH = 'admin-api'
const SHOP_API_PATH = 'shop-api'

const ADMIN_SCHEMA_OUTPUT_FILE = path.join(__dirname, '../../schema-admin.json')
const SHOP_SCHEMA_OUTPUT_FILE = path.join(__dirname, '../../schema-shop.json')

// tslint:disable:no-console

Promise.all([
    downloadIntrospectionSchema(ADMIN_API_PATH, ADMIN_SCHEMA_OUTPUT_FILE),
    downloadIntrospectionSchema(SHOP_API_PATH, SHOP_SCHEMA_OUTPUT_FILE),
])
    .then(([adminSchemaSuccess, shopSchemaSuccess]) => {
        if (!adminSchemaSuccess || !shopSchemaSuccess) {
            console.log('Attempting to generate types from existing schema json files...')
        }

        const adminSchemaJson = JSON.parse(
            fs.readFileSync(ADMIN_SCHEMA_OUTPUT_FILE, 'utf-8')
        )
        const shopSchemaJson = JSON.parse(
            fs.readFileSync(SHOP_SCHEMA_OUTPUT_FILE, 'utf-8')
        )
        const adminSchema = buildClientSchema(adminSchemaJson.data)
        const shopSchema = buildClientSchema(shopSchemaJson.data)

        const config = {
            namingConvention: {
                enumValues: 'keep',
            },
            strict: true,
        }

        const disableTsLintPlugin = { add: { content: '// tslint:disable' } }
        const graphQlErrorsPlugin = path.join(
            __dirname,
            './codegen/plugins/graphql-errors-plugin.js'
        )
        console.log(`path:${__dirname}`)
        console.log(`full:${graphQlErrorsPlugin}`)
        const commonPlugins = [disableTsLintPlugin, 'typescript']
        const clientPlugins = [
            ...commonPlugins,
            'typescript-operations',
            'typescript-compatibility',
        ]

        return generate({
            overwrite: true,
            generates: {
                [path.join(
                    __dirname,
                    '../src/plugins/generated-graphql-admin-errors.ts'
                )]: {
                    schema: [ADMIN_SCHEMA_OUTPUT_FILE],
                    plugins: [disableTsLintPlugin, graphQlErrorsPlugin],
                },
                [path.join(__dirname, '../src/plugins/generated-graphql-shop-errors.ts')]:
                    {
                        schema: [SHOP_SCHEMA_OUTPUT_FILE],
                        plugins: [disableTsLintPlugin, graphQlErrorsPlugin],
                    },
                [path.join(__dirname, '../src/plugins/generated-shop-types.ts')]: {
                    schema: [SHOP_SCHEMA_OUTPUT_FILE],
                    plugins: commonPlugins,
                    config: {
                        ...config,
                        scalars: {
                            ID: 'string | number',
                        },
                        maybeValue: 'T',
                    },
                },
            },
        })
    })
    .then(
        result => {
            process.exit(0)
        },
        err => {
            console.error(err)
            process.exit(1)
        }
    )
