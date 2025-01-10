import type { DocumentNode } from "graphql";
export const typeDefs = {
  "kind": "Document",
  "definitions": [{
    "kind": "SchemaExtension",
    "directives": [{
      "kind": "Directive",
      "name": { "kind": "Name", "value": "link" },
      "arguments": [{
        "kind": "Argument",
        "name": { "kind": "Name", "value": "url" },
        "value": {
          "kind": "StringValue",
          "value": "https://specs.apollo.dev/federation/v2.8",
          "block": false,
        },
      }, {
        "kind": "Argument",
        "name": { "kind": "Name", "value": "import" },
        "value": {
          "kind": "ListValue",
          "values": [{
            "kind": "StringValue",
            "value": "@key",
            "block": false,
          }],
        },
      }],
    }],
    "operationTypes": [{
      "kind": "OperationTypeDefinition",
      "type": {
        "kind": "NamedType",
        "name": { "kind": "Name", "value": "Query" },
      },
      "operation": "query",
    }, {
      "kind": "OperationTypeDefinition",
      "type": {
        "kind": "NamedType",
        "name": { "kind": "Name", "value": "Mutation" },
      },
      "operation": "mutation",
    }, {
      "kind": "OperationTypeDefinition",
      "type": {
        "kind": "NamedType",
        "name": { "kind": "Name", "value": "Subscription" },
      },
      "operation": "subscription",
    }],
  }, {
    "kind": "ObjectTypeDefinition",
    "name": { "kind": "Name", "value": "Query" },
    "interfaces": [],
    "directives": [],
    "fields": [{
      "kind": "FieldDefinition",
      "name": { "kind": "Name", "value": "aiThread" },
      "arguments": [{
        "kind": "InputValueDefinition",
        "name": { "kind": "Name", "value": "id" },
        "type": {
          "kind": "NonNullType",
          "type": {
            "kind": "NamedType",
            "name": { "kind": "Name", "value": "ID" },
          },
        },
        "directives": [],
      }],
      "type": {
        "kind": "NamedType",
        "name": { "kind": "Name", "value": "AiThread" },
      },
      "directives": [],
    }],
  }, {
    "kind": "ObjectTypeDefinition",
    "name": { "kind": "Name", "value": "Mutation" },
    "interfaces": [],
    "directives": [],
    "fields": [{
      "kind": "FieldDefinition",
      "name": { "kind": "Name", "value": "createAiThread" },
      "arguments": [{
        "kind": "InputValueDefinition",
        "name": { "kind": "Name", "value": "title" },
        "type": {
          "kind": "NonNullType",
          "type": {
            "kind": "NamedType",
            "name": { "kind": "Name", "value": "String" },
          },
        },
        "directives": [],
      }, {
        "kind": "InputValueDefinition",
        "name": { "kind": "Name", "value": "content" },
        "type": {
          "kind": "NonNullType",
          "type": {
            "kind": "NamedType",
            "name": { "kind": "Name", "value": "String" },
          },
        },
        "directives": [],
      }],
      "type": {
        "kind": "NamedType",
        "name": { "kind": "Name", "value": "AiThread" },
      },
      "directives": [],
    }],
  }, {
    "kind": "ObjectTypeDefinition",
    "name": { "kind": "Name", "value": "Subscription" },
    "interfaces": [],
    "directives": [],
    "fields": [{
      "kind": "FieldDefinition",
      "name": { "kind": "Name", "value": "aiThreadCreated" },
      "arguments": [],
      "type": {
        "kind": "NamedType",
        "name": { "kind": "Name", "value": "AiThread" },
      },
      "directives": [],
    }],
  }, {
    "kind": "ObjectTypeDefinition",
    "name": { "kind": "Name", "value": "AiThread" },
    "interfaces": [],
    "directives": [{
      "kind": "Directive",
      "name": { "kind": "Name", "value": "key" },
      "arguments": [{
        "kind": "Argument",
        "name": { "kind": "Name", "value": "fields" },
        "value": { "kind": "StringValue", "value": "id", "block": false },
      }],
    }],
    "fields": [{
      "kind": "FieldDefinition",
      "name": { "kind": "Name", "value": "id" },
      "arguments": [],
      "type": {
        "kind": "NonNullType",
        "type": {
          "kind": "NamedType",
          "name": { "kind": "Name", "value": "ID" },
        },
      },
      "directives": [],
    }, {
      "kind": "FieldDefinition",
      "name": { "kind": "Name", "value": "title" },
      "arguments": [],
      "type": {
        "kind": "NonNullType",
        "type": {
          "kind": "NamedType",
          "name": { "kind": "Name", "value": "String" },
        },
      },
      "directives": [],
    }, {
      "kind": "FieldDefinition",
      "name": { "kind": "Name", "value": "content" },
      "arguments": [],
      "type": {
        "kind": "NonNullType",
        "type": {
          "kind": "NamedType",
          "name": { "kind": "Name", "value": "String" },
        },
      },
      "directives": [],
    }],
  }],
} as unknown as DocumentNode;
