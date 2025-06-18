# Type Generator CLI

A simple CLI tool to generate GraphQL `ObjectType` definitions from Sequelize models.

---

## ✨ Features

- Converts Sequelize models to GraphQL `ObjectType` files
- Maps common Sequelize types to GraphQL types
- Supports custom output directory
- Works as a CLI tool (`type-generator graphql:object ...`)

---

## 📦 Installation

```bash
npm install -g @apetsiampiah/type-generator
```

## 🚀 Usage

```bash
type-generator graphql:object \
 --model=user \
 --model-folder=./src/database/models \
 --types-folder=./src/schema/types
```

## ⚒️ Example Output

```js
const {
  GraphQLObjectType,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLString
} = require('graphql')

const UserType = new GraphQLObjectType({
  name: 'UserType',
  fields: () => ({
    id: { type: GraphQLInt },
    name: { type: GraphQLString },
    active: { type: GraphQLBoolean }
  })
})

module.exports = UserType
```

## 🧩 Coming Soon

- GraphQL Input Type generator
- Auto-generated Enums
- Support for associations / nested types

## 🤝 Contributing

PRs welcome! Feel free to open issues or feature suggestions.
