import { createContext, useContext, useEffect, useState } from "react";
// import Papa from "papaparse"; // Import papaparse
import Ajv from "ajv";
import {
  wrapCompilerAsTypeGuard,
  $Compiler,
  FromSchema,
} from "json-schema-to-ts";
import type { JSONSchema } from "json-schema-to-ts";

const partSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Part",
  type: "object",
  properties: {
    upc: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    brand: { type: ["string", "null"] },
    stock: { type: ["number", "null"] },
    minimum_stock: { type: ["number", "null"] },
    standard_price: { type: "number" },
    wholesale_cost: { type: "number" },
    condition: { type: ["string", "null"] },
    disabled: { type: ["boolean", "null"] },
    managed: { type: ["boolean", "null"] },
    category_1: { type: ["string", "null"] },
    category_2: { type: ["string", "null"] },
    category_3: { type: ["string", "null"] },
    specifications: { type: ["object", "null"] }, // Assuming JSON can be any valid JSON
    features: { type: ["array", "null"] }, // Assuming JSON can be any valid JSON
  },
  required: [
    "upc",
    "name",
    "stock",
    "minimum_stock",
    "standard_price",
    "wholesale_cost",
    "condition",
    "disabled",
    "managed",
    "specifications",
    "features",
  ],
} as const satisfies JSONSchema;

const partArraySchema = {
  $id: "partArray.json",
  type: "array",
  items: partSchema,
} as const satisfies JSONSchema;

const partResponseSchema = {
  $id: "partResponse.json",
  type: "object",
  properties: {
    message: { type: "string" },
    responseObject: { type: "array" },
    statusCode: { type: "number" },
    success: { type: "boolean" },
    additionalProperties: false,
  },
  required: ["message", "responseObject", "statusCode", "success"],
  additionalProperties: false,
} as const satisfies JSONSchema;
export type Part = FromSchema<typeof partSchema>;
export type PartArray = FromSchema<typeof partArraySchema>;
export type PartResponse = FromSchema<typeof partResponseSchema>;

type PartsContextType = {
  parts: Part[];
  loading: boolean;
};

const PartsContext = createContext<PartsContextType | undefined>(undefined);

export const PartsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const hostname = import.meta.env.VITE_API_URL;
  const ajv = new Ajv();
  const $compile: $Compiler = (schema) => ajv.compile(schema);
  const compile = wrapCompilerAsTypeGuard($compile);
  const validatePartsResponse: (data: unknown) => data is PartResponse =
    compile(partResponseSchema);
  const validatePartsArray: (data: unknown) => data is Part[] =
    compile(partArraySchema);
  const validatePart: (data: unknown) => data is Part = compile(partSchema);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);

  console.log("partscontext:", PartsContext);
  console.log(parts, loading);

  useEffect(() => {
    if (!loading || parts.length > 0) {
      return;
    }
    fetch(`${hostname}/items`)
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw Parts Data:", itemsData);
        if (!validatePartsResponse(itemsData)) {
          throw new Error("Invalid part response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load parts");
        }
        console.log(" Parts Array Data:", itemsData.responseObject);
        // if (!validatePartsArray(itemsData.responseObject)) {
        //   throw new Error("Invalid part array");
        // }
        // validateParts(itemsData)}
        return itemsData.responseObject;
      })
      .then((partsData: unknown[]) => {
        console.log("Mapped Parts Data:", partsData);
        partsData.forEach((part) => {
          if (!validatePart(part)) {
            console.log("Invalid Part:", part);
            throw new Error("Invalid part found");
          }
        });

        if (!validatePartsArray(partsData)) {
          throw new Error("Invalid part array");
        }
        setParts(partsData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading or parsing CSV file: ", error);
        setLoading(false);
      });
  }, []);
  console.log("children", children);
  return (
    <PartsContext.Provider value={{ parts, loading }}>
      {children}
    </PartsContext.Provider>
  );
};

export const useParts = () => {
  const context = useContext(PartsContext);
  if (!context) {
    throw new Error("useParts must be used within a PartsProvider");
  }
  return context;
};
