// export type Json =
//   | string
//   | number
//   | boolean
//   | null
//   | Record<string, Json>
//   | Json[];

type JsonPrimitive = string | number | boolean | null;
interface JsonMap {
  [member: string]: JsonPrimitive | JsonArray | JsonMap;
}
export type JsonArray = (JsonPrimitive | JsonArray | JsonMap)[];
export type Json = JsonPrimitive | JsonMap | JsonArray;
