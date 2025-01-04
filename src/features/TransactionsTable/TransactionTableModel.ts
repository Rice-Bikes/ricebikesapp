import type { JSONSchema, FromSchema } from "json-schema-to-ts";
import { wrapCompilerAsTypeGuard, $Compiler } from "json-schema-to-ts";
import Ajv from "ajv";

function bsverify<T>(data: unknown): data is T {
    return data === data;
}

/**
 * JSON schema for validating a workspace object.
 * This schema describes a workspace entity with:
 * - A `path` string property.
 * - A `doc` object property (mapping arbitrary string keys to string values).
 * - A `meta` object describing creation and modification metadata.
 */
export const workspaceSchema = {
  $id: "workspace.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "Workspace",
  type: "object",
  required: ["path", "doc", "meta"],
  properties: {
    path: { type: "string" },
    doc: {
      type: "object",
      additionalProperties: { type: "string" },
    },
    meta: {
      type: "object",
      required: ["createdBy", "createdAt", "lastModifiedBy", "lastModifiedAt"],
      properties: {
        createdBy: { type: "string" },
        createdAt: { type: "number" },
        lastModifiedBy: { type: "string" },
        lastModifiedAt: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

type CurrentBulkOperationResponse = FromSchema<typeof currentBulkOperationSchema>;

const currentBulkOperationSchema = {
    $id: "bulkop.json",
  $schema: "http://json-schema.org/draft-07/schema",
  title: "CurrentBulkOperation",
  type: "object",
  required: ["path", "doc", "meta"],
  properties: {
    completedAt : { type: "string" },
    createdAt : { type: "string" },
    errorCode : { type: "boolean" },
    fileSize : { type: "string" },
    id : { type: "string" },
    objectCount : { type: "string" },
    partialDataUrl : { type: "string" },
    query : { type: "string" },
    rootObjectCount : { type: "string" },
    status : { type: "string" },
    type : { type: "string" },
    url : { type: "string" },
  },
  additionalProperties: false,
} as const satisfies JSONSchema;

export type TypeGuard<T> = (data: unknown) => data is T;

const env = import.meta.env; // Vite Environment Variables
console.log("Vite Environment Variables", env);

 /**
 * Wrapper around fetch to return a Promise that resolves to the desired type.
 *
 * Returns null if the response body is empty. Use isT() and isEmpty() to
 * validate.
 *
 * @param url      url to fetch from
 * @param validate TypeGuard that validates the response
 * @param options  fetch options
 * @returns        a Promise that resolves to the unmarshaled JSON response
 * @throws         an error if the fetch fails, there is no response body, or
 *                 the response is not valid JSON
 */
function typedFetch<T>(
    url: string,
    validate: TypeGuard<T>,
    options?: RequestInit,
    // timeout: number = 5000,
  ): Promise<T> {
    console.log("fetching url", url);
  
    const req: Request = new Request(url, options);
    return fetch(req).then((response: Response) => {
      console.log("response:", response);
      if (!response.ok) {
        throw new Error(response.statusText);
      }
  
      if (response.status === 204) {
        return null as T;
      }
  
      return response.text().then((text: string) => {
        let data: unknown;
  
        if (text.length !== 0) {
          // Will throw an exception if the response is not valid JSON
          data = JSON.parse(text);
        }
  
        // Type of unmarshaled response needs to be validated
        if (validate(data)) {
          return data;
        }
  
        throw new Error(`invalid response: ${text}`);
      });
    });
  }

export class TransactionTableModel {

    private isCurrentBulkOperationResponse: (data: unknown) => data is CurrentBulkOperationResponse;
    private store_name: string;
    private api_version: string;
    private access_token: string;
    public constructor() {
        const ajv = new Ajv();
        const $compile: $Compiler = (schema) => ajv.compile(schema);
        const compile = wrapCompilerAsTypeGuard($compile);
        this.isCurrentBulkOperationResponse = compile(currentBulkOperationSchema);
        this.store_name = env.VITE_STORE_NAME;
        this.api_version = env.VITE_API_VERSION;
        this.access_token = env.VITE_ACCESS_TOKEN;
    }

    public startBulkTransaction(): Promise<unknown> {
        return typedFetch<unknown>(`https://${this.store_name}.myshopify.com/admin/api/${this.api_version}/graphql.json`, bsverify, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": this.access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `{
                  bulkOperationRunQuery(
                      query: "{     orders {         edges {             cursor         node {                                       cancelReason             cancelledAt                                       clientIp             closed             closedAt             confirmationNumber             confirmed             createdAt                          currentSubtotalLineItemsQuantity             currentTotalWeight                                       discountCode             discountCodes                          displayFulfillmentStatus             dutiesIncluded             edited             email             estimatedTaxes             fulfillable             fullyPaid             hasTimelineComment             id             landingPageDisplayText             landingPageUrl             legacyResourceId             merchantEditable             merchantEditableErrors             name             netPayment             note             paymentGatewayNames             phone             poNumber             presentmentCurrencyCode             processedAt             purchasingEntity             referralCode             referrerDisplayText             referrerUrl             refundable             registeredSourceUrl             requiresShipping             restockable             returnStatus             riskLevel             sourceIdentifier             sourceName             statusPageUrl             subtotalLineItemsQuantity             subtotalPrice             tags             taxExempt             taxesIncluded             test             totalCapturable             totalDiscounts             totalPrice             totalReceived             totalRefunded             totalShippingPrice             totalTax             totalWeight             unpaid             updatedAt         }      } } }"
                  ) {
                      bulkOperation {
                          completedAt
                          createdAt
                          errorCode
                          fileSize
                          id
                          objectCount
                          partialDataUrl
                          query
                          rootObjectCount
                          status
                          type
                          url
                      }
                      userErrors {
                          field
                          message
                      }
                  }
              }
        `,
        }),
      })
        }
    
    public pollTransactions(): Promise<CurrentBulkOperationResponse> {
        return typedFetch<CurrentBulkOperationResponse>(`https://${this.store_name}.myshopify.com/admin/api/${this.api_version}/graphql.json`, this.isCurrentBulkOperationResponse, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": this.access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: 
            `{
                {
                    currentBulkOperation(type: QUERY) {
                        completedAt
                        createdAt
                        errorCode
                        fileSize
                        id
                        objectCount
                        partialDataUrl
                        query
                        rootObjectCount
                        status
                        type
                        url
                    }
                }
            }`,
        }),
      })
    }

    public cancelBulkOperation(): Promise<TransactionTableModel[]> {
        return typedFetch<TransactionTableModel[]>(`https://${this.store_name}.myshopify.com/admin/api/${this.api_version}/graphql.json`, bsverify, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": this.access_token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: 
            `{
                {
                    currentBulkOperation(type: QUERY) {
                        completedAt
                        createdAt
                        errorCode
                        fileSize
                        id
                        objectCount
                        partialDataUrl
                        query
                        rootObjectCount
                        status
                        type
                        url
                    }
                }
            }`,
        }),
      })
    }

}
    
