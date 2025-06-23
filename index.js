#!/usr/bin/env node
const { Command } = require('commander')
const path = require('path')
const fs = require('fs')
const program = new Command()

const GRAPHQL_TYPE_MAPPING = {
  STRING: 'GraphQLString',
  INTEGER: 'GraphQLInt',
  BOOLEAN: 'GraphQLBoolean',
  DATE: 'GraphQLString',
  ENUM: 'GraphQLString',
  FLOAT: 'GraphQLFloat',
  TEXT: 'GraphQLString',
  JSON: 'GraphQLString'
}

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

function loadConfig() {
  const configPaths = [
    path.resolve(process.cwd(), '.typegenrc'),
    path.resolve(process.cwd(), '.typegenrc.json')
  ]

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      return config
    }
  }

  return {}
}

function capitalize(text) {
  return text.split('_').map(x => x.charAt(0).toUpperCase() + x.slice(1)).join('')
}

function generateTypes(modelFile, modelFolder, defaultTypesFolder) {
  const typeName = `${capitalize(modelFile)}Type`

  console.log(
    `🚧 Generating GraphQL object type for model: ${capitalize(modelFile)} in folder: ${defaultTypesFolder}/`
  )

  const graphqlFields = {}
  const graphqlImports = new Set()

  const modelInstance = require(`${path.resolve(modelFolder, modelFile)}`)
  const attributes = modelInstance.rawAttributes

  for (const [key, value] of Object.entries(attributes)) {
    const graphqlType = GRAPHQL_TYPE_MAPPING[value.type.key]
    graphqlImports.add(graphqlType)
    graphqlFields[key] = {
      type: graphqlType,
      description: value.comment || ''
    }
  }

  // create a file in the types folder with the name <model>Type.js
  const typeFilePath = path.join(defaultTypesFolder, `${capitalize(modelFile)}Type.js`)
  const fieldCode = generateGraphQLFieldCode(graphqlFields)
  const typeFileContent = `
    const { GraphQLObjectType, ${[...graphqlImports].join(
      ', '
    )} } = require('graphql')

    const ${typeName} = new GraphQLObjectType({
      name: '${typeName}',
      fields: () => (${fieldCode})
    });

    module.exports = ${typeName};
  `

  fs.writeFileSync(typeFilePath, typeFileContent)

  console.log(`✅ Type generated successfully in: ${typeFilePath}`)
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
  .option(
    '--all <all>',
    'Generate all types for all models in the model folder'
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
    const config = loadConfig()
    const modelFolder = options.modelFolder || config.modelFolder
    const typesFolder = options.typesFolder || config.typesFolder
    const { model, all } = options
    const defaultTypesFolder = typesFolder ? typesFolder : './src/schema/types'

    if (!all && !model) {
      console.error('Error: --model option is required')
      process.exit(1)
    }

    if (!modelFolder) {
      console.error(
        'Error: --model-folder option is required (either via flag or .typegenrc)'
      )
      process.exit(1)
    }

    if (all) {
      const models = fs
        .readdirSync(modelFolder)
        .filter((file) => file != 'index.js')
        .filter((file) => file != '.DS_Store')
        .map((file) => file.replace('.js', ''))

      models.forEach((modelFile) => {
        generateTypes(modelFile, modelFolder, defaultTypesFolder)
      })
    } else {
      generateTypes(model, modelFolder, defaultTypesFolder)
    }

    // const typeName = `${model.charAt(0).toUpperCase() + model.slice(1)}Type` // capitalize the model name
    // console.log(
    //   `Generating GraphQL object type for model: ${model.toUpperCase()} in folder: ${defaultTypesFolder}/`
    // )

    // const graphqlFields = {}

    // const attributes = modelInstance.rawAttributes

    // for (const [key, value] of Object.entries(attributes)) {
    //   const graphqlType = GRAPHQL_TYPE_MAPPING[value.type.key]
    //   graphqlFields[key] = {
    //     type: graphqlType,
    //     description: value.comment || ''
    //   }
    // }

    // create a file in the types folder with the name <model>Type.js
    // const typeFilePath = path.join(defaultTypesFolder, `${model}Type.js`)
    // const fieldCode = generateGraphQLFieldCode(graphqlFields)
    // const typeFileContent = `
    //   const { GraphQLObjectType, GraphQLInt, GraphQLBoolean, GraphQLString } = require('graphql')

    //   const ${typeName} = new GraphQLObjectType({
    //     name: '${typeName}',
    //     fields: () => (${fieldCode})
    //   });

    //   module.exports = ${typeName};
    // `
    // check if the typeFilePath already exists
    // if it exists prompt the user if the want to overwrite it or skip it
    // fs.writeFileSync(typeFilePath, typeFileContent)
  })

program.parse()
