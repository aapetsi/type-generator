#!/usr/bin/env node
const { Command } = require('commander')
const path = require('path')
const fs = require('fs')
const program = new Command()
const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLFloat
} = require('graphql')

function generateGraphQLFieldCode(fields) {
  return (
    '{\n' +
    Object.entries(fields)
      .map(([key, value]) => {
        return `  ${key}: { type: ${value.type} }`
      })
      .join(',\n') +
    '\n}'
  )
}

program
  .name('type-generator')
  .description('CLI to generate graphql types from a sequelize model')
  .version('1.0.0')

program
  .command('graphql:object')
  .description(
    `
    Generate a GraphQL object type from a Sequelize model
    Example: type-generator graphql:object --model=user --model-folder=./src/database/models --types-folder=./src/schema/types
`
  )
  .option('--model <model>', 'Sequelize model name')
  .option(
    '--model-folder <model-folder>',
    'Folder containing the Sequelize models'
  )
  .option(
    '--types-folder <types-folder>',
    'Folder containing the type definitions'
  )
  .action((options) => {
    const { model, modelFolder, typesFolder } = options

    if (!model) {
      console.error('Error: --model option is required')
      process.exit(1)
    }

    if (!modelFolder) {
      console.error('Error: --model-folder option is required')
      process.exit(1)
    }

    const typeName = `${model.charAt(0).toUpperCase() + model.slice(1)}Type` // capitalize the model name
    const defaultTypesFolder = typesFolder ? typesFolder : './src/schema/types'
    console.log(
      `Generating GraphQL object type for model: ${model.toUpperCase()} in folder: ${defaultTypesFolder}/`
    )

    const graphqlTypeMapping = {
      STRING: 'GraphQLString',
      INTEGER: 'GraphQLInt',
      BOOLEAN: 'GraphQLBoolean',
      DATE: 'GraphQLString',
      ENUM: 'GraphQLString',
      FLOAT: 'GraphQLFloat',
      TEXT: 'GraphQLString',
      JSON: 'GraphQLString'
    }

    const graphqlFields = {}

    const modelInstance = require(`${path.resolve(modelFolder, model)}`)
    const attributes = modelInstance.rawAttributes

    for (const [key, value] of Object.entries(attributes)) {
      const graphqlType = graphqlTypeMapping[value.type.key]
      graphqlFields[key] = {
        type: graphqlType,
        description: value.comment || ''
      }
    }

    const typeDefinition = new GraphQLObjectType({
      name: model,
      fields: () => graphqlFields
    })

    // create a file in the types folder with the name <model>Type.js
    const typeFilePath = path.join(defaultTypesFolder, `${model}Type.js`)
    const fieldCode = generateGraphQLFieldCode(graphqlFields)
    const typeFileContent = `
      const { GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLString } = require('graphql')

      const ${typeName} = new GraphQLObjectType({
        name: '${typeName}',
        fields: () => (${fieldCode})
      });

      module.exports = ${typeName};
    `
    fs.writeFileSync(typeFilePath, typeFileContent)
  })

program.parse()
