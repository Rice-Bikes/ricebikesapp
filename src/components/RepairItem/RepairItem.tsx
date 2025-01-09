import { createContext, useContext, useEffect, useState } from "react";
// import Papa from "papaparse"; // Import papaparse
import Ajv from "ajv";
import {
  wrapCompilerAsTypeGuard,
  $Compiler,
  FromSchema,
} from "json-schema-to-ts";
import type { JSONSchema } from "json-schema-to-ts";

const repairSchema = {
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Repair",
  type: "object",
  properties: {
    repair_id: { type: "string" },
    name: { type: "string" },
    description: { type: ["string", "null"] },
    price: { type: "number" },
    disabled: { type: "boolean" },
  },
  required: ["repair_id", "name", "price", "disabled", "description"],
} as const satisfies JSONSchema;

const repairArraySchema = {
  $id: "repairArray.json",
  type: "array",
  items: repairSchema,
} as const satisfies JSONSchema;

const repairResponseSchema = {
  $id: "repairResponse.json",
  type: "object",
  properties: {
    message: { type: "string" },
    responseObject: { type: "array" },
    statusCode: { type: "number" },
    success: { type: "boolean" },
  },
  required: ["message", "responseObject", "statusCode", "success"],
} as const satisfies JSONSchema;

export type Repair = FromSchema<typeof repairSchema>;
export type RepairResponse = FromSchema<typeof repairResponseSchema>;
export type RepairArray = FromSchema<typeof repairArraySchema>;

type RepairsContextType = {
  repairs: Repair[];
  loading: boolean;
};

const RepairsContext = createContext<RepairsContextType | undefined>(undefined);

export const RepairsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const hostname = import.meta.env.VITE_API_URL;
  const ajv = new Ajv();
  const $compile: $Compiler = (schema) => ajv.compile(schema);
  const compile = wrapCompilerAsTypeGuard($compile);
  const validateRepair: (data: unknown) => data is Repair =
    compile(repairSchema);
  const validateRepairsArray: (data: unknown) => data is Array<Repair> =
    compile(repairArraySchema);
  const validateRepairsResponse: (data: unknown) => data is RepairResponse =
    compile(repairResponseSchema);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loading || repairs.length > 0) {
      return;
    }
    //console.log('Fetching CSV file...');
    fetch(`${hostname}/repairs`)
      .then((response) => response.json())
      .then((itemsData: unknown) => {
        console.log("Raw repairs Data:", itemsData);
        if (!validateRepairsResponse(itemsData)) {
          throw new Error("Invalid repair response");
        }
        if (!itemsData.success) {
          throw new Error("Failed to load repairs");
        }
        console.log("repairs Array Data:", itemsData.responseObject);
        // if (!validaterepairsArray(itemsData.responseObject)) {
        //   throw new Error("Invalid part array");
        // }
        // validaterepairs(itemsData)}
        return itemsData.responseObject;
      })
      .then((repairsData: unknown[]) => {
        console.log("Mapped repairs Data:", repairsData);
        repairsData.forEach((part) => {
          if (!validateRepair(part)) {
            console.log("Invalid Part:", part);
            throw new Error("Invalid part found");
          }
        });

        if (!validateRepairsArray(repairsData)) {
          throw new Error("Invalid part array");
        }

        //console.log('Mapped Repairs Data:', repairsData);  // Check the mapped data structure

        setRepairs(repairsData);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading server data: ", error); // More detailed error logging
        setLoading(false);
      });
  }, []);

  return (
    <RepairsContext.Provider value={{ repairs, loading }}>
      {children}
    </RepairsContext.Provider>
  );
};

export const useRepairs = () => {
  const context = useContext(RepairsContext);
  if (!context) {
    throw new Error("useRepairs must be used within a RepairsProvider");
  }
  return context;
};
