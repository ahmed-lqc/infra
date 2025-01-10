/**
 * A simple interface for a service that holds a typed config object.
 */
export interface ConfigService<SchemaType> {
  getConfig(): SchemaType;
}
