import {jsonSchemaTransform} from "fastify-type-provider-zod";

const EXAMPLE_UUID = "123e4567-e89b-12d3-a456-426614174000";
const MIN_SAFE_INTEGER_SENTINEL = Number.MIN_SAFE_INTEGER;
const MAX_SAFE_INTEGER_SENTINEL = Number.MAX_SAFE_INTEGER;

interface OpenApiSchemaNode {
  type?: string | string[];
  format?: string;
  example?: unknown;
  minimum?: number;
  maximum?: number;
  properties?: Record<string, OpenApiSchemaNode>;
  items?: OpenApiSchemaNode | OpenApiSchemaNode[];
  oneOf?: OpenApiSchemaNode[];
  anyOf?: OpenApiSchemaNode[];
  allOf?: OpenApiSchemaNode[];
  [key: string]: unknown;
}

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const asSchemaNode = (value: unknown): OpenApiSchemaNode | null => {
  if (!isRecord(value)) {
    return null;
  }

  return value as OpenApiSchemaNode;
};

const hasType = (node: OpenApiSchemaNode, expected: "integer" | "number" | "string"): boolean => {
  if (node.type === expected) {
    return true;
  }

  return Array.isArray(node.type) && node.type.includes(expected);
};

const isDomainUuidKey = (propName: string): boolean => {
  if (propName.startsWith("stripe") && propName.endsWith("Id")) {
    return false;
  }

  return propName === "id" || propName.endsWith("Id");
};

const isStripeIdKey = (propName: string): boolean => {
  return propName.startsWith("stripe") && propName.endsWith("Id");
};

const stripeExampleFor = (propName: string): string => {
  const key = propName.toLowerCase();

  if (key.includes("price")) {
    return "price_1OpenSGAExample000000000000";
  }

  if (key.includes("product")) {
    return "prod_OpenSGAExample000000";
  }

  if (key.includes("customer")) {
    return "cus_OpenSGAExample000000";
  }

  return "stripe_example_id";
};

const numericExampleFor = (propName: string): number => {
  const key = propName.toLowerCase();

  if (key.startsWith("ch")) {
    return 40;
  }

  if (
    key.startsWith("quantidade") ||
    key.startsWith("total") ||
    key.includes("count") ||
    key.endsWith("count")
  ) {
    return 0;
  }

  return 1;
};

const sanitizeSchemaList = (list: unknown): void => {
  if (!Array.isArray(list)) {
    return;
  }

  for (const item of list) {
    sanitizeOpenApiSchema(item);
  }
};

const stripSafeIntegerSentinels = (schema: OpenApiSchemaNode): void => {
  if (schema.minimum === MIN_SAFE_INTEGER_SENTINEL) {
    delete schema.minimum;
  }

  if (schema.maximum === MAX_SAFE_INTEGER_SENTINEL) {
    delete schema.maximum;
  }
};

export const sanitizeOpenApiSchema = (node: unknown, propName?: string): void => {
  const schema = asSchemaNode(node);
  if (!schema) {
    return;
  }

  if (propName !== undefined) {
    if (schema.format === "uuid" || isDomainUuidKey(propName)) {
      schema.type = "string";
      schema.format = "uuid";
      schema.example = EXAMPLE_UUID;
    } else if (isStripeIdKey(propName) && schema.example === undefined) {
      schema.type = "string";
      schema.example = stripeExampleFor(propName);
    }

    if ((hasType(schema, "integer") || hasType(schema, "number")) && schema.example === undefined) {
      schema.example = numericExampleFor(propName);
    }

    stripSafeIntegerSentinels(schema);
  } else {
    if (schema.format === "uuid" && schema.example === undefined) {
      schema.type = "string";
      schema.format = "uuid";
      schema.example = EXAMPLE_UUID;
    }

    if ((hasType(schema, "integer") || hasType(schema, "number")) && schema.example === undefined) {
      schema.example = 1;
    }

    stripSafeIntegerSentinels(schema);
  }

  if (schema.properties) {
    for (const [key, child] of Object.entries(schema.properties)) {
      sanitizeOpenApiSchema(child, key);
    }
  }

  if (schema.items !== undefined) {
    if (Array.isArray(schema.items)) {
      sanitizeSchemaList(schema.items);
    } else {
      sanitizeOpenApiSchema(schema.items);
    }
  }

  sanitizeSchemaList(schema.oneOf);
  sanitizeSchemaList(schema.anyOf);
  sanitizeSchemaList(schema.allOf);
};

const FASTIFY_SCHEMA_PARTS = ["body", "params", "querystring", "headers"] as const;

export const sanitizeFastifyRouteSchema = (routeSchema: unknown): void => {
  const schema = asSchemaNode(routeSchema);
  if (!schema) {
    return;
  }

  for (const part of FASTIFY_SCHEMA_PARTS) {
    if (part in schema) {
      sanitizeOpenApiSchema(schema[part]);
    }
  }

  if (isRecord(schema.response)) {
    for (const responseSchema of Object.values(schema.response)) {
      sanitizeOpenApiSchema(responseSchema);
    }
  }
};

export const openApiTransform: typeof jsonSchemaTransform = (input) => {
  const transformed = jsonSchemaTransform(input);

  if (isRecord(transformed) && "schema" in transformed) {
    sanitizeFastifyRouteSchema(transformed.schema);
  }

  return transformed;
};
