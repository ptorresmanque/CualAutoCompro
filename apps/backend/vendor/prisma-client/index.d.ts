
/**
 * Client
**/

import * as runtime from '@prisma/client/runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Brand
 * 
 */
export type Brand = $Result.DefaultSelection<Prisma.$BrandPayload>
/**
 * Model Model
 * 
 */
export type Model = $Result.DefaultSelection<Prisma.$ModelPayload>
/**
 * Model Version
 * 
 */
export type Version = $Result.DefaultSelection<Prisma.$VersionPayload>
/**
 * Model EquipmentItem
 * 
 */
export type EquipmentItem = $Result.DefaultSelection<Prisma.$EquipmentItemPayload>
/**
 * Model VersionEquipment
 * 
 */
export type VersionEquipment = $Result.DefaultSelection<Prisma.$VersionEquipmentPayload>
/**
 * Model MaintenanceCost
 * 
 */
export type MaintenanceCost = $Result.DefaultSelection<Prisma.$MaintenanceCostPayload>
/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Comparison
 * 
 */
export type Comparison = $Result.DefaultSelection<Prisma.$ComparisonPayload>
/**
 * Model ComparisonItem
 * 
 */
export type ComparisonItem = $Result.DefaultSelection<Prisma.$ComparisonItemPayload>
/**
 * Model Favorite
 * 
 */
export type Favorite = $Result.DefaultSelection<Prisma.$FavoritePayload>

/**
 * ##  Prisma Client ʲˢ
 * 
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Brands
 * const brands = await prisma.brand.findMany()
 * ```
 *
 * 
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   * 
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Brands
   * const brands = await prisma.brand.findMany()
   * ```
   *
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): void;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb, ExtArgs>

      /**
   * `prisma.brand`: Exposes CRUD operations for the **Brand** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Brands
    * const brands = await prisma.brand.findMany()
    * ```
    */
  get brand(): Prisma.BrandDelegate<ExtArgs>;

  /**
   * `prisma.model`: Exposes CRUD operations for the **Model** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Models
    * const models = await prisma.model.findMany()
    * ```
    */
  get model(): Prisma.ModelDelegate<ExtArgs>;

  /**
   * `prisma.version`: Exposes CRUD operations for the **Version** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Versions
    * const versions = await prisma.version.findMany()
    * ```
    */
  get version(): Prisma.VersionDelegate<ExtArgs>;

  /**
   * `prisma.equipmentItem`: Exposes CRUD operations for the **EquipmentItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EquipmentItems
    * const equipmentItems = await prisma.equipmentItem.findMany()
    * ```
    */
  get equipmentItem(): Prisma.EquipmentItemDelegate<ExtArgs>;

  /**
   * `prisma.versionEquipment`: Exposes CRUD operations for the **VersionEquipment** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more VersionEquipments
    * const versionEquipments = await prisma.versionEquipment.findMany()
    * ```
    */
  get versionEquipment(): Prisma.VersionEquipmentDelegate<ExtArgs>;

  /**
   * `prisma.maintenanceCost`: Exposes CRUD operations for the **MaintenanceCost** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more MaintenanceCosts
    * const maintenanceCosts = await prisma.maintenanceCost.findMany()
    * ```
    */
  get maintenanceCost(): Prisma.MaintenanceCostDelegate<ExtArgs>;

  /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs>;

  /**
   * `prisma.comparison`: Exposes CRUD operations for the **Comparison** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Comparisons
    * const comparisons = await prisma.comparison.findMany()
    * ```
    */
  get comparison(): Prisma.ComparisonDelegate<ExtArgs>;

  /**
   * `prisma.comparisonItem`: Exposes CRUD operations for the **ComparisonItem** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ComparisonItems
    * const comparisonItems = await prisma.comparisonItem.findMany()
    * ```
    */
  get comparisonItem(): Prisma.ComparisonItemDelegate<ExtArgs>;

  /**
   * `prisma.favorite`: Exposes CRUD operations for the **Favorite** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Favorites
    * const favorites = await prisma.favorite.findMany()
    * ```
    */
  get favorite(): Prisma.FavoriteDelegate<ExtArgs>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError
  export import NotFoundError = runtime.NotFoundError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics 
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 5.22.0
   * Query Engine version: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion 

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    * 
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    * 
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   * 
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? K : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Brand: 'Brand',
    Model: 'Model',
    Version: 'Version',
    EquipmentItem: 'EquipmentItem',
    VersionEquipment: 'VersionEquipment',
    MaintenanceCost: 'MaintenanceCost',
    User: 'User',
    Comparison: 'Comparison',
    ComparisonItem: 'ComparisonItem',
    Favorite: 'Favorite'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb extends $Utils.Fn<{extArgs: $Extensions.InternalArgs, clientOptions: PrismaClientOptions }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], this['params']['clientOptions']>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, ClientOptions = {}> = {
    meta: {
      modelProps: "brand" | "model" | "version" | "equipmentItem" | "versionEquipment" | "maintenanceCost" | "user" | "comparison" | "comparisonItem" | "favorite"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Brand: {
        payload: Prisma.$BrandPayload<ExtArgs>
        fields: Prisma.BrandFieldRefs
        operations: {
          findUnique: {
            args: Prisma.BrandFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.BrandFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload>
          }
          findFirst: {
            args: Prisma.BrandFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.BrandFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload>
          }
          findMany: {
            args: Prisma.BrandFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload>[]
          }
          create: {
            args: Prisma.BrandCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload>
          }
          createMany: {
            args: Prisma.BrandCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.BrandDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload>
          }
          update: {
            args: Prisma.BrandUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload>
          }
          deleteMany: {
            args: Prisma.BrandDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.BrandUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.BrandUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$BrandPayload>
          }
          aggregate: {
            args: Prisma.BrandAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateBrand>
          }
          groupBy: {
            args: Prisma.BrandGroupByArgs<ExtArgs>
            result: $Utils.Optional<BrandGroupByOutputType>[]
          }
          count: {
            args: Prisma.BrandCountArgs<ExtArgs>
            result: $Utils.Optional<BrandCountAggregateOutputType> | number
          }
        }
      }
      Model: {
        payload: Prisma.$ModelPayload<ExtArgs>
        fields: Prisma.ModelFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ModelFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ModelFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload>
          }
          findFirst: {
            args: Prisma.ModelFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ModelFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload>
          }
          findMany: {
            args: Prisma.ModelFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload>[]
          }
          create: {
            args: Prisma.ModelCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload>
          }
          createMany: {
            args: Prisma.ModelCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ModelDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload>
          }
          update: {
            args: Prisma.ModelUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload>
          }
          deleteMany: {
            args: Prisma.ModelDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ModelUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ModelUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ModelPayload>
          }
          aggregate: {
            args: Prisma.ModelAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateModel>
          }
          groupBy: {
            args: Prisma.ModelGroupByArgs<ExtArgs>
            result: $Utils.Optional<ModelGroupByOutputType>[]
          }
          count: {
            args: Prisma.ModelCountArgs<ExtArgs>
            result: $Utils.Optional<ModelCountAggregateOutputType> | number
          }
        }
      }
      Version: {
        payload: Prisma.$VersionPayload<ExtArgs>
        fields: Prisma.VersionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VersionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VersionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload>
          }
          findFirst: {
            args: Prisma.VersionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VersionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload>
          }
          findMany: {
            args: Prisma.VersionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload>[]
          }
          create: {
            args: Prisma.VersionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload>
          }
          createMany: {
            args: Prisma.VersionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.VersionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload>
          }
          update: {
            args: Prisma.VersionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload>
          }
          deleteMany: {
            args: Prisma.VersionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VersionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VersionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionPayload>
          }
          aggregate: {
            args: Prisma.VersionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVersion>
          }
          groupBy: {
            args: Prisma.VersionGroupByArgs<ExtArgs>
            result: $Utils.Optional<VersionGroupByOutputType>[]
          }
          count: {
            args: Prisma.VersionCountArgs<ExtArgs>
            result: $Utils.Optional<VersionCountAggregateOutputType> | number
          }
        }
      }
      EquipmentItem: {
        payload: Prisma.$EquipmentItemPayload<ExtArgs>
        fields: Prisma.EquipmentItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EquipmentItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EquipmentItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload>
          }
          findFirst: {
            args: Prisma.EquipmentItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EquipmentItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload>
          }
          findMany: {
            args: Prisma.EquipmentItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload>[]
          }
          create: {
            args: Prisma.EquipmentItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload>
          }
          createMany: {
            args: Prisma.EquipmentItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EquipmentItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload>
          }
          update: {
            args: Prisma.EquipmentItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload>
          }
          deleteMany: {
            args: Prisma.EquipmentItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EquipmentItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EquipmentItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EquipmentItemPayload>
          }
          aggregate: {
            args: Prisma.EquipmentItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEquipmentItem>
          }
          groupBy: {
            args: Prisma.EquipmentItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<EquipmentItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.EquipmentItemCountArgs<ExtArgs>
            result: $Utils.Optional<EquipmentItemCountAggregateOutputType> | number
          }
        }
      }
      VersionEquipment: {
        payload: Prisma.$VersionEquipmentPayload<ExtArgs>
        fields: Prisma.VersionEquipmentFieldRefs
        operations: {
          findUnique: {
            args: Prisma.VersionEquipmentFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.VersionEquipmentFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload>
          }
          findFirst: {
            args: Prisma.VersionEquipmentFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.VersionEquipmentFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload>
          }
          findMany: {
            args: Prisma.VersionEquipmentFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload>[]
          }
          create: {
            args: Prisma.VersionEquipmentCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload>
          }
          createMany: {
            args: Prisma.VersionEquipmentCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.VersionEquipmentDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload>
          }
          update: {
            args: Prisma.VersionEquipmentUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload>
          }
          deleteMany: {
            args: Prisma.VersionEquipmentDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.VersionEquipmentUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.VersionEquipmentUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$VersionEquipmentPayload>
          }
          aggregate: {
            args: Prisma.VersionEquipmentAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateVersionEquipment>
          }
          groupBy: {
            args: Prisma.VersionEquipmentGroupByArgs<ExtArgs>
            result: $Utils.Optional<VersionEquipmentGroupByOutputType>[]
          }
          count: {
            args: Prisma.VersionEquipmentCountArgs<ExtArgs>
            result: $Utils.Optional<VersionEquipmentCountAggregateOutputType> | number
          }
        }
      }
      MaintenanceCost: {
        payload: Prisma.$MaintenanceCostPayload<ExtArgs>
        fields: Prisma.MaintenanceCostFieldRefs
        operations: {
          findUnique: {
            args: Prisma.MaintenanceCostFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.MaintenanceCostFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload>
          }
          findFirst: {
            args: Prisma.MaintenanceCostFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.MaintenanceCostFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload>
          }
          findMany: {
            args: Prisma.MaintenanceCostFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload>[]
          }
          create: {
            args: Prisma.MaintenanceCostCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload>
          }
          createMany: {
            args: Prisma.MaintenanceCostCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.MaintenanceCostDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload>
          }
          update: {
            args: Prisma.MaintenanceCostUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload>
          }
          deleteMany: {
            args: Prisma.MaintenanceCostDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.MaintenanceCostUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.MaintenanceCostUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$MaintenanceCostPayload>
          }
          aggregate: {
            args: Prisma.MaintenanceCostAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateMaintenanceCost>
          }
          groupBy: {
            args: Prisma.MaintenanceCostGroupByArgs<ExtArgs>
            result: $Utils.Optional<MaintenanceCostGroupByOutputType>[]
          }
          count: {
            args: Prisma.MaintenanceCostCountArgs<ExtArgs>
            result: $Utils.Optional<MaintenanceCostCountAggregateOutputType> | number
          }
        }
      }
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Comparison: {
        payload: Prisma.$ComparisonPayload<ExtArgs>
        fields: Prisma.ComparisonFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ComparisonFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ComparisonFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload>
          }
          findFirst: {
            args: Prisma.ComparisonFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ComparisonFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload>
          }
          findMany: {
            args: Prisma.ComparisonFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload>[]
          }
          create: {
            args: Prisma.ComparisonCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload>
          }
          createMany: {
            args: Prisma.ComparisonCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ComparisonDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload>
          }
          update: {
            args: Prisma.ComparisonUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload>
          }
          deleteMany: {
            args: Prisma.ComparisonDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ComparisonUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ComparisonUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonPayload>
          }
          aggregate: {
            args: Prisma.ComparisonAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateComparison>
          }
          groupBy: {
            args: Prisma.ComparisonGroupByArgs<ExtArgs>
            result: $Utils.Optional<ComparisonGroupByOutputType>[]
          }
          count: {
            args: Prisma.ComparisonCountArgs<ExtArgs>
            result: $Utils.Optional<ComparisonCountAggregateOutputType> | number
          }
        }
      }
      ComparisonItem: {
        payload: Prisma.$ComparisonItemPayload<ExtArgs>
        fields: Prisma.ComparisonItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ComparisonItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ComparisonItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload>
          }
          findFirst: {
            args: Prisma.ComparisonItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ComparisonItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload>
          }
          findMany: {
            args: Prisma.ComparisonItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload>[]
          }
          create: {
            args: Prisma.ComparisonItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload>
          }
          createMany: {
            args: Prisma.ComparisonItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.ComparisonItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload>
          }
          update: {
            args: Prisma.ComparisonItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload>
          }
          deleteMany: {
            args: Prisma.ComparisonItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ComparisonItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.ComparisonItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ComparisonItemPayload>
          }
          aggregate: {
            args: Prisma.ComparisonItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateComparisonItem>
          }
          groupBy: {
            args: Prisma.ComparisonItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<ComparisonItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.ComparisonItemCountArgs<ExtArgs>
            result: $Utils.Optional<ComparisonItemCountAggregateOutputType> | number
          }
        }
      }
      Favorite: {
        payload: Prisma.$FavoritePayload<ExtArgs>
        fields: Prisma.FavoriteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FavoriteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FavoriteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload>
          }
          findFirst: {
            args: Prisma.FavoriteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FavoriteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload>
          }
          findMany: {
            args: Prisma.FavoriteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload>[]
          }
          create: {
            args: Prisma.FavoriteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload>
          }
          createMany: {
            args: Prisma.FavoriteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.FavoriteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload>
          }
          update: {
            args: Prisma.FavoriteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload>
          }
          deleteMany: {
            args: Prisma.FavoriteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FavoriteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.FavoriteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FavoritePayload>
          }
          aggregate: {
            args: Prisma.FavoriteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFavorite>
          }
          groupBy: {
            args: Prisma.FavoriteGroupByArgs<ExtArgs>
            result: $Utils.Optional<FavoriteGroupByOutputType>[]
          }
          count: {
            args: Prisma.FavoriteCountArgs<ExtArgs>
            result: $Utils.Optional<FavoriteCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
  }


  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type BrandCountOutputType
   */

  export type BrandCountOutputType = {
    models: number
  }

  export type BrandCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    models?: boolean | BrandCountOutputTypeCountModelsArgs
  }

  // Custom InputTypes
  /**
   * BrandCountOutputType without action
   */
  export type BrandCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the BrandCountOutputType
     */
    select?: BrandCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * BrandCountOutputType without action
   */
  export type BrandCountOutputTypeCountModelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelWhereInput
  }


  /**
   * Count Type ModelCountOutputType
   */

  export type ModelCountOutputType = {
    versions: number
    favorites: number
  }

  export type ModelCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    versions?: boolean | ModelCountOutputTypeCountVersionsArgs
    favorites?: boolean | ModelCountOutputTypeCountFavoritesArgs
  }

  // Custom InputTypes
  /**
   * ModelCountOutputType without action
   */
  export type ModelCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ModelCountOutputType
     */
    select?: ModelCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ModelCountOutputType without action
   */
  export type ModelCountOutputTypeCountVersionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VersionWhereInput
  }

  /**
   * ModelCountOutputType without action
   */
  export type ModelCountOutputTypeCountFavoritesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FavoriteWhereInput
  }


  /**
   * Count Type VersionCountOutputType
   */

  export type VersionCountOutputType = {
    equipmentItems: number
    maintenanceCosts: number
    comparisonItems: number
    favorites: number
  }

  export type VersionCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    equipmentItems?: boolean | VersionCountOutputTypeCountEquipmentItemsArgs
    maintenanceCosts?: boolean | VersionCountOutputTypeCountMaintenanceCostsArgs
    comparisonItems?: boolean | VersionCountOutputTypeCountComparisonItemsArgs
    favorites?: boolean | VersionCountOutputTypeCountFavoritesArgs
  }

  // Custom InputTypes
  /**
   * VersionCountOutputType without action
   */
  export type VersionCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionCountOutputType
     */
    select?: VersionCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * VersionCountOutputType without action
   */
  export type VersionCountOutputTypeCountEquipmentItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VersionEquipmentWhereInput
  }

  /**
   * VersionCountOutputType without action
   */
  export type VersionCountOutputTypeCountMaintenanceCostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MaintenanceCostWhereInput
  }

  /**
   * VersionCountOutputType without action
   */
  export type VersionCountOutputTypeCountComparisonItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ComparisonItemWhereInput
  }

  /**
   * VersionCountOutputType without action
   */
  export type VersionCountOutputTypeCountFavoritesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FavoriteWhereInput
  }


  /**
   * Count Type EquipmentItemCountOutputType
   */

  export type EquipmentItemCountOutputType = {
    versions: number
  }

  export type EquipmentItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    versions?: boolean | EquipmentItemCountOutputTypeCountVersionsArgs
  }

  // Custom InputTypes
  /**
   * EquipmentItemCountOutputType without action
   */
  export type EquipmentItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItemCountOutputType
     */
    select?: EquipmentItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EquipmentItemCountOutputType without action
   */
  export type EquipmentItemCountOutputTypeCountVersionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VersionEquipmentWhereInput
  }


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    comparisons: number
    favorites: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comparisons?: boolean | UserCountOutputTypeCountComparisonsArgs
    favorites?: boolean | UserCountOutputTypeCountFavoritesArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountComparisonsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ComparisonWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountFavoritesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FavoriteWhereInput
  }


  /**
   * Count Type ComparisonCountOutputType
   */

  export type ComparisonCountOutputType = {
    items: number
  }

  export type ComparisonCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    items?: boolean | ComparisonCountOutputTypeCountItemsArgs
  }

  // Custom InputTypes
  /**
   * ComparisonCountOutputType without action
   */
  export type ComparisonCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonCountOutputType
     */
    select?: ComparisonCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ComparisonCountOutputType without action
   */
  export type ComparisonCountOutputTypeCountItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ComparisonItemWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Brand
   */

  export type AggregateBrand = {
    _count: BrandCountAggregateOutputType | null
    _min: BrandMinAggregateOutputType | null
    _max: BrandMaxAggregateOutputType | null
  }

  export type BrandMinAggregateOutputType = {
    id: string | null
    name: string | null
    logoUrl: string | null
    deletedAt: Date | null
    createdAt: Date | null
  }

  export type BrandMaxAggregateOutputType = {
    id: string | null
    name: string | null
    logoUrl: string | null
    deletedAt: Date | null
    createdAt: Date | null
  }

  export type BrandCountAggregateOutputType = {
    id: number
    name: number
    logoUrl: number
    deletedAt: number
    createdAt: number
    _all: number
  }


  export type BrandMinAggregateInputType = {
    id?: true
    name?: true
    logoUrl?: true
    deletedAt?: true
    createdAt?: true
  }

  export type BrandMaxAggregateInputType = {
    id?: true
    name?: true
    logoUrl?: true
    deletedAt?: true
    createdAt?: true
  }

  export type BrandCountAggregateInputType = {
    id?: true
    name?: true
    logoUrl?: true
    deletedAt?: true
    createdAt?: true
    _all?: true
  }

  export type BrandAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Brand to aggregate.
     */
    where?: BrandWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Brands to fetch.
     */
    orderBy?: BrandOrderByWithRelationInput | BrandOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: BrandWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Brands from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Brands.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Brands
    **/
    _count?: true | BrandCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: BrandMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: BrandMaxAggregateInputType
  }

  export type GetBrandAggregateType<T extends BrandAggregateArgs> = {
        [P in keyof T & keyof AggregateBrand]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateBrand[P]>
      : GetScalarType<T[P], AggregateBrand[P]>
  }




  export type BrandGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: BrandWhereInput
    orderBy?: BrandOrderByWithAggregationInput | BrandOrderByWithAggregationInput[]
    by: BrandScalarFieldEnum[] | BrandScalarFieldEnum
    having?: BrandScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: BrandCountAggregateInputType | true
    _min?: BrandMinAggregateInputType
    _max?: BrandMaxAggregateInputType
  }

  export type BrandGroupByOutputType = {
    id: string
    name: string
    logoUrl: string | null
    deletedAt: Date | null
    createdAt: Date
    _count: BrandCountAggregateOutputType | null
    _min: BrandMinAggregateOutputType | null
    _max: BrandMaxAggregateOutputType | null
  }

  type GetBrandGroupByPayload<T extends BrandGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<BrandGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof BrandGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], BrandGroupByOutputType[P]>
            : GetScalarType<T[P], BrandGroupByOutputType[P]>
        }
      >
    >


  export type BrandSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    logoUrl?: boolean
    deletedAt?: boolean
    createdAt?: boolean
    models?: boolean | Brand$modelsArgs<ExtArgs>
    _count?: boolean | BrandCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["brand"]>


  export type BrandSelectScalar = {
    id?: boolean
    name?: boolean
    logoUrl?: boolean
    deletedAt?: boolean
    createdAt?: boolean
  }

  export type BrandInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    models?: boolean | Brand$modelsArgs<ExtArgs>
    _count?: boolean | BrandCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $BrandPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Brand"
    objects: {
      models: Prisma.$ModelPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      logoUrl: string | null
      deletedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["brand"]>
    composites: {}
  }

  type BrandGetPayload<S extends boolean | null | undefined | BrandDefaultArgs> = $Result.GetResult<Prisma.$BrandPayload, S>

  type BrandCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<BrandFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: BrandCountAggregateInputType | true
    }

  export interface BrandDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Brand'], meta: { name: 'Brand' } }
    /**
     * Find zero or one Brand that matches the filter.
     * @param {BrandFindUniqueArgs} args - Arguments to find a Brand
     * @example
     * // Get one Brand
     * const brand = await prisma.brand.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends BrandFindUniqueArgs>(args: SelectSubset<T, BrandFindUniqueArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Brand that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {BrandFindUniqueOrThrowArgs} args - Arguments to find a Brand
     * @example
     * // Get one Brand
     * const brand = await prisma.brand.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends BrandFindUniqueOrThrowArgs>(args: SelectSubset<T, BrandFindUniqueOrThrowArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Brand that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BrandFindFirstArgs} args - Arguments to find a Brand
     * @example
     * // Get one Brand
     * const brand = await prisma.brand.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends BrandFindFirstArgs>(args?: SelectSubset<T, BrandFindFirstArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Brand that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BrandFindFirstOrThrowArgs} args - Arguments to find a Brand
     * @example
     * // Get one Brand
     * const brand = await prisma.brand.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends BrandFindFirstOrThrowArgs>(args?: SelectSubset<T, BrandFindFirstOrThrowArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Brands that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BrandFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Brands
     * const brands = await prisma.brand.findMany()
     * 
     * // Get first 10 Brands
     * const brands = await prisma.brand.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const brandWithIdOnly = await prisma.brand.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends BrandFindManyArgs>(args?: SelectSubset<T, BrandFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Brand.
     * @param {BrandCreateArgs} args - Arguments to create a Brand.
     * @example
     * // Create one Brand
     * const Brand = await prisma.brand.create({
     *   data: {
     *     // ... data to create a Brand
     *   }
     * })
     * 
     */
    create<T extends BrandCreateArgs>(args: SelectSubset<T, BrandCreateArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Brands.
     * @param {BrandCreateManyArgs} args - Arguments to create many Brands.
     * @example
     * // Create many Brands
     * const brand = await prisma.brand.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends BrandCreateManyArgs>(args?: SelectSubset<T, BrandCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Brand.
     * @param {BrandDeleteArgs} args - Arguments to delete one Brand.
     * @example
     * // Delete one Brand
     * const Brand = await prisma.brand.delete({
     *   where: {
     *     // ... filter to delete one Brand
     *   }
     * })
     * 
     */
    delete<T extends BrandDeleteArgs>(args: SelectSubset<T, BrandDeleteArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Brand.
     * @param {BrandUpdateArgs} args - Arguments to update one Brand.
     * @example
     * // Update one Brand
     * const brand = await prisma.brand.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends BrandUpdateArgs>(args: SelectSubset<T, BrandUpdateArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Brands.
     * @param {BrandDeleteManyArgs} args - Arguments to filter Brands to delete.
     * @example
     * // Delete a few Brands
     * const { count } = await prisma.brand.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends BrandDeleteManyArgs>(args?: SelectSubset<T, BrandDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Brands.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BrandUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Brands
     * const brand = await prisma.brand.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends BrandUpdateManyArgs>(args: SelectSubset<T, BrandUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Brand.
     * @param {BrandUpsertArgs} args - Arguments to update or create a Brand.
     * @example
     * // Update or create a Brand
     * const brand = await prisma.brand.upsert({
     *   create: {
     *     // ... data to create a Brand
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Brand we want to update
     *   }
     * })
     */
    upsert<T extends BrandUpsertArgs>(args: SelectSubset<T, BrandUpsertArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Brands.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BrandCountArgs} args - Arguments to filter Brands to count.
     * @example
     * // Count the number of Brands
     * const count = await prisma.brand.count({
     *   where: {
     *     // ... the filter for the Brands we want to count
     *   }
     * })
    **/
    count<T extends BrandCountArgs>(
      args?: Subset<T, BrandCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], BrandCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Brand.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BrandAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends BrandAggregateArgs>(args: Subset<T, BrandAggregateArgs>): Prisma.PrismaPromise<GetBrandAggregateType<T>>

    /**
     * Group by Brand.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {BrandGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends BrandGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: BrandGroupByArgs['orderBy'] }
        : { orderBy?: BrandGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, BrandGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetBrandGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Brand model
   */
  readonly fields: BrandFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Brand.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__BrandClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    models<T extends Brand$modelsArgs<ExtArgs> = {}>(args?: Subset<T, Brand$modelsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Brand model
   */ 
  interface BrandFieldRefs {
    readonly id: FieldRef<"Brand", 'String'>
    readonly name: FieldRef<"Brand", 'String'>
    readonly logoUrl: FieldRef<"Brand", 'String'>
    readonly deletedAt: FieldRef<"Brand", 'DateTime'>
    readonly createdAt: FieldRef<"Brand", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Brand findUnique
   */
  export type BrandFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * Filter, which Brand to fetch.
     */
    where: BrandWhereUniqueInput
  }

  /**
   * Brand findUniqueOrThrow
   */
  export type BrandFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * Filter, which Brand to fetch.
     */
    where: BrandWhereUniqueInput
  }

  /**
   * Brand findFirst
   */
  export type BrandFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * Filter, which Brand to fetch.
     */
    where?: BrandWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Brands to fetch.
     */
    orderBy?: BrandOrderByWithRelationInput | BrandOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Brands.
     */
    cursor?: BrandWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Brands from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Brands.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Brands.
     */
    distinct?: BrandScalarFieldEnum | BrandScalarFieldEnum[]
  }

  /**
   * Brand findFirstOrThrow
   */
  export type BrandFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * Filter, which Brand to fetch.
     */
    where?: BrandWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Brands to fetch.
     */
    orderBy?: BrandOrderByWithRelationInput | BrandOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Brands.
     */
    cursor?: BrandWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Brands from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Brands.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Brands.
     */
    distinct?: BrandScalarFieldEnum | BrandScalarFieldEnum[]
  }

  /**
   * Brand findMany
   */
  export type BrandFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * Filter, which Brands to fetch.
     */
    where?: BrandWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Brands to fetch.
     */
    orderBy?: BrandOrderByWithRelationInput | BrandOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Brands.
     */
    cursor?: BrandWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Brands from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Brands.
     */
    skip?: number
    distinct?: BrandScalarFieldEnum | BrandScalarFieldEnum[]
  }

  /**
   * Brand create
   */
  export type BrandCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * The data needed to create a Brand.
     */
    data: XOR<BrandCreateInput, BrandUncheckedCreateInput>
  }

  /**
   * Brand createMany
   */
  export type BrandCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Brands.
     */
    data: BrandCreateManyInput | BrandCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Brand update
   */
  export type BrandUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * The data needed to update a Brand.
     */
    data: XOR<BrandUpdateInput, BrandUncheckedUpdateInput>
    /**
     * Choose, which Brand to update.
     */
    where: BrandWhereUniqueInput
  }

  /**
   * Brand updateMany
   */
  export type BrandUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Brands.
     */
    data: XOR<BrandUpdateManyMutationInput, BrandUncheckedUpdateManyInput>
    /**
     * Filter which Brands to update
     */
    where?: BrandWhereInput
  }

  /**
   * Brand upsert
   */
  export type BrandUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * The filter to search for the Brand to update in case it exists.
     */
    where: BrandWhereUniqueInput
    /**
     * In case the Brand found by the `where` argument doesn't exist, create a new Brand with this data.
     */
    create: XOR<BrandCreateInput, BrandUncheckedCreateInput>
    /**
     * In case the Brand was found with the provided `where` argument, update it with this data.
     */
    update: XOR<BrandUpdateInput, BrandUncheckedUpdateInput>
  }

  /**
   * Brand delete
   */
  export type BrandDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
    /**
     * Filter which Brand to delete.
     */
    where: BrandWhereUniqueInput
  }

  /**
   * Brand deleteMany
   */
  export type BrandDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Brands to delete
     */
    where?: BrandWhereInput
  }

  /**
   * Brand.models
   */
  export type Brand$modelsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    where?: ModelWhereInput
    orderBy?: ModelOrderByWithRelationInput | ModelOrderByWithRelationInput[]
    cursor?: ModelWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ModelScalarFieldEnum | ModelScalarFieldEnum[]
  }

  /**
   * Brand without action
   */
  export type BrandDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Brand
     */
    select?: BrandSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: BrandInclude<ExtArgs> | null
  }


  /**
   * Model Model
   */

  export type AggregateModel = {
    _count: ModelCountAggregateOutputType | null
    _min: ModelMinAggregateOutputType | null
    _max: ModelMaxAggregateOutputType | null
  }

  export type ModelMinAggregateOutputType = {
    id: string | null
    brandId: string | null
    name: string | null
    segment: string | null
    imageUrl: string | null
    deletedAt: Date | null
    createdAt: Date | null
  }

  export type ModelMaxAggregateOutputType = {
    id: string | null
    brandId: string | null
    name: string | null
    segment: string | null
    imageUrl: string | null
    deletedAt: Date | null
    createdAt: Date | null
  }

  export type ModelCountAggregateOutputType = {
    id: number
    brandId: number
    name: number
    segment: number
    imageUrl: number
    galleryUrls: number
    deletedAt: number
    createdAt: number
    _all: number
  }


  export type ModelMinAggregateInputType = {
    id?: true
    brandId?: true
    name?: true
    segment?: true
    imageUrl?: true
    deletedAt?: true
    createdAt?: true
  }

  export type ModelMaxAggregateInputType = {
    id?: true
    brandId?: true
    name?: true
    segment?: true
    imageUrl?: true
    deletedAt?: true
    createdAt?: true
  }

  export type ModelCountAggregateInputType = {
    id?: true
    brandId?: true
    name?: true
    segment?: true
    imageUrl?: true
    galleryUrls?: true
    deletedAt?: true
    createdAt?: true
    _all?: true
  }

  export type ModelAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Model to aggregate.
     */
    where?: ModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Models to fetch.
     */
    orderBy?: ModelOrderByWithRelationInput | ModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Models
    **/
    _count?: true | ModelCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ModelMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ModelMaxAggregateInputType
  }

  export type GetModelAggregateType<T extends ModelAggregateArgs> = {
        [P in keyof T & keyof AggregateModel]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateModel[P]>
      : GetScalarType<T[P], AggregateModel[P]>
  }




  export type ModelGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ModelWhereInput
    orderBy?: ModelOrderByWithAggregationInput | ModelOrderByWithAggregationInput[]
    by: ModelScalarFieldEnum[] | ModelScalarFieldEnum
    having?: ModelScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ModelCountAggregateInputType | true
    _min?: ModelMinAggregateInputType
    _max?: ModelMaxAggregateInputType
  }

  export type ModelGroupByOutputType = {
    id: string
    brandId: string
    name: string
    segment: string
    imageUrl: string | null
    galleryUrls: JsonValue
    deletedAt: Date | null
    createdAt: Date
    _count: ModelCountAggregateOutputType | null
    _min: ModelMinAggregateOutputType | null
    _max: ModelMaxAggregateOutputType | null
  }

  type GetModelGroupByPayload<T extends ModelGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ModelGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ModelGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ModelGroupByOutputType[P]>
            : GetScalarType<T[P], ModelGroupByOutputType[P]>
        }
      >
    >


  export type ModelSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    brandId?: boolean
    name?: boolean
    segment?: boolean
    imageUrl?: boolean
    galleryUrls?: boolean
    deletedAt?: boolean
    createdAt?: boolean
    brand?: boolean | BrandDefaultArgs<ExtArgs>
    versions?: boolean | Model$versionsArgs<ExtArgs>
    favorites?: boolean | Model$favoritesArgs<ExtArgs>
    _count?: boolean | ModelCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["model"]>


  export type ModelSelectScalar = {
    id?: boolean
    brandId?: boolean
    name?: boolean
    segment?: boolean
    imageUrl?: boolean
    galleryUrls?: boolean
    deletedAt?: boolean
    createdAt?: boolean
  }

  export type ModelInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    brand?: boolean | BrandDefaultArgs<ExtArgs>
    versions?: boolean | Model$versionsArgs<ExtArgs>
    favorites?: boolean | Model$favoritesArgs<ExtArgs>
    _count?: boolean | ModelCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $ModelPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Model"
    objects: {
      brand: Prisma.$BrandPayload<ExtArgs>
      versions: Prisma.$VersionPayload<ExtArgs>[]
      favorites: Prisma.$FavoritePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      brandId: string
      name: string
      segment: string
      imageUrl: string | null
      galleryUrls: Prisma.JsonValue
      deletedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["model"]>
    composites: {}
  }

  type ModelGetPayload<S extends boolean | null | undefined | ModelDefaultArgs> = $Result.GetResult<Prisma.$ModelPayload, S>

  type ModelCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ModelFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ModelCountAggregateInputType | true
    }

  export interface ModelDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Model'], meta: { name: 'Model' } }
    /**
     * Find zero or one Model that matches the filter.
     * @param {ModelFindUniqueArgs} args - Arguments to find a Model
     * @example
     * // Get one Model
     * const model = await prisma.model.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ModelFindUniqueArgs>(args: SelectSubset<T, ModelFindUniqueArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Model that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ModelFindUniqueOrThrowArgs} args - Arguments to find a Model
     * @example
     * // Get one Model
     * const model = await prisma.model.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ModelFindUniqueOrThrowArgs>(args: SelectSubset<T, ModelFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Model that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelFindFirstArgs} args - Arguments to find a Model
     * @example
     * // Get one Model
     * const model = await prisma.model.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ModelFindFirstArgs>(args?: SelectSubset<T, ModelFindFirstArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Model that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelFindFirstOrThrowArgs} args - Arguments to find a Model
     * @example
     * // Get one Model
     * const model = await prisma.model.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ModelFindFirstOrThrowArgs>(args?: SelectSubset<T, ModelFindFirstOrThrowArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Models that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Models
     * const models = await prisma.model.findMany()
     * 
     * // Get first 10 Models
     * const models = await prisma.model.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const modelWithIdOnly = await prisma.model.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ModelFindManyArgs>(args?: SelectSubset<T, ModelFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Model.
     * @param {ModelCreateArgs} args - Arguments to create a Model.
     * @example
     * // Create one Model
     * const Model = await prisma.model.create({
     *   data: {
     *     // ... data to create a Model
     *   }
     * })
     * 
     */
    create<T extends ModelCreateArgs>(args: SelectSubset<T, ModelCreateArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Models.
     * @param {ModelCreateManyArgs} args - Arguments to create many Models.
     * @example
     * // Create many Models
     * const model = await prisma.model.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ModelCreateManyArgs>(args?: SelectSubset<T, ModelCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Model.
     * @param {ModelDeleteArgs} args - Arguments to delete one Model.
     * @example
     * // Delete one Model
     * const Model = await prisma.model.delete({
     *   where: {
     *     // ... filter to delete one Model
     *   }
     * })
     * 
     */
    delete<T extends ModelDeleteArgs>(args: SelectSubset<T, ModelDeleteArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Model.
     * @param {ModelUpdateArgs} args - Arguments to update one Model.
     * @example
     * // Update one Model
     * const model = await prisma.model.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ModelUpdateArgs>(args: SelectSubset<T, ModelUpdateArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Models.
     * @param {ModelDeleteManyArgs} args - Arguments to filter Models to delete.
     * @example
     * // Delete a few Models
     * const { count } = await prisma.model.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ModelDeleteManyArgs>(args?: SelectSubset<T, ModelDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Models
     * const model = await prisma.model.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ModelUpdateManyArgs>(args: SelectSubset<T, ModelUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Model.
     * @param {ModelUpsertArgs} args - Arguments to update or create a Model.
     * @example
     * // Update or create a Model
     * const model = await prisma.model.upsert({
     *   create: {
     *     // ... data to create a Model
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Model we want to update
     *   }
     * })
     */
    upsert<T extends ModelUpsertArgs>(args: SelectSubset<T, ModelUpsertArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Models.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelCountArgs} args - Arguments to filter Models to count.
     * @example
     * // Count the number of Models
     * const count = await prisma.model.count({
     *   where: {
     *     // ... the filter for the Models we want to count
     *   }
     * })
    **/
    count<T extends ModelCountArgs>(
      args?: Subset<T, ModelCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ModelCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Model.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ModelAggregateArgs>(args: Subset<T, ModelAggregateArgs>): Prisma.PrismaPromise<GetModelAggregateType<T>>

    /**
     * Group by Model.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ModelGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ModelGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ModelGroupByArgs['orderBy'] }
        : { orderBy?: ModelGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ModelGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetModelGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Model model
   */
  readonly fields: ModelFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Model.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ModelClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    brand<T extends BrandDefaultArgs<ExtArgs> = {}>(args?: Subset<T, BrandDefaultArgs<ExtArgs>>): Prisma__BrandClient<$Result.GetResult<Prisma.$BrandPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    versions<T extends Model$versionsArgs<ExtArgs> = {}>(args?: Subset<T, Model$versionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findMany"> | Null>
    favorites<T extends Model$favoritesArgs<ExtArgs> = {}>(args?: Subset<T, Model$favoritesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Model model
   */ 
  interface ModelFieldRefs {
    readonly id: FieldRef<"Model", 'String'>
    readonly brandId: FieldRef<"Model", 'String'>
    readonly name: FieldRef<"Model", 'String'>
    readonly segment: FieldRef<"Model", 'String'>
    readonly imageUrl: FieldRef<"Model", 'String'>
    readonly galleryUrls: FieldRef<"Model", 'Json'>
    readonly deletedAt: FieldRef<"Model", 'DateTime'>
    readonly createdAt: FieldRef<"Model", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Model findUnique
   */
  export type ModelFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * Filter, which Model to fetch.
     */
    where: ModelWhereUniqueInput
  }

  /**
   * Model findUniqueOrThrow
   */
  export type ModelFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * Filter, which Model to fetch.
     */
    where: ModelWhereUniqueInput
  }

  /**
   * Model findFirst
   */
  export type ModelFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * Filter, which Model to fetch.
     */
    where?: ModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Models to fetch.
     */
    orderBy?: ModelOrderByWithRelationInput | ModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Models.
     */
    cursor?: ModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Models.
     */
    distinct?: ModelScalarFieldEnum | ModelScalarFieldEnum[]
  }

  /**
   * Model findFirstOrThrow
   */
  export type ModelFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * Filter, which Model to fetch.
     */
    where?: ModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Models to fetch.
     */
    orderBy?: ModelOrderByWithRelationInput | ModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Models.
     */
    cursor?: ModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Models.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Models.
     */
    distinct?: ModelScalarFieldEnum | ModelScalarFieldEnum[]
  }

  /**
   * Model findMany
   */
  export type ModelFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * Filter, which Models to fetch.
     */
    where?: ModelWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Models to fetch.
     */
    orderBy?: ModelOrderByWithRelationInput | ModelOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Models.
     */
    cursor?: ModelWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Models from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Models.
     */
    skip?: number
    distinct?: ModelScalarFieldEnum | ModelScalarFieldEnum[]
  }

  /**
   * Model create
   */
  export type ModelCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * The data needed to create a Model.
     */
    data: XOR<ModelCreateInput, ModelUncheckedCreateInput>
  }

  /**
   * Model createMany
   */
  export type ModelCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Models.
     */
    data: ModelCreateManyInput | ModelCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Model update
   */
  export type ModelUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * The data needed to update a Model.
     */
    data: XOR<ModelUpdateInput, ModelUncheckedUpdateInput>
    /**
     * Choose, which Model to update.
     */
    where: ModelWhereUniqueInput
  }

  /**
   * Model updateMany
   */
  export type ModelUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Models.
     */
    data: XOR<ModelUpdateManyMutationInput, ModelUncheckedUpdateManyInput>
    /**
     * Filter which Models to update
     */
    where?: ModelWhereInput
  }

  /**
   * Model upsert
   */
  export type ModelUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * The filter to search for the Model to update in case it exists.
     */
    where: ModelWhereUniqueInput
    /**
     * In case the Model found by the `where` argument doesn't exist, create a new Model with this data.
     */
    create: XOR<ModelCreateInput, ModelUncheckedCreateInput>
    /**
     * In case the Model was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ModelUpdateInput, ModelUncheckedUpdateInput>
  }

  /**
   * Model delete
   */
  export type ModelDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
    /**
     * Filter which Model to delete.
     */
    where: ModelWhereUniqueInput
  }

  /**
   * Model deleteMany
   */
  export type ModelDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Models to delete
     */
    where?: ModelWhereInput
  }

  /**
   * Model.versions
   */
  export type Model$versionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    where?: VersionWhereInput
    orderBy?: VersionOrderByWithRelationInput | VersionOrderByWithRelationInput[]
    cursor?: VersionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VersionScalarFieldEnum | VersionScalarFieldEnum[]
  }

  /**
   * Model.favorites
   */
  export type Model$favoritesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    where?: FavoriteWhereInput
    orderBy?: FavoriteOrderByWithRelationInput | FavoriteOrderByWithRelationInput[]
    cursor?: FavoriteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FavoriteScalarFieldEnum | FavoriteScalarFieldEnum[]
  }

  /**
   * Model without action
   */
  export type ModelDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Model
     */
    select?: ModelSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ModelInclude<ExtArgs> | null
  }


  /**
   * Model Version
   */

  export type AggregateVersion = {
    _count: VersionCountAggregateOutputType | null
    _avg: VersionAvgAggregateOutputType | null
    _sum: VersionSumAggregateOutputType | null
    _min: VersionMinAggregateOutputType | null
    _max: VersionMaxAggregateOutputType | null
  }

  export type VersionAvgAggregateOutputType = {
    year: number | null
    priceClp: number | null
    engineDisplacementCc: number | null
    powerHp: number | null
    torqueNm: number | null
    consumptionCityKmL: number | null
    consumptionHighwayKmL: number | null
    lengthMm: number | null
    widthMm: number | null
    heightMm: number | null
    weightKg: number | null
    trunkLiters: number | null
    airbagCount: number | null
  }

  export type VersionSumAggregateOutputType = {
    year: number | null
    priceClp: number | null
    engineDisplacementCc: number | null
    powerHp: number | null
    torqueNm: number | null
    consumptionCityKmL: number | null
    consumptionHighwayKmL: number | null
    lengthMm: number | null
    widthMm: number | null
    heightMm: number | null
    weightKg: number | null
    trunkLiters: number | null
    airbagCount: number | null
  }

  export type VersionMinAggregateOutputType = {
    id: string | null
    modelId: string | null
    name: string | null
    year: number | null
    priceClp: number | null
    transmission: string | null
    fuel: string | null
    engineDisplacementCc: number | null
    powerHp: number | null
    torqueNm: number | null
    consumptionCityKmL: number | null
    consumptionHighwayKmL: number | null
    lengthMm: number | null
    widthMm: number | null
    heightMm: number | null
    weightKg: number | null
    trunkLiters: number | null
    airbagCount: number | null
    hasAbs: boolean | null
    hasEsp: boolean | null
    hasCruiseControl: boolean | null
    deletedAt: Date | null
    createdAt: Date | null
  }

  export type VersionMaxAggregateOutputType = {
    id: string | null
    modelId: string | null
    name: string | null
    year: number | null
    priceClp: number | null
    transmission: string | null
    fuel: string | null
    engineDisplacementCc: number | null
    powerHp: number | null
    torqueNm: number | null
    consumptionCityKmL: number | null
    consumptionHighwayKmL: number | null
    lengthMm: number | null
    widthMm: number | null
    heightMm: number | null
    weightKg: number | null
    trunkLiters: number | null
    airbagCount: number | null
    hasAbs: boolean | null
    hasEsp: boolean | null
    hasCruiseControl: boolean | null
    deletedAt: Date | null
    createdAt: Date | null
  }

  export type VersionCountAggregateOutputType = {
    id: number
    modelId: number
    name: number
    year: number
    priceClp: number
    transmission: number
    fuel: number
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: number
    hasEsp: number
    hasCruiseControl: number
    deletedAt: number
    createdAt: number
    _all: number
  }


  export type VersionAvgAggregateInputType = {
    year?: true
    priceClp?: true
    engineDisplacementCc?: true
    powerHp?: true
    torqueNm?: true
    consumptionCityKmL?: true
    consumptionHighwayKmL?: true
    lengthMm?: true
    widthMm?: true
    heightMm?: true
    weightKg?: true
    trunkLiters?: true
    airbagCount?: true
  }

  export type VersionSumAggregateInputType = {
    year?: true
    priceClp?: true
    engineDisplacementCc?: true
    powerHp?: true
    torqueNm?: true
    consumptionCityKmL?: true
    consumptionHighwayKmL?: true
    lengthMm?: true
    widthMm?: true
    heightMm?: true
    weightKg?: true
    trunkLiters?: true
    airbagCount?: true
  }

  export type VersionMinAggregateInputType = {
    id?: true
    modelId?: true
    name?: true
    year?: true
    priceClp?: true
    transmission?: true
    fuel?: true
    engineDisplacementCc?: true
    powerHp?: true
    torqueNm?: true
    consumptionCityKmL?: true
    consumptionHighwayKmL?: true
    lengthMm?: true
    widthMm?: true
    heightMm?: true
    weightKg?: true
    trunkLiters?: true
    airbagCount?: true
    hasAbs?: true
    hasEsp?: true
    hasCruiseControl?: true
    deletedAt?: true
    createdAt?: true
  }

  export type VersionMaxAggregateInputType = {
    id?: true
    modelId?: true
    name?: true
    year?: true
    priceClp?: true
    transmission?: true
    fuel?: true
    engineDisplacementCc?: true
    powerHp?: true
    torqueNm?: true
    consumptionCityKmL?: true
    consumptionHighwayKmL?: true
    lengthMm?: true
    widthMm?: true
    heightMm?: true
    weightKg?: true
    trunkLiters?: true
    airbagCount?: true
    hasAbs?: true
    hasEsp?: true
    hasCruiseControl?: true
    deletedAt?: true
    createdAt?: true
  }

  export type VersionCountAggregateInputType = {
    id?: true
    modelId?: true
    name?: true
    year?: true
    priceClp?: true
    transmission?: true
    fuel?: true
    engineDisplacementCc?: true
    powerHp?: true
    torqueNm?: true
    consumptionCityKmL?: true
    consumptionHighwayKmL?: true
    lengthMm?: true
    widthMm?: true
    heightMm?: true
    weightKg?: true
    trunkLiters?: true
    airbagCount?: true
    hasAbs?: true
    hasEsp?: true
    hasCruiseControl?: true
    deletedAt?: true
    createdAt?: true
    _all?: true
  }

  export type VersionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Version to aggregate.
     */
    where?: VersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Versions to fetch.
     */
    orderBy?: VersionOrderByWithRelationInput | VersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Versions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Versions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Versions
    **/
    _count?: true | VersionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: VersionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: VersionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VersionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VersionMaxAggregateInputType
  }

  export type GetVersionAggregateType<T extends VersionAggregateArgs> = {
        [P in keyof T & keyof AggregateVersion]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVersion[P]>
      : GetScalarType<T[P], AggregateVersion[P]>
  }




  export type VersionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VersionWhereInput
    orderBy?: VersionOrderByWithAggregationInput | VersionOrderByWithAggregationInput[]
    by: VersionScalarFieldEnum[] | VersionScalarFieldEnum
    having?: VersionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VersionCountAggregateInputType | true
    _avg?: VersionAvgAggregateInputType
    _sum?: VersionSumAggregateInputType
    _min?: VersionMinAggregateInputType
    _max?: VersionMaxAggregateInputType
  }

  export type VersionGroupByOutputType = {
    id: string
    modelId: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt: Date | null
    createdAt: Date
    _count: VersionCountAggregateOutputType | null
    _avg: VersionAvgAggregateOutputType | null
    _sum: VersionSumAggregateOutputType | null
    _min: VersionMinAggregateOutputType | null
    _max: VersionMaxAggregateOutputType | null
  }

  type GetVersionGroupByPayload<T extends VersionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VersionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VersionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VersionGroupByOutputType[P]>
            : GetScalarType<T[P], VersionGroupByOutputType[P]>
        }
      >
    >


  export type VersionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    modelId?: boolean
    name?: boolean
    year?: boolean
    priceClp?: boolean
    transmission?: boolean
    fuel?: boolean
    engineDisplacementCc?: boolean
    powerHp?: boolean
    torqueNm?: boolean
    consumptionCityKmL?: boolean
    consumptionHighwayKmL?: boolean
    lengthMm?: boolean
    widthMm?: boolean
    heightMm?: boolean
    weightKg?: boolean
    trunkLiters?: boolean
    airbagCount?: boolean
    hasAbs?: boolean
    hasEsp?: boolean
    hasCruiseControl?: boolean
    deletedAt?: boolean
    createdAt?: boolean
    model?: boolean | ModelDefaultArgs<ExtArgs>
    equipmentItems?: boolean | Version$equipmentItemsArgs<ExtArgs>
    maintenanceCosts?: boolean | Version$maintenanceCostsArgs<ExtArgs>
    comparisonItems?: boolean | Version$comparisonItemsArgs<ExtArgs>
    favorites?: boolean | Version$favoritesArgs<ExtArgs>
    _count?: boolean | VersionCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["version"]>


  export type VersionSelectScalar = {
    id?: boolean
    modelId?: boolean
    name?: boolean
    year?: boolean
    priceClp?: boolean
    transmission?: boolean
    fuel?: boolean
    engineDisplacementCc?: boolean
    powerHp?: boolean
    torqueNm?: boolean
    consumptionCityKmL?: boolean
    consumptionHighwayKmL?: boolean
    lengthMm?: boolean
    widthMm?: boolean
    heightMm?: boolean
    weightKg?: boolean
    trunkLiters?: boolean
    airbagCount?: boolean
    hasAbs?: boolean
    hasEsp?: boolean
    hasCruiseControl?: boolean
    deletedAt?: boolean
    createdAt?: boolean
  }

  export type VersionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    model?: boolean | ModelDefaultArgs<ExtArgs>
    equipmentItems?: boolean | Version$equipmentItemsArgs<ExtArgs>
    maintenanceCosts?: boolean | Version$maintenanceCostsArgs<ExtArgs>
    comparisonItems?: boolean | Version$comparisonItemsArgs<ExtArgs>
    favorites?: boolean | Version$favoritesArgs<ExtArgs>
    _count?: boolean | VersionCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $VersionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Version"
    objects: {
      model: Prisma.$ModelPayload<ExtArgs>
      equipmentItems: Prisma.$VersionEquipmentPayload<ExtArgs>[]
      maintenanceCosts: Prisma.$MaintenanceCostPayload<ExtArgs>[]
      comparisonItems: Prisma.$ComparisonItemPayload<ExtArgs>[]
      favorites: Prisma.$FavoritePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      modelId: string
      name: string
      year: number
      priceClp: number
      transmission: string
      fuel: string
      engineDisplacementCc: number
      powerHp: number
      torqueNm: number
      consumptionCityKmL: number
      consumptionHighwayKmL: number
      lengthMm: number
      widthMm: number
      heightMm: number
      weightKg: number
      trunkLiters: number
      airbagCount: number
      hasAbs: boolean
      hasEsp: boolean
      hasCruiseControl: boolean
      deletedAt: Date | null
      createdAt: Date
    }, ExtArgs["result"]["version"]>
    composites: {}
  }

  type VersionGetPayload<S extends boolean | null | undefined | VersionDefaultArgs> = $Result.GetResult<Prisma.$VersionPayload, S>

  type VersionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<VersionFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: VersionCountAggregateInputType | true
    }

  export interface VersionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Version'], meta: { name: 'Version' } }
    /**
     * Find zero or one Version that matches the filter.
     * @param {VersionFindUniqueArgs} args - Arguments to find a Version
     * @example
     * // Get one Version
     * const version = await prisma.version.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VersionFindUniqueArgs>(args: SelectSubset<T, VersionFindUniqueArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Version that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {VersionFindUniqueOrThrowArgs} args - Arguments to find a Version
     * @example
     * // Get one Version
     * const version = await prisma.version.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VersionFindUniqueOrThrowArgs>(args: SelectSubset<T, VersionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Version that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionFindFirstArgs} args - Arguments to find a Version
     * @example
     * // Get one Version
     * const version = await prisma.version.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VersionFindFirstArgs>(args?: SelectSubset<T, VersionFindFirstArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Version that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionFindFirstOrThrowArgs} args - Arguments to find a Version
     * @example
     * // Get one Version
     * const version = await prisma.version.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VersionFindFirstOrThrowArgs>(args?: SelectSubset<T, VersionFindFirstOrThrowArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Versions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Versions
     * const versions = await prisma.version.findMany()
     * 
     * // Get first 10 Versions
     * const versions = await prisma.version.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const versionWithIdOnly = await prisma.version.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends VersionFindManyArgs>(args?: SelectSubset<T, VersionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Version.
     * @param {VersionCreateArgs} args - Arguments to create a Version.
     * @example
     * // Create one Version
     * const Version = await prisma.version.create({
     *   data: {
     *     // ... data to create a Version
     *   }
     * })
     * 
     */
    create<T extends VersionCreateArgs>(args: SelectSubset<T, VersionCreateArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Versions.
     * @param {VersionCreateManyArgs} args - Arguments to create many Versions.
     * @example
     * // Create many Versions
     * const version = await prisma.version.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VersionCreateManyArgs>(args?: SelectSubset<T, VersionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Version.
     * @param {VersionDeleteArgs} args - Arguments to delete one Version.
     * @example
     * // Delete one Version
     * const Version = await prisma.version.delete({
     *   where: {
     *     // ... filter to delete one Version
     *   }
     * })
     * 
     */
    delete<T extends VersionDeleteArgs>(args: SelectSubset<T, VersionDeleteArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Version.
     * @param {VersionUpdateArgs} args - Arguments to update one Version.
     * @example
     * // Update one Version
     * const version = await prisma.version.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VersionUpdateArgs>(args: SelectSubset<T, VersionUpdateArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Versions.
     * @param {VersionDeleteManyArgs} args - Arguments to filter Versions to delete.
     * @example
     * // Delete a few Versions
     * const { count } = await prisma.version.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VersionDeleteManyArgs>(args?: SelectSubset<T, VersionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Versions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Versions
     * const version = await prisma.version.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VersionUpdateManyArgs>(args: SelectSubset<T, VersionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Version.
     * @param {VersionUpsertArgs} args - Arguments to update or create a Version.
     * @example
     * // Update or create a Version
     * const version = await prisma.version.upsert({
     *   create: {
     *     // ... data to create a Version
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Version we want to update
     *   }
     * })
     */
    upsert<T extends VersionUpsertArgs>(args: SelectSubset<T, VersionUpsertArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Versions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionCountArgs} args - Arguments to filter Versions to count.
     * @example
     * // Count the number of Versions
     * const count = await prisma.version.count({
     *   where: {
     *     // ... the filter for the Versions we want to count
     *   }
     * })
    **/
    count<T extends VersionCountArgs>(
      args?: Subset<T, VersionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VersionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Version.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VersionAggregateArgs>(args: Subset<T, VersionAggregateArgs>): Prisma.PrismaPromise<GetVersionAggregateType<T>>

    /**
     * Group by Version.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VersionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VersionGroupByArgs['orderBy'] }
        : { orderBy?: VersionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VersionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVersionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Version model
   */
  readonly fields: VersionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Version.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VersionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    model<T extends ModelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ModelDefaultArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    equipmentItems<T extends Version$equipmentItemsArgs<ExtArgs> = {}>(args?: Subset<T, Version$equipmentItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "findMany"> | Null>
    maintenanceCosts<T extends Version$maintenanceCostsArgs<ExtArgs> = {}>(args?: Subset<T, Version$maintenanceCostsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "findMany"> | Null>
    comparisonItems<T extends Version$comparisonItemsArgs<ExtArgs> = {}>(args?: Subset<T, Version$comparisonItemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "findMany"> | Null>
    favorites<T extends Version$favoritesArgs<ExtArgs> = {}>(args?: Subset<T, Version$favoritesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Version model
   */ 
  interface VersionFieldRefs {
    readonly id: FieldRef<"Version", 'String'>
    readonly modelId: FieldRef<"Version", 'String'>
    readonly name: FieldRef<"Version", 'String'>
    readonly year: FieldRef<"Version", 'Int'>
    readonly priceClp: FieldRef<"Version", 'Int'>
    readonly transmission: FieldRef<"Version", 'String'>
    readonly fuel: FieldRef<"Version", 'String'>
    readonly engineDisplacementCc: FieldRef<"Version", 'Int'>
    readonly powerHp: FieldRef<"Version", 'Int'>
    readonly torqueNm: FieldRef<"Version", 'Int'>
    readonly consumptionCityKmL: FieldRef<"Version", 'Float'>
    readonly consumptionHighwayKmL: FieldRef<"Version", 'Float'>
    readonly lengthMm: FieldRef<"Version", 'Int'>
    readonly widthMm: FieldRef<"Version", 'Int'>
    readonly heightMm: FieldRef<"Version", 'Int'>
    readonly weightKg: FieldRef<"Version", 'Int'>
    readonly trunkLiters: FieldRef<"Version", 'Int'>
    readonly airbagCount: FieldRef<"Version", 'Int'>
    readonly hasAbs: FieldRef<"Version", 'Boolean'>
    readonly hasEsp: FieldRef<"Version", 'Boolean'>
    readonly hasCruiseControl: FieldRef<"Version", 'Boolean'>
    readonly deletedAt: FieldRef<"Version", 'DateTime'>
    readonly createdAt: FieldRef<"Version", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Version findUnique
   */
  export type VersionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * Filter, which Version to fetch.
     */
    where: VersionWhereUniqueInput
  }

  /**
   * Version findUniqueOrThrow
   */
  export type VersionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * Filter, which Version to fetch.
     */
    where: VersionWhereUniqueInput
  }

  /**
   * Version findFirst
   */
  export type VersionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * Filter, which Version to fetch.
     */
    where?: VersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Versions to fetch.
     */
    orderBy?: VersionOrderByWithRelationInput | VersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Versions.
     */
    cursor?: VersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Versions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Versions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Versions.
     */
    distinct?: VersionScalarFieldEnum | VersionScalarFieldEnum[]
  }

  /**
   * Version findFirstOrThrow
   */
  export type VersionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * Filter, which Version to fetch.
     */
    where?: VersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Versions to fetch.
     */
    orderBy?: VersionOrderByWithRelationInput | VersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Versions.
     */
    cursor?: VersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Versions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Versions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Versions.
     */
    distinct?: VersionScalarFieldEnum | VersionScalarFieldEnum[]
  }

  /**
   * Version findMany
   */
  export type VersionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * Filter, which Versions to fetch.
     */
    where?: VersionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Versions to fetch.
     */
    orderBy?: VersionOrderByWithRelationInput | VersionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Versions.
     */
    cursor?: VersionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Versions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Versions.
     */
    skip?: number
    distinct?: VersionScalarFieldEnum | VersionScalarFieldEnum[]
  }

  /**
   * Version create
   */
  export type VersionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * The data needed to create a Version.
     */
    data: XOR<VersionCreateInput, VersionUncheckedCreateInput>
  }

  /**
   * Version createMany
   */
  export type VersionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Versions.
     */
    data: VersionCreateManyInput | VersionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Version update
   */
  export type VersionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * The data needed to update a Version.
     */
    data: XOR<VersionUpdateInput, VersionUncheckedUpdateInput>
    /**
     * Choose, which Version to update.
     */
    where: VersionWhereUniqueInput
  }

  /**
   * Version updateMany
   */
  export type VersionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Versions.
     */
    data: XOR<VersionUpdateManyMutationInput, VersionUncheckedUpdateManyInput>
    /**
     * Filter which Versions to update
     */
    where?: VersionWhereInput
  }

  /**
   * Version upsert
   */
  export type VersionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * The filter to search for the Version to update in case it exists.
     */
    where: VersionWhereUniqueInput
    /**
     * In case the Version found by the `where` argument doesn't exist, create a new Version with this data.
     */
    create: XOR<VersionCreateInput, VersionUncheckedCreateInput>
    /**
     * In case the Version was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VersionUpdateInput, VersionUncheckedUpdateInput>
  }

  /**
   * Version delete
   */
  export type VersionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
    /**
     * Filter which Version to delete.
     */
    where: VersionWhereUniqueInput
  }

  /**
   * Version deleteMany
   */
  export type VersionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Versions to delete
     */
    where?: VersionWhereInput
  }

  /**
   * Version.equipmentItems
   */
  export type Version$equipmentItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    where?: VersionEquipmentWhereInput
    orderBy?: VersionEquipmentOrderByWithRelationInput | VersionEquipmentOrderByWithRelationInput[]
    cursor?: VersionEquipmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VersionEquipmentScalarFieldEnum | VersionEquipmentScalarFieldEnum[]
  }

  /**
   * Version.maintenanceCosts
   */
  export type Version$maintenanceCostsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    where?: MaintenanceCostWhereInput
    orderBy?: MaintenanceCostOrderByWithRelationInput | MaintenanceCostOrderByWithRelationInput[]
    cursor?: MaintenanceCostWhereUniqueInput
    take?: number
    skip?: number
    distinct?: MaintenanceCostScalarFieldEnum | MaintenanceCostScalarFieldEnum[]
  }

  /**
   * Version.comparisonItems
   */
  export type Version$comparisonItemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    where?: ComparisonItemWhereInput
    orderBy?: ComparisonItemOrderByWithRelationInput | ComparisonItemOrderByWithRelationInput[]
    cursor?: ComparisonItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ComparisonItemScalarFieldEnum | ComparisonItemScalarFieldEnum[]
  }

  /**
   * Version.favorites
   */
  export type Version$favoritesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    where?: FavoriteWhereInput
    orderBy?: FavoriteOrderByWithRelationInput | FavoriteOrderByWithRelationInput[]
    cursor?: FavoriteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FavoriteScalarFieldEnum | FavoriteScalarFieldEnum[]
  }

  /**
   * Version without action
   */
  export type VersionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Version
     */
    select?: VersionSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionInclude<ExtArgs> | null
  }


  /**
   * Model EquipmentItem
   */

  export type AggregateEquipmentItem = {
    _count: EquipmentItemCountAggregateOutputType | null
    _min: EquipmentItemMinAggregateOutputType | null
    _max: EquipmentItemMaxAggregateOutputType | null
  }

  export type EquipmentItemMinAggregateOutputType = {
    id: string | null
    name: string | null
    category: string | null
    deletedAt: Date | null
  }

  export type EquipmentItemMaxAggregateOutputType = {
    id: string | null
    name: string | null
    category: string | null
    deletedAt: Date | null
  }

  export type EquipmentItemCountAggregateOutputType = {
    id: number
    name: number
    category: number
    deletedAt: number
    _all: number
  }


  export type EquipmentItemMinAggregateInputType = {
    id?: true
    name?: true
    category?: true
    deletedAt?: true
  }

  export type EquipmentItemMaxAggregateInputType = {
    id?: true
    name?: true
    category?: true
    deletedAt?: true
  }

  export type EquipmentItemCountAggregateInputType = {
    id?: true
    name?: true
    category?: true
    deletedAt?: true
    _all?: true
  }

  export type EquipmentItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EquipmentItem to aggregate.
     */
    where?: EquipmentItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EquipmentItems to fetch.
     */
    orderBy?: EquipmentItemOrderByWithRelationInput | EquipmentItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EquipmentItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EquipmentItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EquipmentItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EquipmentItems
    **/
    _count?: true | EquipmentItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EquipmentItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EquipmentItemMaxAggregateInputType
  }

  export type GetEquipmentItemAggregateType<T extends EquipmentItemAggregateArgs> = {
        [P in keyof T & keyof AggregateEquipmentItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEquipmentItem[P]>
      : GetScalarType<T[P], AggregateEquipmentItem[P]>
  }




  export type EquipmentItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EquipmentItemWhereInput
    orderBy?: EquipmentItemOrderByWithAggregationInput | EquipmentItemOrderByWithAggregationInput[]
    by: EquipmentItemScalarFieldEnum[] | EquipmentItemScalarFieldEnum
    having?: EquipmentItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EquipmentItemCountAggregateInputType | true
    _min?: EquipmentItemMinAggregateInputType
    _max?: EquipmentItemMaxAggregateInputType
  }

  export type EquipmentItemGroupByOutputType = {
    id: string
    name: string
    category: string
    deletedAt: Date | null
    _count: EquipmentItemCountAggregateOutputType | null
    _min: EquipmentItemMinAggregateOutputType | null
    _max: EquipmentItemMaxAggregateOutputType | null
  }

  type GetEquipmentItemGroupByPayload<T extends EquipmentItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EquipmentItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EquipmentItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EquipmentItemGroupByOutputType[P]>
            : GetScalarType<T[P], EquipmentItemGroupByOutputType[P]>
        }
      >
    >


  export type EquipmentItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    name?: boolean
    category?: boolean
    deletedAt?: boolean
    versions?: boolean | EquipmentItem$versionsArgs<ExtArgs>
    _count?: boolean | EquipmentItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["equipmentItem"]>


  export type EquipmentItemSelectScalar = {
    id?: boolean
    name?: boolean
    category?: boolean
    deletedAt?: boolean
  }

  export type EquipmentItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    versions?: boolean | EquipmentItem$versionsArgs<ExtArgs>
    _count?: boolean | EquipmentItemCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $EquipmentItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EquipmentItem"
    objects: {
      versions: Prisma.$VersionEquipmentPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      name: string
      category: string
      deletedAt: Date | null
    }, ExtArgs["result"]["equipmentItem"]>
    composites: {}
  }

  type EquipmentItemGetPayload<S extends boolean | null | undefined | EquipmentItemDefaultArgs> = $Result.GetResult<Prisma.$EquipmentItemPayload, S>

  type EquipmentItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<EquipmentItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: EquipmentItemCountAggregateInputType | true
    }

  export interface EquipmentItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EquipmentItem'], meta: { name: 'EquipmentItem' } }
    /**
     * Find zero or one EquipmentItem that matches the filter.
     * @param {EquipmentItemFindUniqueArgs} args - Arguments to find a EquipmentItem
     * @example
     * // Get one EquipmentItem
     * const equipmentItem = await prisma.equipmentItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EquipmentItemFindUniqueArgs>(args: SelectSubset<T, EquipmentItemFindUniqueArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one EquipmentItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {EquipmentItemFindUniqueOrThrowArgs} args - Arguments to find a EquipmentItem
     * @example
     * // Get one EquipmentItem
     * const equipmentItem = await prisma.equipmentItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EquipmentItemFindUniqueOrThrowArgs>(args: SelectSubset<T, EquipmentItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first EquipmentItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EquipmentItemFindFirstArgs} args - Arguments to find a EquipmentItem
     * @example
     * // Get one EquipmentItem
     * const equipmentItem = await prisma.equipmentItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EquipmentItemFindFirstArgs>(args?: SelectSubset<T, EquipmentItemFindFirstArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first EquipmentItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EquipmentItemFindFirstOrThrowArgs} args - Arguments to find a EquipmentItem
     * @example
     * // Get one EquipmentItem
     * const equipmentItem = await prisma.equipmentItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EquipmentItemFindFirstOrThrowArgs>(args?: SelectSubset<T, EquipmentItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more EquipmentItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EquipmentItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EquipmentItems
     * const equipmentItems = await prisma.equipmentItem.findMany()
     * 
     * // Get first 10 EquipmentItems
     * const equipmentItems = await prisma.equipmentItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const equipmentItemWithIdOnly = await prisma.equipmentItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends EquipmentItemFindManyArgs>(args?: SelectSubset<T, EquipmentItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a EquipmentItem.
     * @param {EquipmentItemCreateArgs} args - Arguments to create a EquipmentItem.
     * @example
     * // Create one EquipmentItem
     * const EquipmentItem = await prisma.equipmentItem.create({
     *   data: {
     *     // ... data to create a EquipmentItem
     *   }
     * })
     * 
     */
    create<T extends EquipmentItemCreateArgs>(args: SelectSubset<T, EquipmentItemCreateArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many EquipmentItems.
     * @param {EquipmentItemCreateManyArgs} args - Arguments to create many EquipmentItems.
     * @example
     * // Create many EquipmentItems
     * const equipmentItem = await prisma.equipmentItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends EquipmentItemCreateManyArgs>(args?: SelectSubset<T, EquipmentItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a EquipmentItem.
     * @param {EquipmentItemDeleteArgs} args - Arguments to delete one EquipmentItem.
     * @example
     * // Delete one EquipmentItem
     * const EquipmentItem = await prisma.equipmentItem.delete({
     *   where: {
     *     // ... filter to delete one EquipmentItem
     *   }
     * })
     * 
     */
    delete<T extends EquipmentItemDeleteArgs>(args: SelectSubset<T, EquipmentItemDeleteArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one EquipmentItem.
     * @param {EquipmentItemUpdateArgs} args - Arguments to update one EquipmentItem.
     * @example
     * // Update one EquipmentItem
     * const equipmentItem = await prisma.equipmentItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends EquipmentItemUpdateArgs>(args: SelectSubset<T, EquipmentItemUpdateArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more EquipmentItems.
     * @param {EquipmentItemDeleteManyArgs} args - Arguments to filter EquipmentItems to delete.
     * @example
     * // Delete a few EquipmentItems
     * const { count } = await prisma.equipmentItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends EquipmentItemDeleteManyArgs>(args?: SelectSubset<T, EquipmentItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more EquipmentItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EquipmentItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EquipmentItems
     * const equipmentItem = await prisma.equipmentItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends EquipmentItemUpdateManyArgs>(args: SelectSubset<T, EquipmentItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one EquipmentItem.
     * @param {EquipmentItemUpsertArgs} args - Arguments to update or create a EquipmentItem.
     * @example
     * // Update or create a EquipmentItem
     * const equipmentItem = await prisma.equipmentItem.upsert({
     *   create: {
     *     // ... data to create a EquipmentItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EquipmentItem we want to update
     *   }
     * })
     */
    upsert<T extends EquipmentItemUpsertArgs>(args: SelectSubset<T, EquipmentItemUpsertArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of EquipmentItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EquipmentItemCountArgs} args - Arguments to filter EquipmentItems to count.
     * @example
     * // Count the number of EquipmentItems
     * const count = await prisma.equipmentItem.count({
     *   where: {
     *     // ... the filter for the EquipmentItems we want to count
     *   }
     * })
    **/
    count<T extends EquipmentItemCountArgs>(
      args?: Subset<T, EquipmentItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EquipmentItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a EquipmentItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EquipmentItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends EquipmentItemAggregateArgs>(args: Subset<T, EquipmentItemAggregateArgs>): Prisma.PrismaPromise<GetEquipmentItemAggregateType<T>>

    /**
     * Group by EquipmentItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EquipmentItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends EquipmentItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EquipmentItemGroupByArgs['orderBy'] }
        : { orderBy?: EquipmentItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EquipmentItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEquipmentItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the EquipmentItem model
   */
  readonly fields: EquipmentItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EquipmentItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EquipmentItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    versions<T extends EquipmentItem$versionsArgs<ExtArgs> = {}>(args?: Subset<T, EquipmentItem$versionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EquipmentItem model
   */ 
  interface EquipmentItemFieldRefs {
    readonly id: FieldRef<"EquipmentItem", 'String'>
    readonly name: FieldRef<"EquipmentItem", 'String'>
    readonly category: FieldRef<"EquipmentItem", 'String'>
    readonly deletedAt: FieldRef<"EquipmentItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EquipmentItem findUnique
   */
  export type EquipmentItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * Filter, which EquipmentItem to fetch.
     */
    where: EquipmentItemWhereUniqueInput
  }

  /**
   * EquipmentItem findUniqueOrThrow
   */
  export type EquipmentItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * Filter, which EquipmentItem to fetch.
     */
    where: EquipmentItemWhereUniqueInput
  }

  /**
   * EquipmentItem findFirst
   */
  export type EquipmentItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * Filter, which EquipmentItem to fetch.
     */
    where?: EquipmentItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EquipmentItems to fetch.
     */
    orderBy?: EquipmentItemOrderByWithRelationInput | EquipmentItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EquipmentItems.
     */
    cursor?: EquipmentItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EquipmentItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EquipmentItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EquipmentItems.
     */
    distinct?: EquipmentItemScalarFieldEnum | EquipmentItemScalarFieldEnum[]
  }

  /**
   * EquipmentItem findFirstOrThrow
   */
  export type EquipmentItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * Filter, which EquipmentItem to fetch.
     */
    where?: EquipmentItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EquipmentItems to fetch.
     */
    orderBy?: EquipmentItemOrderByWithRelationInput | EquipmentItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EquipmentItems.
     */
    cursor?: EquipmentItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EquipmentItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EquipmentItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EquipmentItems.
     */
    distinct?: EquipmentItemScalarFieldEnum | EquipmentItemScalarFieldEnum[]
  }

  /**
   * EquipmentItem findMany
   */
  export type EquipmentItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * Filter, which EquipmentItems to fetch.
     */
    where?: EquipmentItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EquipmentItems to fetch.
     */
    orderBy?: EquipmentItemOrderByWithRelationInput | EquipmentItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EquipmentItems.
     */
    cursor?: EquipmentItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EquipmentItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EquipmentItems.
     */
    skip?: number
    distinct?: EquipmentItemScalarFieldEnum | EquipmentItemScalarFieldEnum[]
  }

  /**
   * EquipmentItem create
   */
  export type EquipmentItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * The data needed to create a EquipmentItem.
     */
    data: XOR<EquipmentItemCreateInput, EquipmentItemUncheckedCreateInput>
  }

  /**
   * EquipmentItem createMany
   */
  export type EquipmentItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EquipmentItems.
     */
    data: EquipmentItemCreateManyInput | EquipmentItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EquipmentItem update
   */
  export type EquipmentItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * The data needed to update a EquipmentItem.
     */
    data: XOR<EquipmentItemUpdateInput, EquipmentItemUncheckedUpdateInput>
    /**
     * Choose, which EquipmentItem to update.
     */
    where: EquipmentItemWhereUniqueInput
  }

  /**
   * EquipmentItem updateMany
   */
  export type EquipmentItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EquipmentItems.
     */
    data: XOR<EquipmentItemUpdateManyMutationInput, EquipmentItemUncheckedUpdateManyInput>
    /**
     * Filter which EquipmentItems to update
     */
    where?: EquipmentItemWhereInput
  }

  /**
   * EquipmentItem upsert
   */
  export type EquipmentItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * The filter to search for the EquipmentItem to update in case it exists.
     */
    where: EquipmentItemWhereUniqueInput
    /**
     * In case the EquipmentItem found by the `where` argument doesn't exist, create a new EquipmentItem with this data.
     */
    create: XOR<EquipmentItemCreateInput, EquipmentItemUncheckedCreateInput>
    /**
     * In case the EquipmentItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EquipmentItemUpdateInput, EquipmentItemUncheckedUpdateInput>
  }

  /**
   * EquipmentItem delete
   */
  export type EquipmentItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
    /**
     * Filter which EquipmentItem to delete.
     */
    where: EquipmentItemWhereUniqueInput
  }

  /**
   * EquipmentItem deleteMany
   */
  export type EquipmentItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EquipmentItems to delete
     */
    where?: EquipmentItemWhereInput
  }

  /**
   * EquipmentItem.versions
   */
  export type EquipmentItem$versionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    where?: VersionEquipmentWhereInput
    orderBy?: VersionEquipmentOrderByWithRelationInput | VersionEquipmentOrderByWithRelationInput[]
    cursor?: VersionEquipmentWhereUniqueInput
    take?: number
    skip?: number
    distinct?: VersionEquipmentScalarFieldEnum | VersionEquipmentScalarFieldEnum[]
  }

  /**
   * EquipmentItem without action
   */
  export type EquipmentItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EquipmentItem
     */
    select?: EquipmentItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EquipmentItemInclude<ExtArgs> | null
  }


  /**
   * Model VersionEquipment
   */

  export type AggregateVersionEquipment = {
    _count: VersionEquipmentCountAggregateOutputType | null
    _min: VersionEquipmentMinAggregateOutputType | null
    _max: VersionEquipmentMaxAggregateOutputType | null
  }

  export type VersionEquipmentMinAggregateOutputType = {
    versionId: string | null
    equipmentItemId: string | null
  }

  export type VersionEquipmentMaxAggregateOutputType = {
    versionId: string | null
    equipmentItemId: string | null
  }

  export type VersionEquipmentCountAggregateOutputType = {
    versionId: number
    equipmentItemId: number
    _all: number
  }


  export type VersionEquipmentMinAggregateInputType = {
    versionId?: true
    equipmentItemId?: true
  }

  export type VersionEquipmentMaxAggregateInputType = {
    versionId?: true
    equipmentItemId?: true
  }

  export type VersionEquipmentCountAggregateInputType = {
    versionId?: true
    equipmentItemId?: true
    _all?: true
  }

  export type VersionEquipmentAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VersionEquipment to aggregate.
     */
    where?: VersionEquipmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VersionEquipments to fetch.
     */
    orderBy?: VersionEquipmentOrderByWithRelationInput | VersionEquipmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: VersionEquipmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VersionEquipments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VersionEquipments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned VersionEquipments
    **/
    _count?: true | VersionEquipmentCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: VersionEquipmentMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: VersionEquipmentMaxAggregateInputType
  }

  export type GetVersionEquipmentAggregateType<T extends VersionEquipmentAggregateArgs> = {
        [P in keyof T & keyof AggregateVersionEquipment]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateVersionEquipment[P]>
      : GetScalarType<T[P], AggregateVersionEquipment[P]>
  }




  export type VersionEquipmentGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: VersionEquipmentWhereInput
    orderBy?: VersionEquipmentOrderByWithAggregationInput | VersionEquipmentOrderByWithAggregationInput[]
    by: VersionEquipmentScalarFieldEnum[] | VersionEquipmentScalarFieldEnum
    having?: VersionEquipmentScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: VersionEquipmentCountAggregateInputType | true
    _min?: VersionEquipmentMinAggregateInputType
    _max?: VersionEquipmentMaxAggregateInputType
  }

  export type VersionEquipmentGroupByOutputType = {
    versionId: string
    equipmentItemId: string
    _count: VersionEquipmentCountAggregateOutputType | null
    _min: VersionEquipmentMinAggregateOutputType | null
    _max: VersionEquipmentMaxAggregateOutputType | null
  }

  type GetVersionEquipmentGroupByPayload<T extends VersionEquipmentGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<VersionEquipmentGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof VersionEquipmentGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], VersionEquipmentGroupByOutputType[P]>
            : GetScalarType<T[P], VersionEquipmentGroupByOutputType[P]>
        }
      >
    >


  export type VersionEquipmentSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    versionId?: boolean
    equipmentItemId?: boolean
    version?: boolean | VersionDefaultArgs<ExtArgs>
    equipmentItem?: boolean | EquipmentItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["versionEquipment"]>


  export type VersionEquipmentSelectScalar = {
    versionId?: boolean
    equipmentItemId?: boolean
  }

  export type VersionEquipmentInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    version?: boolean | VersionDefaultArgs<ExtArgs>
    equipmentItem?: boolean | EquipmentItemDefaultArgs<ExtArgs>
  }

  export type $VersionEquipmentPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "VersionEquipment"
    objects: {
      version: Prisma.$VersionPayload<ExtArgs>
      equipmentItem: Prisma.$EquipmentItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      versionId: string
      equipmentItemId: string
    }, ExtArgs["result"]["versionEquipment"]>
    composites: {}
  }

  type VersionEquipmentGetPayload<S extends boolean | null | undefined | VersionEquipmentDefaultArgs> = $Result.GetResult<Prisma.$VersionEquipmentPayload, S>

  type VersionEquipmentCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<VersionEquipmentFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: VersionEquipmentCountAggregateInputType | true
    }

  export interface VersionEquipmentDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['VersionEquipment'], meta: { name: 'VersionEquipment' } }
    /**
     * Find zero or one VersionEquipment that matches the filter.
     * @param {VersionEquipmentFindUniqueArgs} args - Arguments to find a VersionEquipment
     * @example
     * // Get one VersionEquipment
     * const versionEquipment = await prisma.versionEquipment.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends VersionEquipmentFindUniqueArgs>(args: SelectSubset<T, VersionEquipmentFindUniqueArgs<ExtArgs>>): Prisma__VersionEquipmentClient<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one VersionEquipment that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {VersionEquipmentFindUniqueOrThrowArgs} args - Arguments to find a VersionEquipment
     * @example
     * // Get one VersionEquipment
     * const versionEquipment = await prisma.versionEquipment.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends VersionEquipmentFindUniqueOrThrowArgs>(args: SelectSubset<T, VersionEquipmentFindUniqueOrThrowArgs<ExtArgs>>): Prisma__VersionEquipmentClient<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first VersionEquipment that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionEquipmentFindFirstArgs} args - Arguments to find a VersionEquipment
     * @example
     * // Get one VersionEquipment
     * const versionEquipment = await prisma.versionEquipment.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends VersionEquipmentFindFirstArgs>(args?: SelectSubset<T, VersionEquipmentFindFirstArgs<ExtArgs>>): Prisma__VersionEquipmentClient<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first VersionEquipment that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionEquipmentFindFirstOrThrowArgs} args - Arguments to find a VersionEquipment
     * @example
     * // Get one VersionEquipment
     * const versionEquipment = await prisma.versionEquipment.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends VersionEquipmentFindFirstOrThrowArgs>(args?: SelectSubset<T, VersionEquipmentFindFirstOrThrowArgs<ExtArgs>>): Prisma__VersionEquipmentClient<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more VersionEquipments that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionEquipmentFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all VersionEquipments
     * const versionEquipments = await prisma.versionEquipment.findMany()
     * 
     * // Get first 10 VersionEquipments
     * const versionEquipments = await prisma.versionEquipment.findMany({ take: 10 })
     * 
     * // Only select the `versionId`
     * const versionEquipmentWithVersionIdOnly = await prisma.versionEquipment.findMany({ select: { versionId: true } })
     * 
     */
    findMany<T extends VersionEquipmentFindManyArgs>(args?: SelectSubset<T, VersionEquipmentFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a VersionEquipment.
     * @param {VersionEquipmentCreateArgs} args - Arguments to create a VersionEquipment.
     * @example
     * // Create one VersionEquipment
     * const VersionEquipment = await prisma.versionEquipment.create({
     *   data: {
     *     // ... data to create a VersionEquipment
     *   }
     * })
     * 
     */
    create<T extends VersionEquipmentCreateArgs>(args: SelectSubset<T, VersionEquipmentCreateArgs<ExtArgs>>): Prisma__VersionEquipmentClient<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many VersionEquipments.
     * @param {VersionEquipmentCreateManyArgs} args - Arguments to create many VersionEquipments.
     * @example
     * // Create many VersionEquipments
     * const versionEquipment = await prisma.versionEquipment.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends VersionEquipmentCreateManyArgs>(args?: SelectSubset<T, VersionEquipmentCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a VersionEquipment.
     * @param {VersionEquipmentDeleteArgs} args - Arguments to delete one VersionEquipment.
     * @example
     * // Delete one VersionEquipment
     * const VersionEquipment = await prisma.versionEquipment.delete({
     *   where: {
     *     // ... filter to delete one VersionEquipment
     *   }
     * })
     * 
     */
    delete<T extends VersionEquipmentDeleteArgs>(args: SelectSubset<T, VersionEquipmentDeleteArgs<ExtArgs>>): Prisma__VersionEquipmentClient<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one VersionEquipment.
     * @param {VersionEquipmentUpdateArgs} args - Arguments to update one VersionEquipment.
     * @example
     * // Update one VersionEquipment
     * const versionEquipment = await prisma.versionEquipment.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends VersionEquipmentUpdateArgs>(args: SelectSubset<T, VersionEquipmentUpdateArgs<ExtArgs>>): Prisma__VersionEquipmentClient<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more VersionEquipments.
     * @param {VersionEquipmentDeleteManyArgs} args - Arguments to filter VersionEquipments to delete.
     * @example
     * // Delete a few VersionEquipments
     * const { count } = await prisma.versionEquipment.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends VersionEquipmentDeleteManyArgs>(args?: SelectSubset<T, VersionEquipmentDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more VersionEquipments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionEquipmentUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many VersionEquipments
     * const versionEquipment = await prisma.versionEquipment.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends VersionEquipmentUpdateManyArgs>(args: SelectSubset<T, VersionEquipmentUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one VersionEquipment.
     * @param {VersionEquipmentUpsertArgs} args - Arguments to update or create a VersionEquipment.
     * @example
     * // Update or create a VersionEquipment
     * const versionEquipment = await prisma.versionEquipment.upsert({
     *   create: {
     *     // ... data to create a VersionEquipment
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the VersionEquipment we want to update
     *   }
     * })
     */
    upsert<T extends VersionEquipmentUpsertArgs>(args: SelectSubset<T, VersionEquipmentUpsertArgs<ExtArgs>>): Prisma__VersionEquipmentClient<$Result.GetResult<Prisma.$VersionEquipmentPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of VersionEquipments.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionEquipmentCountArgs} args - Arguments to filter VersionEquipments to count.
     * @example
     * // Count the number of VersionEquipments
     * const count = await prisma.versionEquipment.count({
     *   where: {
     *     // ... the filter for the VersionEquipments we want to count
     *   }
     * })
    **/
    count<T extends VersionEquipmentCountArgs>(
      args?: Subset<T, VersionEquipmentCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], VersionEquipmentCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a VersionEquipment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionEquipmentAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends VersionEquipmentAggregateArgs>(args: Subset<T, VersionEquipmentAggregateArgs>): Prisma.PrismaPromise<GetVersionEquipmentAggregateType<T>>

    /**
     * Group by VersionEquipment.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {VersionEquipmentGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends VersionEquipmentGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: VersionEquipmentGroupByArgs['orderBy'] }
        : { orderBy?: VersionEquipmentGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, VersionEquipmentGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetVersionEquipmentGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the VersionEquipment model
   */
  readonly fields: VersionEquipmentFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for VersionEquipment.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__VersionEquipmentClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    version<T extends VersionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VersionDefaultArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    equipmentItem<T extends EquipmentItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EquipmentItemDefaultArgs<ExtArgs>>): Prisma__EquipmentItemClient<$Result.GetResult<Prisma.$EquipmentItemPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the VersionEquipment model
   */ 
  interface VersionEquipmentFieldRefs {
    readonly versionId: FieldRef<"VersionEquipment", 'String'>
    readonly equipmentItemId: FieldRef<"VersionEquipment", 'String'>
  }
    

  // Custom InputTypes
  /**
   * VersionEquipment findUnique
   */
  export type VersionEquipmentFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * Filter, which VersionEquipment to fetch.
     */
    where: VersionEquipmentWhereUniqueInput
  }

  /**
   * VersionEquipment findUniqueOrThrow
   */
  export type VersionEquipmentFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * Filter, which VersionEquipment to fetch.
     */
    where: VersionEquipmentWhereUniqueInput
  }

  /**
   * VersionEquipment findFirst
   */
  export type VersionEquipmentFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * Filter, which VersionEquipment to fetch.
     */
    where?: VersionEquipmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VersionEquipments to fetch.
     */
    orderBy?: VersionEquipmentOrderByWithRelationInput | VersionEquipmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VersionEquipments.
     */
    cursor?: VersionEquipmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VersionEquipments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VersionEquipments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VersionEquipments.
     */
    distinct?: VersionEquipmentScalarFieldEnum | VersionEquipmentScalarFieldEnum[]
  }

  /**
   * VersionEquipment findFirstOrThrow
   */
  export type VersionEquipmentFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * Filter, which VersionEquipment to fetch.
     */
    where?: VersionEquipmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VersionEquipments to fetch.
     */
    orderBy?: VersionEquipmentOrderByWithRelationInput | VersionEquipmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for VersionEquipments.
     */
    cursor?: VersionEquipmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VersionEquipments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VersionEquipments.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of VersionEquipments.
     */
    distinct?: VersionEquipmentScalarFieldEnum | VersionEquipmentScalarFieldEnum[]
  }

  /**
   * VersionEquipment findMany
   */
  export type VersionEquipmentFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * Filter, which VersionEquipments to fetch.
     */
    where?: VersionEquipmentWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of VersionEquipments to fetch.
     */
    orderBy?: VersionEquipmentOrderByWithRelationInput | VersionEquipmentOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing VersionEquipments.
     */
    cursor?: VersionEquipmentWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` VersionEquipments from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` VersionEquipments.
     */
    skip?: number
    distinct?: VersionEquipmentScalarFieldEnum | VersionEquipmentScalarFieldEnum[]
  }

  /**
   * VersionEquipment create
   */
  export type VersionEquipmentCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * The data needed to create a VersionEquipment.
     */
    data: XOR<VersionEquipmentCreateInput, VersionEquipmentUncheckedCreateInput>
  }

  /**
   * VersionEquipment createMany
   */
  export type VersionEquipmentCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many VersionEquipments.
     */
    data: VersionEquipmentCreateManyInput | VersionEquipmentCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * VersionEquipment update
   */
  export type VersionEquipmentUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * The data needed to update a VersionEquipment.
     */
    data: XOR<VersionEquipmentUpdateInput, VersionEquipmentUncheckedUpdateInput>
    /**
     * Choose, which VersionEquipment to update.
     */
    where: VersionEquipmentWhereUniqueInput
  }

  /**
   * VersionEquipment updateMany
   */
  export type VersionEquipmentUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update VersionEquipments.
     */
    data: XOR<VersionEquipmentUpdateManyMutationInput, VersionEquipmentUncheckedUpdateManyInput>
    /**
     * Filter which VersionEquipments to update
     */
    where?: VersionEquipmentWhereInput
  }

  /**
   * VersionEquipment upsert
   */
  export type VersionEquipmentUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * The filter to search for the VersionEquipment to update in case it exists.
     */
    where: VersionEquipmentWhereUniqueInput
    /**
     * In case the VersionEquipment found by the `where` argument doesn't exist, create a new VersionEquipment with this data.
     */
    create: XOR<VersionEquipmentCreateInput, VersionEquipmentUncheckedCreateInput>
    /**
     * In case the VersionEquipment was found with the provided `where` argument, update it with this data.
     */
    update: XOR<VersionEquipmentUpdateInput, VersionEquipmentUncheckedUpdateInput>
  }

  /**
   * VersionEquipment delete
   */
  export type VersionEquipmentDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
    /**
     * Filter which VersionEquipment to delete.
     */
    where: VersionEquipmentWhereUniqueInput
  }

  /**
   * VersionEquipment deleteMany
   */
  export type VersionEquipmentDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which VersionEquipments to delete
     */
    where?: VersionEquipmentWhereInput
  }

  /**
   * VersionEquipment without action
   */
  export type VersionEquipmentDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the VersionEquipment
     */
    select?: VersionEquipmentSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: VersionEquipmentInclude<ExtArgs> | null
  }


  /**
   * Model MaintenanceCost
   */

  export type AggregateMaintenanceCost = {
    _count: MaintenanceCostCountAggregateOutputType | null
    _avg: MaintenanceCostAvgAggregateOutputType | null
    _sum: MaintenanceCostSumAggregateOutputType | null
    _min: MaintenanceCostMinAggregateOutputType | null
    _max: MaintenanceCostMaxAggregateOutputType | null
  }

  export type MaintenanceCostAvgAggregateOutputType = {
    mileageTag: number | null
    costClp: number | null
  }

  export type MaintenanceCostSumAggregateOutputType = {
    mileageTag: number | null
    costClp: number | null
  }

  export type MaintenanceCostMinAggregateOutputType = {
    id: string | null
    versionId: string | null
    mileageTag: number | null
    costClp: number | null
    deletedAt: Date | null
  }

  export type MaintenanceCostMaxAggregateOutputType = {
    id: string | null
    versionId: string | null
    mileageTag: number | null
    costClp: number | null
    deletedAt: Date | null
  }

  export type MaintenanceCostCountAggregateOutputType = {
    id: number
    versionId: number
    mileageTag: number
    costClp: number
    deletedAt: number
    _all: number
  }


  export type MaintenanceCostAvgAggregateInputType = {
    mileageTag?: true
    costClp?: true
  }

  export type MaintenanceCostSumAggregateInputType = {
    mileageTag?: true
    costClp?: true
  }

  export type MaintenanceCostMinAggregateInputType = {
    id?: true
    versionId?: true
    mileageTag?: true
    costClp?: true
    deletedAt?: true
  }

  export type MaintenanceCostMaxAggregateInputType = {
    id?: true
    versionId?: true
    mileageTag?: true
    costClp?: true
    deletedAt?: true
  }

  export type MaintenanceCostCountAggregateInputType = {
    id?: true
    versionId?: true
    mileageTag?: true
    costClp?: true
    deletedAt?: true
    _all?: true
  }

  export type MaintenanceCostAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MaintenanceCost to aggregate.
     */
    where?: MaintenanceCostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MaintenanceCosts to fetch.
     */
    orderBy?: MaintenanceCostOrderByWithRelationInput | MaintenanceCostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: MaintenanceCostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MaintenanceCosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MaintenanceCosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned MaintenanceCosts
    **/
    _count?: true | MaintenanceCostCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: MaintenanceCostAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: MaintenanceCostSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: MaintenanceCostMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: MaintenanceCostMaxAggregateInputType
  }

  export type GetMaintenanceCostAggregateType<T extends MaintenanceCostAggregateArgs> = {
        [P in keyof T & keyof AggregateMaintenanceCost]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateMaintenanceCost[P]>
      : GetScalarType<T[P], AggregateMaintenanceCost[P]>
  }




  export type MaintenanceCostGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: MaintenanceCostWhereInput
    orderBy?: MaintenanceCostOrderByWithAggregationInput | MaintenanceCostOrderByWithAggregationInput[]
    by: MaintenanceCostScalarFieldEnum[] | MaintenanceCostScalarFieldEnum
    having?: MaintenanceCostScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: MaintenanceCostCountAggregateInputType | true
    _avg?: MaintenanceCostAvgAggregateInputType
    _sum?: MaintenanceCostSumAggregateInputType
    _min?: MaintenanceCostMinAggregateInputType
    _max?: MaintenanceCostMaxAggregateInputType
  }

  export type MaintenanceCostGroupByOutputType = {
    id: string
    versionId: string
    mileageTag: number
    costClp: number
    deletedAt: Date | null
    _count: MaintenanceCostCountAggregateOutputType | null
    _avg: MaintenanceCostAvgAggregateOutputType | null
    _sum: MaintenanceCostSumAggregateOutputType | null
    _min: MaintenanceCostMinAggregateOutputType | null
    _max: MaintenanceCostMaxAggregateOutputType | null
  }

  type GetMaintenanceCostGroupByPayload<T extends MaintenanceCostGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<MaintenanceCostGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof MaintenanceCostGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], MaintenanceCostGroupByOutputType[P]>
            : GetScalarType<T[P], MaintenanceCostGroupByOutputType[P]>
        }
      >
    >


  export type MaintenanceCostSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    versionId?: boolean
    mileageTag?: boolean
    costClp?: boolean
    deletedAt?: boolean
    version?: boolean | VersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["maintenanceCost"]>


  export type MaintenanceCostSelectScalar = {
    id?: boolean
    versionId?: boolean
    mileageTag?: boolean
    costClp?: boolean
    deletedAt?: boolean
  }

  export type MaintenanceCostInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    version?: boolean | VersionDefaultArgs<ExtArgs>
  }

  export type $MaintenanceCostPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "MaintenanceCost"
    objects: {
      version: Prisma.$VersionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      versionId: string
      mileageTag: number
      costClp: number
      deletedAt: Date | null
    }, ExtArgs["result"]["maintenanceCost"]>
    composites: {}
  }

  type MaintenanceCostGetPayload<S extends boolean | null | undefined | MaintenanceCostDefaultArgs> = $Result.GetResult<Prisma.$MaintenanceCostPayload, S>

  type MaintenanceCostCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<MaintenanceCostFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: MaintenanceCostCountAggregateInputType | true
    }

  export interface MaintenanceCostDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['MaintenanceCost'], meta: { name: 'MaintenanceCost' } }
    /**
     * Find zero or one MaintenanceCost that matches the filter.
     * @param {MaintenanceCostFindUniqueArgs} args - Arguments to find a MaintenanceCost
     * @example
     * // Get one MaintenanceCost
     * const maintenanceCost = await prisma.maintenanceCost.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends MaintenanceCostFindUniqueArgs>(args: SelectSubset<T, MaintenanceCostFindUniqueArgs<ExtArgs>>): Prisma__MaintenanceCostClient<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one MaintenanceCost that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {MaintenanceCostFindUniqueOrThrowArgs} args - Arguments to find a MaintenanceCost
     * @example
     * // Get one MaintenanceCost
     * const maintenanceCost = await prisma.maintenanceCost.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends MaintenanceCostFindUniqueOrThrowArgs>(args: SelectSubset<T, MaintenanceCostFindUniqueOrThrowArgs<ExtArgs>>): Prisma__MaintenanceCostClient<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first MaintenanceCost that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MaintenanceCostFindFirstArgs} args - Arguments to find a MaintenanceCost
     * @example
     * // Get one MaintenanceCost
     * const maintenanceCost = await prisma.maintenanceCost.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends MaintenanceCostFindFirstArgs>(args?: SelectSubset<T, MaintenanceCostFindFirstArgs<ExtArgs>>): Prisma__MaintenanceCostClient<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first MaintenanceCost that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MaintenanceCostFindFirstOrThrowArgs} args - Arguments to find a MaintenanceCost
     * @example
     * // Get one MaintenanceCost
     * const maintenanceCost = await prisma.maintenanceCost.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends MaintenanceCostFindFirstOrThrowArgs>(args?: SelectSubset<T, MaintenanceCostFindFirstOrThrowArgs<ExtArgs>>): Prisma__MaintenanceCostClient<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more MaintenanceCosts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MaintenanceCostFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all MaintenanceCosts
     * const maintenanceCosts = await prisma.maintenanceCost.findMany()
     * 
     * // Get first 10 MaintenanceCosts
     * const maintenanceCosts = await prisma.maintenanceCost.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const maintenanceCostWithIdOnly = await prisma.maintenanceCost.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends MaintenanceCostFindManyArgs>(args?: SelectSubset<T, MaintenanceCostFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a MaintenanceCost.
     * @param {MaintenanceCostCreateArgs} args - Arguments to create a MaintenanceCost.
     * @example
     * // Create one MaintenanceCost
     * const MaintenanceCost = await prisma.maintenanceCost.create({
     *   data: {
     *     // ... data to create a MaintenanceCost
     *   }
     * })
     * 
     */
    create<T extends MaintenanceCostCreateArgs>(args: SelectSubset<T, MaintenanceCostCreateArgs<ExtArgs>>): Prisma__MaintenanceCostClient<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many MaintenanceCosts.
     * @param {MaintenanceCostCreateManyArgs} args - Arguments to create many MaintenanceCosts.
     * @example
     * // Create many MaintenanceCosts
     * const maintenanceCost = await prisma.maintenanceCost.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends MaintenanceCostCreateManyArgs>(args?: SelectSubset<T, MaintenanceCostCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a MaintenanceCost.
     * @param {MaintenanceCostDeleteArgs} args - Arguments to delete one MaintenanceCost.
     * @example
     * // Delete one MaintenanceCost
     * const MaintenanceCost = await prisma.maintenanceCost.delete({
     *   where: {
     *     // ... filter to delete one MaintenanceCost
     *   }
     * })
     * 
     */
    delete<T extends MaintenanceCostDeleteArgs>(args: SelectSubset<T, MaintenanceCostDeleteArgs<ExtArgs>>): Prisma__MaintenanceCostClient<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one MaintenanceCost.
     * @param {MaintenanceCostUpdateArgs} args - Arguments to update one MaintenanceCost.
     * @example
     * // Update one MaintenanceCost
     * const maintenanceCost = await prisma.maintenanceCost.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends MaintenanceCostUpdateArgs>(args: SelectSubset<T, MaintenanceCostUpdateArgs<ExtArgs>>): Prisma__MaintenanceCostClient<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more MaintenanceCosts.
     * @param {MaintenanceCostDeleteManyArgs} args - Arguments to filter MaintenanceCosts to delete.
     * @example
     * // Delete a few MaintenanceCosts
     * const { count } = await prisma.maintenanceCost.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends MaintenanceCostDeleteManyArgs>(args?: SelectSubset<T, MaintenanceCostDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more MaintenanceCosts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MaintenanceCostUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many MaintenanceCosts
     * const maintenanceCost = await prisma.maintenanceCost.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends MaintenanceCostUpdateManyArgs>(args: SelectSubset<T, MaintenanceCostUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one MaintenanceCost.
     * @param {MaintenanceCostUpsertArgs} args - Arguments to update or create a MaintenanceCost.
     * @example
     * // Update or create a MaintenanceCost
     * const maintenanceCost = await prisma.maintenanceCost.upsert({
     *   create: {
     *     // ... data to create a MaintenanceCost
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the MaintenanceCost we want to update
     *   }
     * })
     */
    upsert<T extends MaintenanceCostUpsertArgs>(args: SelectSubset<T, MaintenanceCostUpsertArgs<ExtArgs>>): Prisma__MaintenanceCostClient<$Result.GetResult<Prisma.$MaintenanceCostPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of MaintenanceCosts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MaintenanceCostCountArgs} args - Arguments to filter MaintenanceCosts to count.
     * @example
     * // Count the number of MaintenanceCosts
     * const count = await prisma.maintenanceCost.count({
     *   where: {
     *     // ... the filter for the MaintenanceCosts we want to count
     *   }
     * })
    **/
    count<T extends MaintenanceCostCountArgs>(
      args?: Subset<T, MaintenanceCostCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], MaintenanceCostCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a MaintenanceCost.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MaintenanceCostAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends MaintenanceCostAggregateArgs>(args: Subset<T, MaintenanceCostAggregateArgs>): Prisma.PrismaPromise<GetMaintenanceCostAggregateType<T>>

    /**
     * Group by MaintenanceCost.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {MaintenanceCostGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends MaintenanceCostGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: MaintenanceCostGroupByArgs['orderBy'] }
        : { orderBy?: MaintenanceCostGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, MaintenanceCostGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetMaintenanceCostGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the MaintenanceCost model
   */
  readonly fields: MaintenanceCostFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for MaintenanceCost.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__MaintenanceCostClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    version<T extends VersionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VersionDefaultArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the MaintenanceCost model
   */ 
  interface MaintenanceCostFieldRefs {
    readonly id: FieldRef<"MaintenanceCost", 'String'>
    readonly versionId: FieldRef<"MaintenanceCost", 'String'>
    readonly mileageTag: FieldRef<"MaintenanceCost", 'Int'>
    readonly costClp: FieldRef<"MaintenanceCost", 'Int'>
    readonly deletedAt: FieldRef<"MaintenanceCost", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * MaintenanceCost findUnique
   */
  export type MaintenanceCostFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * Filter, which MaintenanceCost to fetch.
     */
    where: MaintenanceCostWhereUniqueInput
  }

  /**
   * MaintenanceCost findUniqueOrThrow
   */
  export type MaintenanceCostFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * Filter, which MaintenanceCost to fetch.
     */
    where: MaintenanceCostWhereUniqueInput
  }

  /**
   * MaintenanceCost findFirst
   */
  export type MaintenanceCostFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * Filter, which MaintenanceCost to fetch.
     */
    where?: MaintenanceCostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MaintenanceCosts to fetch.
     */
    orderBy?: MaintenanceCostOrderByWithRelationInput | MaintenanceCostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MaintenanceCosts.
     */
    cursor?: MaintenanceCostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MaintenanceCosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MaintenanceCosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MaintenanceCosts.
     */
    distinct?: MaintenanceCostScalarFieldEnum | MaintenanceCostScalarFieldEnum[]
  }

  /**
   * MaintenanceCost findFirstOrThrow
   */
  export type MaintenanceCostFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * Filter, which MaintenanceCost to fetch.
     */
    where?: MaintenanceCostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MaintenanceCosts to fetch.
     */
    orderBy?: MaintenanceCostOrderByWithRelationInput | MaintenanceCostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for MaintenanceCosts.
     */
    cursor?: MaintenanceCostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MaintenanceCosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MaintenanceCosts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of MaintenanceCosts.
     */
    distinct?: MaintenanceCostScalarFieldEnum | MaintenanceCostScalarFieldEnum[]
  }

  /**
   * MaintenanceCost findMany
   */
  export type MaintenanceCostFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * Filter, which MaintenanceCosts to fetch.
     */
    where?: MaintenanceCostWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of MaintenanceCosts to fetch.
     */
    orderBy?: MaintenanceCostOrderByWithRelationInput | MaintenanceCostOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing MaintenanceCosts.
     */
    cursor?: MaintenanceCostWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` MaintenanceCosts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` MaintenanceCosts.
     */
    skip?: number
    distinct?: MaintenanceCostScalarFieldEnum | MaintenanceCostScalarFieldEnum[]
  }

  /**
   * MaintenanceCost create
   */
  export type MaintenanceCostCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * The data needed to create a MaintenanceCost.
     */
    data: XOR<MaintenanceCostCreateInput, MaintenanceCostUncheckedCreateInput>
  }

  /**
   * MaintenanceCost createMany
   */
  export type MaintenanceCostCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many MaintenanceCosts.
     */
    data: MaintenanceCostCreateManyInput | MaintenanceCostCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * MaintenanceCost update
   */
  export type MaintenanceCostUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * The data needed to update a MaintenanceCost.
     */
    data: XOR<MaintenanceCostUpdateInput, MaintenanceCostUncheckedUpdateInput>
    /**
     * Choose, which MaintenanceCost to update.
     */
    where: MaintenanceCostWhereUniqueInput
  }

  /**
   * MaintenanceCost updateMany
   */
  export type MaintenanceCostUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update MaintenanceCosts.
     */
    data: XOR<MaintenanceCostUpdateManyMutationInput, MaintenanceCostUncheckedUpdateManyInput>
    /**
     * Filter which MaintenanceCosts to update
     */
    where?: MaintenanceCostWhereInput
  }

  /**
   * MaintenanceCost upsert
   */
  export type MaintenanceCostUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * The filter to search for the MaintenanceCost to update in case it exists.
     */
    where: MaintenanceCostWhereUniqueInput
    /**
     * In case the MaintenanceCost found by the `where` argument doesn't exist, create a new MaintenanceCost with this data.
     */
    create: XOR<MaintenanceCostCreateInput, MaintenanceCostUncheckedCreateInput>
    /**
     * In case the MaintenanceCost was found with the provided `where` argument, update it with this data.
     */
    update: XOR<MaintenanceCostUpdateInput, MaintenanceCostUncheckedUpdateInput>
  }

  /**
   * MaintenanceCost delete
   */
  export type MaintenanceCostDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
    /**
     * Filter which MaintenanceCost to delete.
     */
    where: MaintenanceCostWhereUniqueInput
  }

  /**
   * MaintenanceCost deleteMany
   */
  export type MaintenanceCostDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which MaintenanceCosts to delete
     */
    where?: MaintenanceCostWhereInput
  }

  /**
   * MaintenanceCost without action
   */
  export type MaintenanceCostDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the MaintenanceCost
     */
    select?: MaintenanceCostSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: MaintenanceCostInclude<ExtArgs> | null
  }


  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserMinAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    name: string | null
    role: string | null
    createdAt: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: string | null
    email: string | null
    passwordHash: string | null
    name: string | null
    role: string | null
    createdAt: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    email: number
    passwordHash: number
    name: number
    role: number
    createdAt: number
    _all: number
  }


  export type UserMinAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    createdAt?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    createdAt?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    email?: true
    passwordHash?: true
    name?: true
    role?: true
    createdAt?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: string
    email: string
    passwordHash: string
    name: string
    role: string
    createdAt: Date
    _count: UserCountAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
    comparisons?: boolean | User$comparisonsArgs<ExtArgs>
    favorites?: boolean | User$favoritesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>


  export type UserSelectScalar = {
    id?: boolean
    email?: boolean
    passwordHash?: boolean
    name?: boolean
    role?: boolean
    createdAt?: boolean
  }

  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comparisons?: boolean | User$comparisonsArgs<ExtArgs>
    favorites?: boolean | User$favoritesArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      comparisons: Prisma.$ComparisonPayload<ExtArgs>[]
      favorites: Prisma.$FavoritePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      email: string
      passwordHash: string
      name: string
      role: string
      createdAt: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    comparisons<T extends User$comparisonsArgs<ExtArgs> = {}>(args?: Subset<T, User$comparisonsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "findMany"> | Null>
    favorites<T extends User$favoritesArgs<ExtArgs> = {}>(args?: Subset<T, User$favoritesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */ 
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly passwordHash: FieldRef<"User", 'String'>
    readonly name: FieldRef<"User", 'String'>
    readonly role: FieldRef<"User", 'String'>
    readonly createdAt: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
  }

  /**
   * User.comparisons
   */
  export type User$comparisonsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    where?: ComparisonWhereInput
    orderBy?: ComparisonOrderByWithRelationInput | ComparisonOrderByWithRelationInput[]
    cursor?: ComparisonWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ComparisonScalarFieldEnum | ComparisonScalarFieldEnum[]
  }

  /**
   * User.favorites
   */
  export type User$favoritesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    where?: FavoriteWhereInput
    orderBy?: FavoriteOrderByWithRelationInput | FavoriteOrderByWithRelationInput[]
    cursor?: FavoriteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: FavoriteScalarFieldEnum | FavoriteScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Comparison
   */

  export type AggregateComparison = {
    _count: ComparisonCountAggregateOutputType | null
    _min: ComparisonMinAggregateOutputType | null
    _max: ComparisonMaxAggregateOutputType | null
  }

  export type ComparisonMinAggregateOutputType = {
    id: string | null
    userId: string | null
    slug: string | null
    name: string | null
    versionsHash: string | null
    createdAt: Date | null
  }

  export type ComparisonMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    slug: string | null
    name: string | null
    versionsHash: string | null
    createdAt: Date | null
  }

  export type ComparisonCountAggregateOutputType = {
    id: number
    userId: number
    slug: number
    name: number
    versionsHash: number
    createdAt: number
    _all: number
  }


  export type ComparisonMinAggregateInputType = {
    id?: true
    userId?: true
    slug?: true
    name?: true
    versionsHash?: true
    createdAt?: true
  }

  export type ComparisonMaxAggregateInputType = {
    id?: true
    userId?: true
    slug?: true
    name?: true
    versionsHash?: true
    createdAt?: true
  }

  export type ComparisonCountAggregateInputType = {
    id?: true
    userId?: true
    slug?: true
    name?: true
    versionsHash?: true
    createdAt?: true
    _all?: true
  }

  export type ComparisonAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Comparison to aggregate.
     */
    where?: ComparisonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comparisons to fetch.
     */
    orderBy?: ComparisonOrderByWithRelationInput | ComparisonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ComparisonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comparisons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comparisons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Comparisons
    **/
    _count?: true | ComparisonCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ComparisonMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ComparisonMaxAggregateInputType
  }

  export type GetComparisonAggregateType<T extends ComparisonAggregateArgs> = {
        [P in keyof T & keyof AggregateComparison]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateComparison[P]>
      : GetScalarType<T[P], AggregateComparison[P]>
  }




  export type ComparisonGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ComparisonWhereInput
    orderBy?: ComparisonOrderByWithAggregationInput | ComparisonOrderByWithAggregationInput[]
    by: ComparisonScalarFieldEnum[] | ComparisonScalarFieldEnum
    having?: ComparisonScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ComparisonCountAggregateInputType | true
    _min?: ComparisonMinAggregateInputType
    _max?: ComparisonMaxAggregateInputType
  }

  export type ComparisonGroupByOutputType = {
    id: string
    userId: string
    slug: string | null
    name: string | null
    versionsHash: string
    createdAt: Date
    _count: ComparisonCountAggregateOutputType | null
    _min: ComparisonMinAggregateOutputType | null
    _max: ComparisonMaxAggregateOutputType | null
  }

  type GetComparisonGroupByPayload<T extends ComparisonGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ComparisonGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ComparisonGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ComparisonGroupByOutputType[P]>
            : GetScalarType<T[P], ComparisonGroupByOutputType[P]>
        }
      >
    >


  export type ComparisonSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    slug?: boolean
    name?: boolean
    versionsHash?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    items?: boolean | Comparison$itemsArgs<ExtArgs>
    _count?: boolean | ComparisonCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["comparison"]>


  export type ComparisonSelectScalar = {
    id?: boolean
    userId?: boolean
    slug?: boolean
    name?: boolean
    versionsHash?: boolean
    createdAt?: boolean
  }

  export type ComparisonInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    items?: boolean | Comparison$itemsArgs<ExtArgs>
    _count?: boolean | ComparisonCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $ComparisonPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Comparison"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      items: Prisma.$ComparisonItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      slug: string | null
      name: string | null
      versionsHash: string
      createdAt: Date
    }, ExtArgs["result"]["comparison"]>
    composites: {}
  }

  type ComparisonGetPayload<S extends boolean | null | undefined | ComparisonDefaultArgs> = $Result.GetResult<Prisma.$ComparisonPayload, S>

  type ComparisonCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ComparisonFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ComparisonCountAggregateInputType | true
    }

  export interface ComparisonDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Comparison'], meta: { name: 'Comparison' } }
    /**
     * Find zero or one Comparison that matches the filter.
     * @param {ComparisonFindUniqueArgs} args - Arguments to find a Comparison
     * @example
     * // Get one Comparison
     * const comparison = await prisma.comparison.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ComparisonFindUniqueArgs>(args: SelectSubset<T, ComparisonFindUniqueArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Comparison that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ComparisonFindUniqueOrThrowArgs} args - Arguments to find a Comparison
     * @example
     * // Get one Comparison
     * const comparison = await prisma.comparison.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ComparisonFindUniqueOrThrowArgs>(args: SelectSubset<T, ComparisonFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Comparison that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonFindFirstArgs} args - Arguments to find a Comparison
     * @example
     * // Get one Comparison
     * const comparison = await prisma.comparison.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ComparisonFindFirstArgs>(args?: SelectSubset<T, ComparisonFindFirstArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Comparison that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonFindFirstOrThrowArgs} args - Arguments to find a Comparison
     * @example
     * // Get one Comparison
     * const comparison = await prisma.comparison.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ComparisonFindFirstOrThrowArgs>(args?: SelectSubset<T, ComparisonFindFirstOrThrowArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Comparisons that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Comparisons
     * const comparisons = await prisma.comparison.findMany()
     * 
     * // Get first 10 Comparisons
     * const comparisons = await prisma.comparison.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const comparisonWithIdOnly = await prisma.comparison.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ComparisonFindManyArgs>(args?: SelectSubset<T, ComparisonFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Comparison.
     * @param {ComparisonCreateArgs} args - Arguments to create a Comparison.
     * @example
     * // Create one Comparison
     * const Comparison = await prisma.comparison.create({
     *   data: {
     *     // ... data to create a Comparison
     *   }
     * })
     * 
     */
    create<T extends ComparisonCreateArgs>(args: SelectSubset<T, ComparisonCreateArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Comparisons.
     * @param {ComparisonCreateManyArgs} args - Arguments to create many Comparisons.
     * @example
     * // Create many Comparisons
     * const comparison = await prisma.comparison.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ComparisonCreateManyArgs>(args?: SelectSubset<T, ComparisonCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Comparison.
     * @param {ComparisonDeleteArgs} args - Arguments to delete one Comparison.
     * @example
     * // Delete one Comparison
     * const Comparison = await prisma.comparison.delete({
     *   where: {
     *     // ... filter to delete one Comparison
     *   }
     * })
     * 
     */
    delete<T extends ComparisonDeleteArgs>(args: SelectSubset<T, ComparisonDeleteArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Comparison.
     * @param {ComparisonUpdateArgs} args - Arguments to update one Comparison.
     * @example
     * // Update one Comparison
     * const comparison = await prisma.comparison.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ComparisonUpdateArgs>(args: SelectSubset<T, ComparisonUpdateArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Comparisons.
     * @param {ComparisonDeleteManyArgs} args - Arguments to filter Comparisons to delete.
     * @example
     * // Delete a few Comparisons
     * const { count } = await prisma.comparison.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ComparisonDeleteManyArgs>(args?: SelectSubset<T, ComparisonDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Comparisons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Comparisons
     * const comparison = await prisma.comparison.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ComparisonUpdateManyArgs>(args: SelectSubset<T, ComparisonUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Comparison.
     * @param {ComparisonUpsertArgs} args - Arguments to update or create a Comparison.
     * @example
     * // Update or create a Comparison
     * const comparison = await prisma.comparison.upsert({
     *   create: {
     *     // ... data to create a Comparison
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Comparison we want to update
     *   }
     * })
     */
    upsert<T extends ComparisonUpsertArgs>(args: SelectSubset<T, ComparisonUpsertArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Comparisons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonCountArgs} args - Arguments to filter Comparisons to count.
     * @example
     * // Count the number of Comparisons
     * const count = await prisma.comparison.count({
     *   where: {
     *     // ... the filter for the Comparisons we want to count
     *   }
     * })
    **/
    count<T extends ComparisonCountArgs>(
      args?: Subset<T, ComparisonCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ComparisonCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Comparison.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ComparisonAggregateArgs>(args: Subset<T, ComparisonAggregateArgs>): Prisma.PrismaPromise<GetComparisonAggregateType<T>>

    /**
     * Group by Comparison.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ComparisonGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ComparisonGroupByArgs['orderBy'] }
        : { orderBy?: ComparisonGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ComparisonGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetComparisonGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Comparison model
   */
  readonly fields: ComparisonFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Comparison.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ComparisonClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    items<T extends Comparison$itemsArgs<ExtArgs> = {}>(args?: Subset<T, Comparison$itemsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "findMany"> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Comparison model
   */ 
  interface ComparisonFieldRefs {
    readonly id: FieldRef<"Comparison", 'String'>
    readonly userId: FieldRef<"Comparison", 'String'>
    readonly slug: FieldRef<"Comparison", 'String'>
    readonly name: FieldRef<"Comparison", 'String'>
    readonly versionsHash: FieldRef<"Comparison", 'String'>
    readonly createdAt: FieldRef<"Comparison", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Comparison findUnique
   */
  export type ComparisonFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * Filter, which Comparison to fetch.
     */
    where: ComparisonWhereUniqueInput
  }

  /**
   * Comparison findUniqueOrThrow
   */
  export type ComparisonFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * Filter, which Comparison to fetch.
     */
    where: ComparisonWhereUniqueInput
  }

  /**
   * Comparison findFirst
   */
  export type ComparisonFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * Filter, which Comparison to fetch.
     */
    where?: ComparisonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comparisons to fetch.
     */
    orderBy?: ComparisonOrderByWithRelationInput | ComparisonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Comparisons.
     */
    cursor?: ComparisonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comparisons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comparisons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Comparisons.
     */
    distinct?: ComparisonScalarFieldEnum | ComparisonScalarFieldEnum[]
  }

  /**
   * Comparison findFirstOrThrow
   */
  export type ComparisonFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * Filter, which Comparison to fetch.
     */
    where?: ComparisonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comparisons to fetch.
     */
    orderBy?: ComparisonOrderByWithRelationInput | ComparisonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Comparisons.
     */
    cursor?: ComparisonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comparisons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comparisons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Comparisons.
     */
    distinct?: ComparisonScalarFieldEnum | ComparisonScalarFieldEnum[]
  }

  /**
   * Comparison findMany
   */
  export type ComparisonFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * Filter, which Comparisons to fetch.
     */
    where?: ComparisonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Comparisons to fetch.
     */
    orderBy?: ComparisonOrderByWithRelationInput | ComparisonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Comparisons.
     */
    cursor?: ComparisonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Comparisons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Comparisons.
     */
    skip?: number
    distinct?: ComparisonScalarFieldEnum | ComparisonScalarFieldEnum[]
  }

  /**
   * Comparison create
   */
  export type ComparisonCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * The data needed to create a Comparison.
     */
    data: XOR<ComparisonCreateInput, ComparisonUncheckedCreateInput>
  }

  /**
   * Comparison createMany
   */
  export type ComparisonCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Comparisons.
     */
    data: ComparisonCreateManyInput | ComparisonCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Comparison update
   */
  export type ComparisonUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * The data needed to update a Comparison.
     */
    data: XOR<ComparisonUpdateInput, ComparisonUncheckedUpdateInput>
    /**
     * Choose, which Comparison to update.
     */
    where: ComparisonWhereUniqueInput
  }

  /**
   * Comparison updateMany
   */
  export type ComparisonUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Comparisons.
     */
    data: XOR<ComparisonUpdateManyMutationInput, ComparisonUncheckedUpdateManyInput>
    /**
     * Filter which Comparisons to update
     */
    where?: ComparisonWhereInput
  }

  /**
   * Comparison upsert
   */
  export type ComparisonUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * The filter to search for the Comparison to update in case it exists.
     */
    where: ComparisonWhereUniqueInput
    /**
     * In case the Comparison found by the `where` argument doesn't exist, create a new Comparison with this data.
     */
    create: XOR<ComparisonCreateInput, ComparisonUncheckedCreateInput>
    /**
     * In case the Comparison was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ComparisonUpdateInput, ComparisonUncheckedUpdateInput>
  }

  /**
   * Comparison delete
   */
  export type ComparisonDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
    /**
     * Filter which Comparison to delete.
     */
    where: ComparisonWhereUniqueInput
  }

  /**
   * Comparison deleteMany
   */
  export type ComparisonDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Comparisons to delete
     */
    where?: ComparisonWhereInput
  }

  /**
   * Comparison.items
   */
  export type Comparison$itemsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    where?: ComparisonItemWhereInput
    orderBy?: ComparisonItemOrderByWithRelationInput | ComparisonItemOrderByWithRelationInput[]
    cursor?: ComparisonItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: ComparisonItemScalarFieldEnum | ComparisonItemScalarFieldEnum[]
  }

  /**
   * Comparison without action
   */
  export type ComparisonDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Comparison
     */
    select?: ComparisonSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonInclude<ExtArgs> | null
  }


  /**
   * Model ComparisonItem
   */

  export type AggregateComparisonItem = {
    _count: ComparisonItemCountAggregateOutputType | null
    _avg: ComparisonItemAvgAggregateOutputType | null
    _sum: ComparisonItemSumAggregateOutputType | null
    _min: ComparisonItemMinAggregateOutputType | null
    _max: ComparisonItemMaxAggregateOutputType | null
  }

  export type ComparisonItemAvgAggregateOutputType = {
    position: number | null
  }

  export type ComparisonItemSumAggregateOutputType = {
    position: number | null
  }

  export type ComparisonItemMinAggregateOutputType = {
    id: string | null
    comparisonId: string | null
    versionId: string | null
    position: number | null
  }

  export type ComparisonItemMaxAggregateOutputType = {
    id: string | null
    comparisonId: string | null
    versionId: string | null
    position: number | null
  }

  export type ComparisonItemCountAggregateOutputType = {
    id: number
    comparisonId: number
    versionId: number
    position: number
    _all: number
  }


  export type ComparisonItemAvgAggregateInputType = {
    position?: true
  }

  export type ComparisonItemSumAggregateInputType = {
    position?: true
  }

  export type ComparisonItemMinAggregateInputType = {
    id?: true
    comparisonId?: true
    versionId?: true
    position?: true
  }

  export type ComparisonItemMaxAggregateInputType = {
    id?: true
    comparisonId?: true
    versionId?: true
    position?: true
  }

  export type ComparisonItemCountAggregateInputType = {
    id?: true
    comparisonId?: true
    versionId?: true
    position?: true
    _all?: true
  }

  export type ComparisonItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ComparisonItem to aggregate.
     */
    where?: ComparisonItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ComparisonItems to fetch.
     */
    orderBy?: ComparisonItemOrderByWithRelationInput | ComparisonItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ComparisonItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ComparisonItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ComparisonItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ComparisonItems
    **/
    _count?: true | ComparisonItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ComparisonItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ComparisonItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ComparisonItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ComparisonItemMaxAggregateInputType
  }

  export type GetComparisonItemAggregateType<T extends ComparisonItemAggregateArgs> = {
        [P in keyof T & keyof AggregateComparisonItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateComparisonItem[P]>
      : GetScalarType<T[P], AggregateComparisonItem[P]>
  }




  export type ComparisonItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ComparisonItemWhereInput
    orderBy?: ComparisonItemOrderByWithAggregationInput | ComparisonItemOrderByWithAggregationInput[]
    by: ComparisonItemScalarFieldEnum[] | ComparisonItemScalarFieldEnum
    having?: ComparisonItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ComparisonItemCountAggregateInputType | true
    _avg?: ComparisonItemAvgAggregateInputType
    _sum?: ComparisonItemSumAggregateInputType
    _min?: ComparisonItemMinAggregateInputType
    _max?: ComparisonItemMaxAggregateInputType
  }

  export type ComparisonItemGroupByOutputType = {
    id: string
    comparisonId: string
    versionId: string
    position: number
    _count: ComparisonItemCountAggregateOutputType | null
    _avg: ComparisonItemAvgAggregateOutputType | null
    _sum: ComparisonItemSumAggregateOutputType | null
    _min: ComparisonItemMinAggregateOutputType | null
    _max: ComparisonItemMaxAggregateOutputType | null
  }

  type GetComparisonItemGroupByPayload<T extends ComparisonItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ComparisonItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ComparisonItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ComparisonItemGroupByOutputType[P]>
            : GetScalarType<T[P], ComparisonItemGroupByOutputType[P]>
        }
      >
    >


  export type ComparisonItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    comparisonId?: boolean
    versionId?: boolean
    position?: boolean
    comparison?: boolean | ComparisonDefaultArgs<ExtArgs>
    version?: boolean | VersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["comparisonItem"]>


  export type ComparisonItemSelectScalar = {
    id?: boolean
    comparisonId?: boolean
    versionId?: boolean
    position?: boolean
  }

  export type ComparisonItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    comparison?: boolean | ComparisonDefaultArgs<ExtArgs>
    version?: boolean | VersionDefaultArgs<ExtArgs>
  }

  export type $ComparisonItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ComparisonItem"
    objects: {
      comparison: Prisma.$ComparisonPayload<ExtArgs>
      version: Prisma.$VersionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      comparisonId: string
      versionId: string
      position: number
    }, ExtArgs["result"]["comparisonItem"]>
    composites: {}
  }

  type ComparisonItemGetPayload<S extends boolean | null | undefined | ComparisonItemDefaultArgs> = $Result.GetResult<Prisma.$ComparisonItemPayload, S>

  type ComparisonItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<ComparisonItemFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: ComparisonItemCountAggregateInputType | true
    }

  export interface ComparisonItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ComparisonItem'], meta: { name: 'ComparisonItem' } }
    /**
     * Find zero or one ComparisonItem that matches the filter.
     * @param {ComparisonItemFindUniqueArgs} args - Arguments to find a ComparisonItem
     * @example
     * // Get one ComparisonItem
     * const comparisonItem = await prisma.comparisonItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ComparisonItemFindUniqueArgs>(args: SelectSubset<T, ComparisonItemFindUniqueArgs<ExtArgs>>): Prisma__ComparisonItemClient<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one ComparisonItem that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {ComparisonItemFindUniqueOrThrowArgs} args - Arguments to find a ComparisonItem
     * @example
     * // Get one ComparisonItem
     * const comparisonItem = await prisma.comparisonItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ComparisonItemFindUniqueOrThrowArgs>(args: SelectSubset<T, ComparisonItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ComparisonItemClient<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first ComparisonItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonItemFindFirstArgs} args - Arguments to find a ComparisonItem
     * @example
     * // Get one ComparisonItem
     * const comparisonItem = await prisma.comparisonItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ComparisonItemFindFirstArgs>(args?: SelectSubset<T, ComparisonItemFindFirstArgs<ExtArgs>>): Prisma__ComparisonItemClient<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first ComparisonItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonItemFindFirstOrThrowArgs} args - Arguments to find a ComparisonItem
     * @example
     * // Get one ComparisonItem
     * const comparisonItem = await prisma.comparisonItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ComparisonItemFindFirstOrThrowArgs>(args?: SelectSubset<T, ComparisonItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__ComparisonItemClient<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more ComparisonItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ComparisonItems
     * const comparisonItems = await prisma.comparisonItem.findMany()
     * 
     * // Get first 10 ComparisonItems
     * const comparisonItems = await prisma.comparisonItem.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const comparisonItemWithIdOnly = await prisma.comparisonItem.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ComparisonItemFindManyArgs>(args?: SelectSubset<T, ComparisonItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "findMany">>

    /**
     * Create a ComparisonItem.
     * @param {ComparisonItemCreateArgs} args - Arguments to create a ComparisonItem.
     * @example
     * // Create one ComparisonItem
     * const ComparisonItem = await prisma.comparisonItem.create({
     *   data: {
     *     // ... data to create a ComparisonItem
     *   }
     * })
     * 
     */
    create<T extends ComparisonItemCreateArgs>(args: SelectSubset<T, ComparisonItemCreateArgs<ExtArgs>>): Prisma__ComparisonItemClient<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many ComparisonItems.
     * @param {ComparisonItemCreateManyArgs} args - Arguments to create many ComparisonItems.
     * @example
     * // Create many ComparisonItems
     * const comparisonItem = await prisma.comparisonItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ComparisonItemCreateManyArgs>(args?: SelectSubset<T, ComparisonItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a ComparisonItem.
     * @param {ComparisonItemDeleteArgs} args - Arguments to delete one ComparisonItem.
     * @example
     * // Delete one ComparisonItem
     * const ComparisonItem = await prisma.comparisonItem.delete({
     *   where: {
     *     // ... filter to delete one ComparisonItem
     *   }
     * })
     * 
     */
    delete<T extends ComparisonItemDeleteArgs>(args: SelectSubset<T, ComparisonItemDeleteArgs<ExtArgs>>): Prisma__ComparisonItemClient<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one ComparisonItem.
     * @param {ComparisonItemUpdateArgs} args - Arguments to update one ComparisonItem.
     * @example
     * // Update one ComparisonItem
     * const comparisonItem = await prisma.comparisonItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ComparisonItemUpdateArgs>(args: SelectSubset<T, ComparisonItemUpdateArgs<ExtArgs>>): Prisma__ComparisonItemClient<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more ComparisonItems.
     * @param {ComparisonItemDeleteManyArgs} args - Arguments to filter ComparisonItems to delete.
     * @example
     * // Delete a few ComparisonItems
     * const { count } = await prisma.comparisonItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ComparisonItemDeleteManyArgs>(args?: SelectSubset<T, ComparisonItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ComparisonItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ComparisonItems
     * const comparisonItem = await prisma.comparisonItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ComparisonItemUpdateManyArgs>(args: SelectSubset<T, ComparisonItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one ComparisonItem.
     * @param {ComparisonItemUpsertArgs} args - Arguments to update or create a ComparisonItem.
     * @example
     * // Update or create a ComparisonItem
     * const comparisonItem = await prisma.comparisonItem.upsert({
     *   create: {
     *     // ... data to create a ComparisonItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ComparisonItem we want to update
     *   }
     * })
     */
    upsert<T extends ComparisonItemUpsertArgs>(args: SelectSubset<T, ComparisonItemUpsertArgs<ExtArgs>>): Prisma__ComparisonItemClient<$Result.GetResult<Prisma.$ComparisonItemPayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of ComparisonItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonItemCountArgs} args - Arguments to filter ComparisonItems to count.
     * @example
     * // Count the number of ComparisonItems
     * const count = await prisma.comparisonItem.count({
     *   where: {
     *     // ... the filter for the ComparisonItems we want to count
     *   }
     * })
    **/
    count<T extends ComparisonItemCountArgs>(
      args?: Subset<T, ComparisonItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ComparisonItemCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ComparisonItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ComparisonItemAggregateArgs>(args: Subset<T, ComparisonItemAggregateArgs>): Prisma.PrismaPromise<GetComparisonItemAggregateType<T>>

    /**
     * Group by ComparisonItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ComparisonItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ComparisonItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ComparisonItemGroupByArgs['orderBy'] }
        : { orderBy?: ComparisonItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ComparisonItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetComparisonItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ComparisonItem model
   */
  readonly fields: ComparisonItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ComparisonItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ComparisonItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    comparison<T extends ComparisonDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ComparisonDefaultArgs<ExtArgs>>): Prisma__ComparisonClient<$Result.GetResult<Prisma.$ComparisonPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    version<T extends VersionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VersionDefaultArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ComparisonItem model
   */ 
  interface ComparisonItemFieldRefs {
    readonly id: FieldRef<"ComparisonItem", 'String'>
    readonly comparisonId: FieldRef<"ComparisonItem", 'String'>
    readonly versionId: FieldRef<"ComparisonItem", 'String'>
    readonly position: FieldRef<"ComparisonItem", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * ComparisonItem findUnique
   */
  export type ComparisonItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * Filter, which ComparisonItem to fetch.
     */
    where: ComparisonItemWhereUniqueInput
  }

  /**
   * ComparisonItem findUniqueOrThrow
   */
  export type ComparisonItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * Filter, which ComparisonItem to fetch.
     */
    where: ComparisonItemWhereUniqueInput
  }

  /**
   * ComparisonItem findFirst
   */
  export type ComparisonItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * Filter, which ComparisonItem to fetch.
     */
    where?: ComparisonItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ComparisonItems to fetch.
     */
    orderBy?: ComparisonItemOrderByWithRelationInput | ComparisonItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ComparisonItems.
     */
    cursor?: ComparisonItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ComparisonItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ComparisonItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ComparisonItems.
     */
    distinct?: ComparisonItemScalarFieldEnum | ComparisonItemScalarFieldEnum[]
  }

  /**
   * ComparisonItem findFirstOrThrow
   */
  export type ComparisonItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * Filter, which ComparisonItem to fetch.
     */
    where?: ComparisonItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ComparisonItems to fetch.
     */
    orderBy?: ComparisonItemOrderByWithRelationInput | ComparisonItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ComparisonItems.
     */
    cursor?: ComparisonItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ComparisonItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ComparisonItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ComparisonItems.
     */
    distinct?: ComparisonItemScalarFieldEnum | ComparisonItemScalarFieldEnum[]
  }

  /**
   * ComparisonItem findMany
   */
  export type ComparisonItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * Filter, which ComparisonItems to fetch.
     */
    where?: ComparisonItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ComparisonItems to fetch.
     */
    orderBy?: ComparisonItemOrderByWithRelationInput | ComparisonItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ComparisonItems.
     */
    cursor?: ComparisonItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ComparisonItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ComparisonItems.
     */
    skip?: number
    distinct?: ComparisonItemScalarFieldEnum | ComparisonItemScalarFieldEnum[]
  }

  /**
   * ComparisonItem create
   */
  export type ComparisonItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * The data needed to create a ComparisonItem.
     */
    data: XOR<ComparisonItemCreateInput, ComparisonItemUncheckedCreateInput>
  }

  /**
   * ComparisonItem createMany
   */
  export type ComparisonItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ComparisonItems.
     */
    data: ComparisonItemCreateManyInput | ComparisonItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ComparisonItem update
   */
  export type ComparisonItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * The data needed to update a ComparisonItem.
     */
    data: XOR<ComparisonItemUpdateInput, ComparisonItemUncheckedUpdateInput>
    /**
     * Choose, which ComparisonItem to update.
     */
    where: ComparisonItemWhereUniqueInput
  }

  /**
   * ComparisonItem updateMany
   */
  export type ComparisonItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ComparisonItems.
     */
    data: XOR<ComparisonItemUpdateManyMutationInput, ComparisonItemUncheckedUpdateManyInput>
    /**
     * Filter which ComparisonItems to update
     */
    where?: ComparisonItemWhereInput
  }

  /**
   * ComparisonItem upsert
   */
  export type ComparisonItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * The filter to search for the ComparisonItem to update in case it exists.
     */
    where: ComparisonItemWhereUniqueInput
    /**
     * In case the ComparisonItem found by the `where` argument doesn't exist, create a new ComparisonItem with this data.
     */
    create: XOR<ComparisonItemCreateInput, ComparisonItemUncheckedCreateInput>
    /**
     * In case the ComparisonItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ComparisonItemUpdateInput, ComparisonItemUncheckedUpdateInput>
  }

  /**
   * ComparisonItem delete
   */
  export type ComparisonItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
    /**
     * Filter which ComparisonItem to delete.
     */
    where: ComparisonItemWhereUniqueInput
  }

  /**
   * ComparisonItem deleteMany
   */
  export type ComparisonItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ComparisonItems to delete
     */
    where?: ComparisonItemWhereInput
  }

  /**
   * ComparisonItem without action
   */
  export type ComparisonItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ComparisonItem
     */
    select?: ComparisonItemSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ComparisonItemInclude<ExtArgs> | null
  }


  /**
   * Model Favorite
   */

  export type AggregateFavorite = {
    _count: FavoriteCountAggregateOutputType | null
    _min: FavoriteMinAggregateOutputType | null
    _max: FavoriteMaxAggregateOutputType | null
  }

  export type FavoriteMinAggregateOutputType = {
    id: string | null
    userId: string | null
    modelId: string | null
    versionId: string | null
    createdAt: Date | null
  }

  export type FavoriteMaxAggregateOutputType = {
    id: string | null
    userId: string | null
    modelId: string | null
    versionId: string | null
    createdAt: Date | null
  }

  export type FavoriteCountAggregateOutputType = {
    id: number
    userId: number
    modelId: number
    versionId: number
    createdAt: number
    _all: number
  }


  export type FavoriteMinAggregateInputType = {
    id?: true
    userId?: true
    modelId?: true
    versionId?: true
    createdAt?: true
  }

  export type FavoriteMaxAggregateInputType = {
    id?: true
    userId?: true
    modelId?: true
    versionId?: true
    createdAt?: true
  }

  export type FavoriteCountAggregateInputType = {
    id?: true
    userId?: true
    modelId?: true
    versionId?: true
    createdAt?: true
    _all?: true
  }

  export type FavoriteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Favorite to aggregate.
     */
    where?: FavoriteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Favorites to fetch.
     */
    orderBy?: FavoriteOrderByWithRelationInput | FavoriteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FavoriteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Favorites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Favorites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Favorites
    **/
    _count?: true | FavoriteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FavoriteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FavoriteMaxAggregateInputType
  }

  export type GetFavoriteAggregateType<T extends FavoriteAggregateArgs> = {
        [P in keyof T & keyof AggregateFavorite]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFavorite[P]>
      : GetScalarType<T[P], AggregateFavorite[P]>
  }




  export type FavoriteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FavoriteWhereInput
    orderBy?: FavoriteOrderByWithAggregationInput | FavoriteOrderByWithAggregationInput[]
    by: FavoriteScalarFieldEnum[] | FavoriteScalarFieldEnum
    having?: FavoriteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FavoriteCountAggregateInputType | true
    _min?: FavoriteMinAggregateInputType
    _max?: FavoriteMaxAggregateInputType
  }

  export type FavoriteGroupByOutputType = {
    id: string
    userId: string
    modelId: string
    versionId: string
    createdAt: Date
    _count: FavoriteCountAggregateOutputType | null
    _min: FavoriteMinAggregateOutputType | null
    _max: FavoriteMaxAggregateOutputType | null
  }

  type GetFavoriteGroupByPayload<T extends FavoriteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FavoriteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FavoriteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FavoriteGroupByOutputType[P]>
            : GetScalarType<T[P], FavoriteGroupByOutputType[P]>
        }
      >
    >


  export type FavoriteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    userId?: boolean
    modelId?: boolean
    versionId?: boolean
    createdAt?: boolean
    user?: boolean | UserDefaultArgs<ExtArgs>
    model?: boolean | ModelDefaultArgs<ExtArgs>
    version?: boolean | VersionDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["favorite"]>


  export type FavoriteSelectScalar = {
    id?: boolean
    userId?: boolean
    modelId?: boolean
    versionId?: boolean
    createdAt?: boolean
  }

  export type FavoriteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    user?: boolean | UserDefaultArgs<ExtArgs>
    model?: boolean | ModelDefaultArgs<ExtArgs>
    version?: boolean | VersionDefaultArgs<ExtArgs>
  }

  export type $FavoritePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Favorite"
    objects: {
      user: Prisma.$UserPayload<ExtArgs>
      model: Prisma.$ModelPayload<ExtArgs>
      version: Prisma.$VersionPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      userId: string
      modelId: string
      versionId: string
      createdAt: Date
    }, ExtArgs["result"]["favorite"]>
    composites: {}
  }

  type FavoriteGetPayload<S extends boolean | null | undefined | FavoriteDefaultArgs> = $Result.GetResult<Prisma.$FavoritePayload, S>

  type FavoriteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = 
    Omit<FavoriteFindManyArgs, 'select' | 'include' | 'distinct'> & {
      select?: FavoriteCountAggregateInputType | true
    }

  export interface FavoriteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Favorite'], meta: { name: 'Favorite' } }
    /**
     * Find zero or one Favorite that matches the filter.
     * @param {FavoriteFindUniqueArgs} args - Arguments to find a Favorite
     * @example
     * // Get one Favorite
     * const favorite = await prisma.favorite.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FavoriteFindUniqueArgs>(args: SelectSubset<T, FavoriteFindUniqueArgs<ExtArgs>>): Prisma__FavoriteClient<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findUnique"> | null, null, ExtArgs>

    /**
     * Find one Favorite that matches the filter or throw an error with `error.code='P2025'` 
     * if no matches were found.
     * @param {FavoriteFindUniqueOrThrowArgs} args - Arguments to find a Favorite
     * @example
     * // Get one Favorite
     * const favorite = await prisma.favorite.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FavoriteFindUniqueOrThrowArgs>(args: SelectSubset<T, FavoriteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FavoriteClient<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findUniqueOrThrow">, never, ExtArgs>

    /**
     * Find the first Favorite that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FavoriteFindFirstArgs} args - Arguments to find a Favorite
     * @example
     * // Get one Favorite
     * const favorite = await prisma.favorite.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FavoriteFindFirstArgs>(args?: SelectSubset<T, FavoriteFindFirstArgs<ExtArgs>>): Prisma__FavoriteClient<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findFirst"> | null, null, ExtArgs>

    /**
     * Find the first Favorite that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FavoriteFindFirstOrThrowArgs} args - Arguments to find a Favorite
     * @example
     * // Get one Favorite
     * const favorite = await prisma.favorite.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FavoriteFindFirstOrThrowArgs>(args?: SelectSubset<T, FavoriteFindFirstOrThrowArgs<ExtArgs>>): Prisma__FavoriteClient<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findFirstOrThrow">, never, ExtArgs>

    /**
     * Find zero or more Favorites that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FavoriteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Favorites
     * const favorites = await prisma.favorite.findMany()
     * 
     * // Get first 10 Favorites
     * const favorites = await prisma.favorite.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const favoriteWithIdOnly = await prisma.favorite.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FavoriteFindManyArgs>(args?: SelectSubset<T, FavoriteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "findMany">>

    /**
     * Create a Favorite.
     * @param {FavoriteCreateArgs} args - Arguments to create a Favorite.
     * @example
     * // Create one Favorite
     * const Favorite = await prisma.favorite.create({
     *   data: {
     *     // ... data to create a Favorite
     *   }
     * })
     * 
     */
    create<T extends FavoriteCreateArgs>(args: SelectSubset<T, FavoriteCreateArgs<ExtArgs>>): Prisma__FavoriteClient<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "create">, never, ExtArgs>

    /**
     * Create many Favorites.
     * @param {FavoriteCreateManyArgs} args - Arguments to create many Favorites.
     * @example
     * // Create many Favorites
     * const favorite = await prisma.favorite.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FavoriteCreateManyArgs>(args?: SelectSubset<T, FavoriteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Delete a Favorite.
     * @param {FavoriteDeleteArgs} args - Arguments to delete one Favorite.
     * @example
     * // Delete one Favorite
     * const Favorite = await prisma.favorite.delete({
     *   where: {
     *     // ... filter to delete one Favorite
     *   }
     * })
     * 
     */
    delete<T extends FavoriteDeleteArgs>(args: SelectSubset<T, FavoriteDeleteArgs<ExtArgs>>): Prisma__FavoriteClient<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "delete">, never, ExtArgs>

    /**
     * Update one Favorite.
     * @param {FavoriteUpdateArgs} args - Arguments to update one Favorite.
     * @example
     * // Update one Favorite
     * const favorite = await prisma.favorite.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FavoriteUpdateArgs>(args: SelectSubset<T, FavoriteUpdateArgs<ExtArgs>>): Prisma__FavoriteClient<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "update">, never, ExtArgs>

    /**
     * Delete zero or more Favorites.
     * @param {FavoriteDeleteManyArgs} args - Arguments to filter Favorites to delete.
     * @example
     * // Delete a few Favorites
     * const { count } = await prisma.favorite.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FavoriteDeleteManyArgs>(args?: SelectSubset<T, FavoriteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Favorites.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FavoriteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Favorites
     * const favorite = await prisma.favorite.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FavoriteUpdateManyArgs>(args: SelectSubset<T, FavoriteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create or update one Favorite.
     * @param {FavoriteUpsertArgs} args - Arguments to update or create a Favorite.
     * @example
     * // Update or create a Favorite
     * const favorite = await prisma.favorite.upsert({
     *   create: {
     *     // ... data to create a Favorite
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Favorite we want to update
     *   }
     * })
     */
    upsert<T extends FavoriteUpsertArgs>(args: SelectSubset<T, FavoriteUpsertArgs<ExtArgs>>): Prisma__FavoriteClient<$Result.GetResult<Prisma.$FavoritePayload<ExtArgs>, T, "upsert">, never, ExtArgs>


    /**
     * Count the number of Favorites.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FavoriteCountArgs} args - Arguments to filter Favorites to count.
     * @example
     * // Count the number of Favorites
     * const count = await prisma.favorite.count({
     *   where: {
     *     // ... the filter for the Favorites we want to count
     *   }
     * })
    **/
    count<T extends FavoriteCountArgs>(
      args?: Subset<T, FavoriteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FavoriteCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Favorite.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FavoriteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FavoriteAggregateArgs>(args: Subset<T, FavoriteAggregateArgs>): Prisma.PrismaPromise<GetFavoriteAggregateType<T>>

    /**
     * Group by Favorite.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FavoriteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FavoriteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FavoriteGroupByArgs['orderBy'] }
        : { orderBy?: FavoriteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FavoriteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFavoriteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Favorite model
   */
  readonly fields: FavoriteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Favorite.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FavoriteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    user<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    model<T extends ModelDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ModelDefaultArgs<ExtArgs>>): Prisma__ModelClient<$Result.GetResult<Prisma.$ModelPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    version<T extends VersionDefaultArgs<ExtArgs> = {}>(args?: Subset<T, VersionDefaultArgs<ExtArgs>>): Prisma__VersionClient<$Result.GetResult<Prisma.$VersionPayload<ExtArgs>, T, "findUniqueOrThrow"> | Null, Null, ExtArgs>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Favorite model
   */ 
  interface FavoriteFieldRefs {
    readonly id: FieldRef<"Favorite", 'String'>
    readonly userId: FieldRef<"Favorite", 'String'>
    readonly modelId: FieldRef<"Favorite", 'String'>
    readonly versionId: FieldRef<"Favorite", 'String'>
    readonly createdAt: FieldRef<"Favorite", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Favorite findUnique
   */
  export type FavoriteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * Filter, which Favorite to fetch.
     */
    where: FavoriteWhereUniqueInput
  }

  /**
   * Favorite findUniqueOrThrow
   */
  export type FavoriteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * Filter, which Favorite to fetch.
     */
    where: FavoriteWhereUniqueInput
  }

  /**
   * Favorite findFirst
   */
  export type FavoriteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * Filter, which Favorite to fetch.
     */
    where?: FavoriteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Favorites to fetch.
     */
    orderBy?: FavoriteOrderByWithRelationInput | FavoriteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Favorites.
     */
    cursor?: FavoriteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Favorites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Favorites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Favorites.
     */
    distinct?: FavoriteScalarFieldEnum | FavoriteScalarFieldEnum[]
  }

  /**
   * Favorite findFirstOrThrow
   */
  export type FavoriteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * Filter, which Favorite to fetch.
     */
    where?: FavoriteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Favorites to fetch.
     */
    orderBy?: FavoriteOrderByWithRelationInput | FavoriteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Favorites.
     */
    cursor?: FavoriteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Favorites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Favorites.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Favorites.
     */
    distinct?: FavoriteScalarFieldEnum | FavoriteScalarFieldEnum[]
  }

  /**
   * Favorite findMany
   */
  export type FavoriteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * Filter, which Favorites to fetch.
     */
    where?: FavoriteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Favorites to fetch.
     */
    orderBy?: FavoriteOrderByWithRelationInput | FavoriteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Favorites.
     */
    cursor?: FavoriteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Favorites from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Favorites.
     */
    skip?: number
    distinct?: FavoriteScalarFieldEnum | FavoriteScalarFieldEnum[]
  }

  /**
   * Favorite create
   */
  export type FavoriteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * The data needed to create a Favorite.
     */
    data: XOR<FavoriteCreateInput, FavoriteUncheckedCreateInput>
  }

  /**
   * Favorite createMany
   */
  export type FavoriteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Favorites.
     */
    data: FavoriteCreateManyInput | FavoriteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Favorite update
   */
  export type FavoriteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * The data needed to update a Favorite.
     */
    data: XOR<FavoriteUpdateInput, FavoriteUncheckedUpdateInput>
    /**
     * Choose, which Favorite to update.
     */
    where: FavoriteWhereUniqueInput
  }

  /**
   * Favorite updateMany
   */
  export type FavoriteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Favorites.
     */
    data: XOR<FavoriteUpdateManyMutationInput, FavoriteUncheckedUpdateManyInput>
    /**
     * Filter which Favorites to update
     */
    where?: FavoriteWhereInput
  }

  /**
   * Favorite upsert
   */
  export type FavoriteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * The filter to search for the Favorite to update in case it exists.
     */
    where: FavoriteWhereUniqueInput
    /**
     * In case the Favorite found by the `where` argument doesn't exist, create a new Favorite with this data.
     */
    create: XOR<FavoriteCreateInput, FavoriteUncheckedCreateInput>
    /**
     * In case the Favorite was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FavoriteUpdateInput, FavoriteUncheckedUpdateInput>
  }

  /**
   * Favorite delete
   */
  export type FavoriteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
    /**
     * Filter which Favorite to delete.
     */
    where: FavoriteWhereUniqueInput
  }

  /**
   * Favorite deleteMany
   */
  export type FavoriteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Favorites to delete
     */
    where?: FavoriteWhereInput
  }

  /**
   * Favorite without action
   */
  export type FavoriteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Favorite
     */
    select?: FavoriteSelect<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FavoriteInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const BrandScalarFieldEnum: {
    id: 'id',
    name: 'name',
    logoUrl: 'logoUrl',
    deletedAt: 'deletedAt',
    createdAt: 'createdAt'
  };

  export type BrandScalarFieldEnum = (typeof BrandScalarFieldEnum)[keyof typeof BrandScalarFieldEnum]


  export const ModelScalarFieldEnum: {
    id: 'id',
    brandId: 'brandId',
    name: 'name',
    segment: 'segment',
    imageUrl: 'imageUrl',
    galleryUrls: 'galleryUrls',
    deletedAt: 'deletedAt',
    createdAt: 'createdAt'
  };

  export type ModelScalarFieldEnum = (typeof ModelScalarFieldEnum)[keyof typeof ModelScalarFieldEnum]


  export const VersionScalarFieldEnum: {
    id: 'id',
    modelId: 'modelId',
    name: 'name',
    year: 'year',
    priceClp: 'priceClp',
    transmission: 'transmission',
    fuel: 'fuel',
    engineDisplacementCc: 'engineDisplacementCc',
    powerHp: 'powerHp',
    torqueNm: 'torqueNm',
    consumptionCityKmL: 'consumptionCityKmL',
    consumptionHighwayKmL: 'consumptionHighwayKmL',
    lengthMm: 'lengthMm',
    widthMm: 'widthMm',
    heightMm: 'heightMm',
    weightKg: 'weightKg',
    trunkLiters: 'trunkLiters',
    airbagCount: 'airbagCount',
    hasAbs: 'hasAbs',
    hasEsp: 'hasEsp',
    hasCruiseControl: 'hasCruiseControl',
    deletedAt: 'deletedAt',
    createdAt: 'createdAt'
  };

  export type VersionScalarFieldEnum = (typeof VersionScalarFieldEnum)[keyof typeof VersionScalarFieldEnum]


  export const EquipmentItemScalarFieldEnum: {
    id: 'id',
    name: 'name',
    category: 'category',
    deletedAt: 'deletedAt'
  };

  export type EquipmentItemScalarFieldEnum = (typeof EquipmentItemScalarFieldEnum)[keyof typeof EquipmentItemScalarFieldEnum]


  export const VersionEquipmentScalarFieldEnum: {
    versionId: 'versionId',
    equipmentItemId: 'equipmentItemId'
  };

  export type VersionEquipmentScalarFieldEnum = (typeof VersionEquipmentScalarFieldEnum)[keyof typeof VersionEquipmentScalarFieldEnum]


  export const MaintenanceCostScalarFieldEnum: {
    id: 'id',
    versionId: 'versionId',
    mileageTag: 'mileageTag',
    costClp: 'costClp',
    deletedAt: 'deletedAt'
  };

  export type MaintenanceCostScalarFieldEnum = (typeof MaintenanceCostScalarFieldEnum)[keyof typeof MaintenanceCostScalarFieldEnum]


  export const UserScalarFieldEnum: {
    id: 'id',
    email: 'email',
    passwordHash: 'passwordHash',
    name: 'name',
    role: 'role',
    createdAt: 'createdAt'
  };

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const ComparisonScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    slug: 'slug',
    name: 'name',
    versionsHash: 'versionsHash',
    createdAt: 'createdAt'
  };

  export type ComparisonScalarFieldEnum = (typeof ComparisonScalarFieldEnum)[keyof typeof ComparisonScalarFieldEnum]


  export const ComparisonItemScalarFieldEnum: {
    id: 'id',
    comparisonId: 'comparisonId',
    versionId: 'versionId',
    position: 'position'
  };

  export type ComparisonItemScalarFieldEnum = (typeof ComparisonItemScalarFieldEnum)[keyof typeof ComparisonItemScalarFieldEnum]


  export const FavoriteScalarFieldEnum: {
    id: 'id',
    userId: 'userId',
    modelId: 'modelId',
    versionId: 'versionId',
    createdAt: 'createdAt'
  };

  export type FavoriteScalarFieldEnum = (typeof FavoriteScalarFieldEnum)[keyof typeof FavoriteScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references 
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    
  /**
   * Deep Input Types
   */


  export type BrandWhereInput = {
    AND?: BrandWhereInput | BrandWhereInput[]
    OR?: BrandWhereInput[]
    NOT?: BrandWhereInput | BrandWhereInput[]
    id?: StringFilter<"Brand"> | string
    name?: StringFilter<"Brand"> | string
    logoUrl?: StringNullableFilter<"Brand"> | string | null
    deletedAt?: DateTimeNullableFilter<"Brand"> | Date | string | null
    createdAt?: DateTimeFilter<"Brand"> | Date | string
    models?: ModelListRelationFilter
  }

  export type BrandOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    logoUrl?: SortOrderInput | SortOrder
    deletedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    models?: ModelOrderByRelationAggregateInput
  }

  export type BrandWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: BrandWhereInput | BrandWhereInput[]
    OR?: BrandWhereInput[]
    NOT?: BrandWhereInput | BrandWhereInput[]
    logoUrl?: StringNullableFilter<"Brand"> | string | null
    deletedAt?: DateTimeNullableFilter<"Brand"> | Date | string | null
    createdAt?: DateTimeFilter<"Brand"> | Date | string
    models?: ModelListRelationFilter
  }, "id" | "name">

  export type BrandOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    logoUrl?: SortOrderInput | SortOrder
    deletedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: BrandCountOrderByAggregateInput
    _max?: BrandMaxOrderByAggregateInput
    _min?: BrandMinOrderByAggregateInput
  }

  export type BrandScalarWhereWithAggregatesInput = {
    AND?: BrandScalarWhereWithAggregatesInput | BrandScalarWhereWithAggregatesInput[]
    OR?: BrandScalarWhereWithAggregatesInput[]
    NOT?: BrandScalarWhereWithAggregatesInput | BrandScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Brand"> | string
    name?: StringWithAggregatesFilter<"Brand"> | string
    logoUrl?: StringNullableWithAggregatesFilter<"Brand"> | string | null
    deletedAt?: DateTimeNullableWithAggregatesFilter<"Brand"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Brand"> | Date | string
  }

  export type ModelWhereInput = {
    AND?: ModelWhereInput | ModelWhereInput[]
    OR?: ModelWhereInput[]
    NOT?: ModelWhereInput | ModelWhereInput[]
    id?: StringFilter<"Model"> | string
    brandId?: StringFilter<"Model"> | string
    name?: StringFilter<"Model"> | string
    segment?: StringFilter<"Model"> | string
    imageUrl?: StringNullableFilter<"Model"> | string | null
    galleryUrls?: JsonFilter<"Model">
    deletedAt?: DateTimeNullableFilter<"Model"> | Date | string | null
    createdAt?: DateTimeFilter<"Model"> | Date | string
    brand?: XOR<BrandRelationFilter, BrandWhereInput>
    versions?: VersionListRelationFilter
    favorites?: FavoriteListRelationFilter
  }

  export type ModelOrderByWithRelationInput = {
    id?: SortOrder
    brandId?: SortOrder
    name?: SortOrder
    segment?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    galleryUrls?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    brand?: BrandOrderByWithRelationInput
    versions?: VersionOrderByRelationAggregateInput
    favorites?: FavoriteOrderByRelationAggregateInput
  }

  export type ModelWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    brandId_name?: ModelBrandIdNameCompoundUniqueInput
    AND?: ModelWhereInput | ModelWhereInput[]
    OR?: ModelWhereInput[]
    NOT?: ModelWhereInput | ModelWhereInput[]
    brandId?: StringFilter<"Model"> | string
    name?: StringFilter<"Model"> | string
    segment?: StringFilter<"Model"> | string
    imageUrl?: StringNullableFilter<"Model"> | string | null
    galleryUrls?: JsonFilter<"Model">
    deletedAt?: DateTimeNullableFilter<"Model"> | Date | string | null
    createdAt?: DateTimeFilter<"Model"> | Date | string
    brand?: XOR<BrandRelationFilter, BrandWhereInput>
    versions?: VersionListRelationFilter
    favorites?: FavoriteListRelationFilter
  }, "id" | "brandId_name">

  export type ModelOrderByWithAggregationInput = {
    id?: SortOrder
    brandId?: SortOrder
    name?: SortOrder
    segment?: SortOrder
    imageUrl?: SortOrderInput | SortOrder
    galleryUrls?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: ModelCountOrderByAggregateInput
    _max?: ModelMaxOrderByAggregateInput
    _min?: ModelMinOrderByAggregateInput
  }

  export type ModelScalarWhereWithAggregatesInput = {
    AND?: ModelScalarWhereWithAggregatesInput | ModelScalarWhereWithAggregatesInput[]
    OR?: ModelScalarWhereWithAggregatesInput[]
    NOT?: ModelScalarWhereWithAggregatesInput | ModelScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Model"> | string
    brandId?: StringWithAggregatesFilter<"Model"> | string
    name?: StringWithAggregatesFilter<"Model"> | string
    segment?: StringWithAggregatesFilter<"Model"> | string
    imageUrl?: StringNullableWithAggregatesFilter<"Model"> | string | null
    galleryUrls?: JsonWithAggregatesFilter<"Model">
    deletedAt?: DateTimeNullableWithAggregatesFilter<"Model"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Model"> | Date | string
  }

  export type VersionWhereInput = {
    AND?: VersionWhereInput | VersionWhereInput[]
    OR?: VersionWhereInput[]
    NOT?: VersionWhereInput | VersionWhereInput[]
    id?: StringFilter<"Version"> | string
    modelId?: StringFilter<"Version"> | string
    name?: StringFilter<"Version"> | string
    year?: IntFilter<"Version"> | number
    priceClp?: IntFilter<"Version"> | number
    transmission?: StringFilter<"Version"> | string
    fuel?: StringFilter<"Version"> | string
    engineDisplacementCc?: IntFilter<"Version"> | number
    powerHp?: IntFilter<"Version"> | number
    torqueNm?: IntFilter<"Version"> | number
    consumptionCityKmL?: FloatFilter<"Version"> | number
    consumptionHighwayKmL?: FloatFilter<"Version"> | number
    lengthMm?: IntFilter<"Version"> | number
    widthMm?: IntFilter<"Version"> | number
    heightMm?: IntFilter<"Version"> | number
    weightKg?: IntFilter<"Version"> | number
    trunkLiters?: IntFilter<"Version"> | number
    airbagCount?: IntFilter<"Version"> | number
    hasAbs?: BoolFilter<"Version"> | boolean
    hasEsp?: BoolFilter<"Version"> | boolean
    hasCruiseControl?: BoolFilter<"Version"> | boolean
    deletedAt?: DateTimeNullableFilter<"Version"> | Date | string | null
    createdAt?: DateTimeFilter<"Version"> | Date | string
    model?: XOR<ModelRelationFilter, ModelWhereInput>
    equipmentItems?: VersionEquipmentListRelationFilter
    maintenanceCosts?: MaintenanceCostListRelationFilter
    comparisonItems?: ComparisonItemListRelationFilter
    favorites?: FavoriteListRelationFilter
  }

  export type VersionOrderByWithRelationInput = {
    id?: SortOrder
    modelId?: SortOrder
    name?: SortOrder
    year?: SortOrder
    priceClp?: SortOrder
    transmission?: SortOrder
    fuel?: SortOrder
    engineDisplacementCc?: SortOrder
    powerHp?: SortOrder
    torqueNm?: SortOrder
    consumptionCityKmL?: SortOrder
    consumptionHighwayKmL?: SortOrder
    lengthMm?: SortOrder
    widthMm?: SortOrder
    heightMm?: SortOrder
    weightKg?: SortOrder
    trunkLiters?: SortOrder
    airbagCount?: SortOrder
    hasAbs?: SortOrder
    hasEsp?: SortOrder
    hasCruiseControl?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    model?: ModelOrderByWithRelationInput
    equipmentItems?: VersionEquipmentOrderByRelationAggregateInput
    maintenanceCosts?: MaintenanceCostOrderByRelationAggregateInput
    comparisonItems?: ComparisonItemOrderByRelationAggregateInput
    favorites?: FavoriteOrderByRelationAggregateInput
  }

  export type VersionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: VersionWhereInput | VersionWhereInput[]
    OR?: VersionWhereInput[]
    NOT?: VersionWhereInput | VersionWhereInput[]
    modelId?: StringFilter<"Version"> | string
    name?: StringFilter<"Version"> | string
    year?: IntFilter<"Version"> | number
    priceClp?: IntFilter<"Version"> | number
    transmission?: StringFilter<"Version"> | string
    fuel?: StringFilter<"Version"> | string
    engineDisplacementCc?: IntFilter<"Version"> | number
    powerHp?: IntFilter<"Version"> | number
    torqueNm?: IntFilter<"Version"> | number
    consumptionCityKmL?: FloatFilter<"Version"> | number
    consumptionHighwayKmL?: FloatFilter<"Version"> | number
    lengthMm?: IntFilter<"Version"> | number
    widthMm?: IntFilter<"Version"> | number
    heightMm?: IntFilter<"Version"> | number
    weightKg?: IntFilter<"Version"> | number
    trunkLiters?: IntFilter<"Version"> | number
    airbagCount?: IntFilter<"Version"> | number
    hasAbs?: BoolFilter<"Version"> | boolean
    hasEsp?: BoolFilter<"Version"> | boolean
    hasCruiseControl?: BoolFilter<"Version"> | boolean
    deletedAt?: DateTimeNullableFilter<"Version"> | Date | string | null
    createdAt?: DateTimeFilter<"Version"> | Date | string
    model?: XOR<ModelRelationFilter, ModelWhereInput>
    equipmentItems?: VersionEquipmentListRelationFilter
    maintenanceCosts?: MaintenanceCostListRelationFilter
    comparisonItems?: ComparisonItemListRelationFilter
    favorites?: FavoriteListRelationFilter
  }, "id">

  export type VersionOrderByWithAggregationInput = {
    id?: SortOrder
    modelId?: SortOrder
    name?: SortOrder
    year?: SortOrder
    priceClp?: SortOrder
    transmission?: SortOrder
    fuel?: SortOrder
    engineDisplacementCc?: SortOrder
    powerHp?: SortOrder
    torqueNm?: SortOrder
    consumptionCityKmL?: SortOrder
    consumptionHighwayKmL?: SortOrder
    lengthMm?: SortOrder
    widthMm?: SortOrder
    heightMm?: SortOrder
    weightKg?: SortOrder
    trunkLiters?: SortOrder
    airbagCount?: SortOrder
    hasAbs?: SortOrder
    hasEsp?: SortOrder
    hasCruiseControl?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: VersionCountOrderByAggregateInput
    _avg?: VersionAvgOrderByAggregateInput
    _max?: VersionMaxOrderByAggregateInput
    _min?: VersionMinOrderByAggregateInput
    _sum?: VersionSumOrderByAggregateInput
  }

  export type VersionScalarWhereWithAggregatesInput = {
    AND?: VersionScalarWhereWithAggregatesInput | VersionScalarWhereWithAggregatesInput[]
    OR?: VersionScalarWhereWithAggregatesInput[]
    NOT?: VersionScalarWhereWithAggregatesInput | VersionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Version"> | string
    modelId?: StringWithAggregatesFilter<"Version"> | string
    name?: StringWithAggregatesFilter<"Version"> | string
    year?: IntWithAggregatesFilter<"Version"> | number
    priceClp?: IntWithAggregatesFilter<"Version"> | number
    transmission?: StringWithAggregatesFilter<"Version"> | string
    fuel?: StringWithAggregatesFilter<"Version"> | string
    engineDisplacementCc?: IntWithAggregatesFilter<"Version"> | number
    powerHp?: IntWithAggregatesFilter<"Version"> | number
    torqueNm?: IntWithAggregatesFilter<"Version"> | number
    consumptionCityKmL?: FloatWithAggregatesFilter<"Version"> | number
    consumptionHighwayKmL?: FloatWithAggregatesFilter<"Version"> | number
    lengthMm?: IntWithAggregatesFilter<"Version"> | number
    widthMm?: IntWithAggregatesFilter<"Version"> | number
    heightMm?: IntWithAggregatesFilter<"Version"> | number
    weightKg?: IntWithAggregatesFilter<"Version"> | number
    trunkLiters?: IntWithAggregatesFilter<"Version"> | number
    airbagCount?: IntWithAggregatesFilter<"Version"> | number
    hasAbs?: BoolWithAggregatesFilter<"Version"> | boolean
    hasEsp?: BoolWithAggregatesFilter<"Version"> | boolean
    hasCruiseControl?: BoolWithAggregatesFilter<"Version"> | boolean
    deletedAt?: DateTimeNullableWithAggregatesFilter<"Version"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Version"> | Date | string
  }

  export type EquipmentItemWhereInput = {
    AND?: EquipmentItemWhereInput | EquipmentItemWhereInput[]
    OR?: EquipmentItemWhereInput[]
    NOT?: EquipmentItemWhereInput | EquipmentItemWhereInput[]
    id?: StringFilter<"EquipmentItem"> | string
    name?: StringFilter<"EquipmentItem"> | string
    category?: StringFilter<"EquipmentItem"> | string
    deletedAt?: DateTimeNullableFilter<"EquipmentItem"> | Date | string | null
    versions?: VersionEquipmentListRelationFilter
  }

  export type EquipmentItemOrderByWithRelationInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    versions?: VersionEquipmentOrderByRelationAggregateInput
  }

  export type EquipmentItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    name?: string
    AND?: EquipmentItemWhereInput | EquipmentItemWhereInput[]
    OR?: EquipmentItemWhereInput[]
    NOT?: EquipmentItemWhereInput | EquipmentItemWhereInput[]
    category?: StringFilter<"EquipmentItem"> | string
    deletedAt?: DateTimeNullableFilter<"EquipmentItem"> | Date | string | null
    versions?: VersionEquipmentListRelationFilter
  }, "id" | "name">

  export type EquipmentItemOrderByWithAggregationInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    _count?: EquipmentItemCountOrderByAggregateInput
    _max?: EquipmentItemMaxOrderByAggregateInput
    _min?: EquipmentItemMinOrderByAggregateInput
  }

  export type EquipmentItemScalarWhereWithAggregatesInput = {
    AND?: EquipmentItemScalarWhereWithAggregatesInput | EquipmentItemScalarWhereWithAggregatesInput[]
    OR?: EquipmentItemScalarWhereWithAggregatesInput[]
    NOT?: EquipmentItemScalarWhereWithAggregatesInput | EquipmentItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EquipmentItem"> | string
    name?: StringWithAggregatesFilter<"EquipmentItem"> | string
    category?: StringWithAggregatesFilter<"EquipmentItem"> | string
    deletedAt?: DateTimeNullableWithAggregatesFilter<"EquipmentItem"> | Date | string | null
  }

  export type VersionEquipmentWhereInput = {
    AND?: VersionEquipmentWhereInput | VersionEquipmentWhereInput[]
    OR?: VersionEquipmentWhereInput[]
    NOT?: VersionEquipmentWhereInput | VersionEquipmentWhereInput[]
    versionId?: StringFilter<"VersionEquipment"> | string
    equipmentItemId?: StringFilter<"VersionEquipment"> | string
    version?: XOR<VersionRelationFilter, VersionWhereInput>
    equipmentItem?: XOR<EquipmentItemRelationFilter, EquipmentItemWhereInput>
  }

  export type VersionEquipmentOrderByWithRelationInput = {
    versionId?: SortOrder
    equipmentItemId?: SortOrder
    version?: VersionOrderByWithRelationInput
    equipmentItem?: EquipmentItemOrderByWithRelationInput
  }

  export type VersionEquipmentWhereUniqueInput = Prisma.AtLeast<{
    versionId_equipmentItemId?: VersionEquipmentVersionIdEquipmentItemIdCompoundUniqueInput
    AND?: VersionEquipmentWhereInput | VersionEquipmentWhereInput[]
    OR?: VersionEquipmentWhereInput[]
    NOT?: VersionEquipmentWhereInput | VersionEquipmentWhereInput[]
    versionId?: StringFilter<"VersionEquipment"> | string
    equipmentItemId?: StringFilter<"VersionEquipment"> | string
    version?: XOR<VersionRelationFilter, VersionWhereInput>
    equipmentItem?: XOR<EquipmentItemRelationFilter, EquipmentItemWhereInput>
  }, "versionId_equipmentItemId">

  export type VersionEquipmentOrderByWithAggregationInput = {
    versionId?: SortOrder
    equipmentItemId?: SortOrder
    _count?: VersionEquipmentCountOrderByAggregateInput
    _max?: VersionEquipmentMaxOrderByAggregateInput
    _min?: VersionEquipmentMinOrderByAggregateInput
  }

  export type VersionEquipmentScalarWhereWithAggregatesInput = {
    AND?: VersionEquipmentScalarWhereWithAggregatesInput | VersionEquipmentScalarWhereWithAggregatesInput[]
    OR?: VersionEquipmentScalarWhereWithAggregatesInput[]
    NOT?: VersionEquipmentScalarWhereWithAggregatesInput | VersionEquipmentScalarWhereWithAggregatesInput[]
    versionId?: StringWithAggregatesFilter<"VersionEquipment"> | string
    equipmentItemId?: StringWithAggregatesFilter<"VersionEquipment"> | string
  }

  export type MaintenanceCostWhereInput = {
    AND?: MaintenanceCostWhereInput | MaintenanceCostWhereInput[]
    OR?: MaintenanceCostWhereInput[]
    NOT?: MaintenanceCostWhereInput | MaintenanceCostWhereInput[]
    id?: StringFilter<"MaintenanceCost"> | string
    versionId?: StringFilter<"MaintenanceCost"> | string
    mileageTag?: IntFilter<"MaintenanceCost"> | number
    costClp?: IntFilter<"MaintenanceCost"> | number
    deletedAt?: DateTimeNullableFilter<"MaintenanceCost"> | Date | string | null
    version?: XOR<VersionRelationFilter, VersionWhereInput>
  }

  export type MaintenanceCostOrderByWithRelationInput = {
    id?: SortOrder
    versionId?: SortOrder
    mileageTag?: SortOrder
    costClp?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    version?: VersionOrderByWithRelationInput
  }

  export type MaintenanceCostWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    versionId_mileageTag?: MaintenanceCostVersionIdMileageTagCompoundUniqueInput
    AND?: MaintenanceCostWhereInput | MaintenanceCostWhereInput[]
    OR?: MaintenanceCostWhereInput[]
    NOT?: MaintenanceCostWhereInput | MaintenanceCostWhereInput[]
    versionId?: StringFilter<"MaintenanceCost"> | string
    mileageTag?: IntFilter<"MaintenanceCost"> | number
    costClp?: IntFilter<"MaintenanceCost"> | number
    deletedAt?: DateTimeNullableFilter<"MaintenanceCost"> | Date | string | null
    version?: XOR<VersionRelationFilter, VersionWhereInput>
  }, "id" | "versionId_mileageTag">

  export type MaintenanceCostOrderByWithAggregationInput = {
    id?: SortOrder
    versionId?: SortOrder
    mileageTag?: SortOrder
    costClp?: SortOrder
    deletedAt?: SortOrderInput | SortOrder
    _count?: MaintenanceCostCountOrderByAggregateInput
    _avg?: MaintenanceCostAvgOrderByAggregateInput
    _max?: MaintenanceCostMaxOrderByAggregateInput
    _min?: MaintenanceCostMinOrderByAggregateInput
    _sum?: MaintenanceCostSumOrderByAggregateInput
  }

  export type MaintenanceCostScalarWhereWithAggregatesInput = {
    AND?: MaintenanceCostScalarWhereWithAggregatesInput | MaintenanceCostScalarWhereWithAggregatesInput[]
    OR?: MaintenanceCostScalarWhereWithAggregatesInput[]
    NOT?: MaintenanceCostScalarWhereWithAggregatesInput | MaintenanceCostScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"MaintenanceCost"> | string
    versionId?: StringWithAggregatesFilter<"MaintenanceCost"> | string
    mileageTag?: IntWithAggregatesFilter<"MaintenanceCost"> | number
    costClp?: IntWithAggregatesFilter<"MaintenanceCost"> | number
    deletedAt?: DateTimeNullableWithAggregatesFilter<"MaintenanceCost"> | Date | string | null
  }

  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    passwordHash?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    comparisons?: ComparisonListRelationFilter
    favorites?: FavoriteListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    comparisons?: ComparisonOrderByRelationAggregateInput
    favorites?: FavoriteOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    passwordHash?: StringFilter<"User"> | string
    name?: StringFilter<"User"> | string
    role?: StringFilter<"User"> | string
    createdAt?: DateTimeFilter<"User"> | Date | string
    comparisons?: ComparisonListRelationFilter
    favorites?: FavoriteListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    passwordHash?: StringWithAggregatesFilter<"User"> | string
    name?: StringWithAggregatesFilter<"User"> | string
    role?: StringWithAggregatesFilter<"User"> | string
    createdAt?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type ComparisonWhereInput = {
    AND?: ComparisonWhereInput | ComparisonWhereInput[]
    OR?: ComparisonWhereInput[]
    NOT?: ComparisonWhereInput | ComparisonWhereInput[]
    id?: StringFilter<"Comparison"> | string
    userId?: StringFilter<"Comparison"> | string
    slug?: StringNullableFilter<"Comparison"> | string | null
    name?: StringNullableFilter<"Comparison"> | string | null
    versionsHash?: StringFilter<"Comparison"> | string
    createdAt?: DateTimeFilter<"Comparison"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    items?: ComparisonItemListRelationFilter
  }

  export type ComparisonOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    slug?: SortOrderInput | SortOrder
    name?: SortOrderInput | SortOrder
    versionsHash?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    items?: ComparisonItemOrderByRelationAggregateInput
  }

  export type ComparisonWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    slug?: string
    userId_versionsHash?: ComparisonUserIdVersionsHashCompoundUniqueInput
    AND?: ComparisonWhereInput | ComparisonWhereInput[]
    OR?: ComparisonWhereInput[]
    NOT?: ComparisonWhereInput | ComparisonWhereInput[]
    userId?: StringFilter<"Comparison"> | string
    name?: StringNullableFilter<"Comparison"> | string | null
    versionsHash?: StringFilter<"Comparison"> | string
    createdAt?: DateTimeFilter<"Comparison"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    items?: ComparisonItemListRelationFilter
  }, "id" | "slug" | "userId_versionsHash">

  export type ComparisonOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    slug?: SortOrderInput | SortOrder
    name?: SortOrderInput | SortOrder
    versionsHash?: SortOrder
    createdAt?: SortOrder
    _count?: ComparisonCountOrderByAggregateInput
    _max?: ComparisonMaxOrderByAggregateInput
    _min?: ComparisonMinOrderByAggregateInput
  }

  export type ComparisonScalarWhereWithAggregatesInput = {
    AND?: ComparisonScalarWhereWithAggregatesInput | ComparisonScalarWhereWithAggregatesInput[]
    OR?: ComparisonScalarWhereWithAggregatesInput[]
    NOT?: ComparisonScalarWhereWithAggregatesInput | ComparisonScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Comparison"> | string
    userId?: StringWithAggregatesFilter<"Comparison"> | string
    slug?: StringNullableWithAggregatesFilter<"Comparison"> | string | null
    name?: StringNullableWithAggregatesFilter<"Comparison"> | string | null
    versionsHash?: StringWithAggregatesFilter<"Comparison"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Comparison"> | Date | string
  }

  export type ComparisonItemWhereInput = {
    AND?: ComparisonItemWhereInput | ComparisonItemWhereInput[]
    OR?: ComparisonItemWhereInput[]
    NOT?: ComparisonItemWhereInput | ComparisonItemWhereInput[]
    id?: StringFilter<"ComparisonItem"> | string
    comparisonId?: StringFilter<"ComparisonItem"> | string
    versionId?: StringFilter<"ComparisonItem"> | string
    position?: IntFilter<"ComparisonItem"> | number
    comparison?: XOR<ComparisonRelationFilter, ComparisonWhereInput>
    version?: XOR<VersionRelationFilter, VersionWhereInput>
  }

  export type ComparisonItemOrderByWithRelationInput = {
    id?: SortOrder
    comparisonId?: SortOrder
    versionId?: SortOrder
    position?: SortOrder
    comparison?: ComparisonOrderByWithRelationInput
    version?: VersionOrderByWithRelationInput
  }

  export type ComparisonItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    comparisonId_position?: ComparisonItemComparisonIdPositionCompoundUniqueInput
    AND?: ComparisonItemWhereInput | ComparisonItemWhereInput[]
    OR?: ComparisonItemWhereInput[]
    NOT?: ComparisonItemWhereInput | ComparisonItemWhereInput[]
    comparisonId?: StringFilter<"ComparisonItem"> | string
    versionId?: StringFilter<"ComparisonItem"> | string
    position?: IntFilter<"ComparisonItem"> | number
    comparison?: XOR<ComparisonRelationFilter, ComparisonWhereInput>
    version?: XOR<VersionRelationFilter, VersionWhereInput>
  }, "id" | "comparisonId_position">

  export type ComparisonItemOrderByWithAggregationInput = {
    id?: SortOrder
    comparisonId?: SortOrder
    versionId?: SortOrder
    position?: SortOrder
    _count?: ComparisonItemCountOrderByAggregateInput
    _avg?: ComparisonItemAvgOrderByAggregateInput
    _max?: ComparisonItemMaxOrderByAggregateInput
    _min?: ComparisonItemMinOrderByAggregateInput
    _sum?: ComparisonItemSumOrderByAggregateInput
  }

  export type ComparisonItemScalarWhereWithAggregatesInput = {
    AND?: ComparisonItemScalarWhereWithAggregatesInput | ComparisonItemScalarWhereWithAggregatesInput[]
    OR?: ComparisonItemScalarWhereWithAggregatesInput[]
    NOT?: ComparisonItemScalarWhereWithAggregatesInput | ComparisonItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ComparisonItem"> | string
    comparisonId?: StringWithAggregatesFilter<"ComparisonItem"> | string
    versionId?: StringWithAggregatesFilter<"ComparisonItem"> | string
    position?: IntWithAggregatesFilter<"ComparisonItem"> | number
  }

  export type FavoriteWhereInput = {
    AND?: FavoriteWhereInput | FavoriteWhereInput[]
    OR?: FavoriteWhereInput[]
    NOT?: FavoriteWhereInput | FavoriteWhereInput[]
    id?: StringFilter<"Favorite"> | string
    userId?: StringFilter<"Favorite"> | string
    modelId?: StringFilter<"Favorite"> | string
    versionId?: StringFilter<"Favorite"> | string
    createdAt?: DateTimeFilter<"Favorite"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    model?: XOR<ModelRelationFilter, ModelWhereInput>
    version?: XOR<VersionRelationFilter, VersionWhereInput>
  }

  export type FavoriteOrderByWithRelationInput = {
    id?: SortOrder
    userId?: SortOrder
    modelId?: SortOrder
    versionId?: SortOrder
    createdAt?: SortOrder
    user?: UserOrderByWithRelationInput
    model?: ModelOrderByWithRelationInput
    version?: VersionOrderByWithRelationInput
  }

  export type FavoriteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    userId_versionId?: FavoriteUserIdVersionIdCompoundUniqueInput
    AND?: FavoriteWhereInput | FavoriteWhereInput[]
    OR?: FavoriteWhereInput[]
    NOT?: FavoriteWhereInput | FavoriteWhereInput[]
    userId?: StringFilter<"Favorite"> | string
    modelId?: StringFilter<"Favorite"> | string
    versionId?: StringFilter<"Favorite"> | string
    createdAt?: DateTimeFilter<"Favorite"> | Date | string
    user?: XOR<UserRelationFilter, UserWhereInput>
    model?: XOR<ModelRelationFilter, ModelWhereInput>
    version?: XOR<VersionRelationFilter, VersionWhereInput>
  }, "id" | "userId_versionId">

  export type FavoriteOrderByWithAggregationInput = {
    id?: SortOrder
    userId?: SortOrder
    modelId?: SortOrder
    versionId?: SortOrder
    createdAt?: SortOrder
    _count?: FavoriteCountOrderByAggregateInput
    _max?: FavoriteMaxOrderByAggregateInput
    _min?: FavoriteMinOrderByAggregateInput
  }

  export type FavoriteScalarWhereWithAggregatesInput = {
    AND?: FavoriteScalarWhereWithAggregatesInput | FavoriteScalarWhereWithAggregatesInput[]
    OR?: FavoriteScalarWhereWithAggregatesInput[]
    NOT?: FavoriteScalarWhereWithAggregatesInput | FavoriteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Favorite"> | string
    userId?: StringWithAggregatesFilter<"Favorite"> | string
    modelId?: StringWithAggregatesFilter<"Favorite"> | string
    versionId?: StringWithAggregatesFilter<"Favorite"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Favorite"> | Date | string
  }

  export type BrandCreateInput = {
    id?: string
    name: string
    logoUrl?: string | null
    deletedAt?: Date | string | null
    createdAt?: Date | string
    models?: ModelCreateNestedManyWithoutBrandInput
  }

  export type BrandUncheckedCreateInput = {
    id?: string
    name: string
    logoUrl?: string | null
    deletedAt?: Date | string | null
    createdAt?: Date | string
    models?: ModelUncheckedCreateNestedManyWithoutBrandInput
  }

  export type BrandUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    models?: ModelUpdateManyWithoutBrandNestedInput
  }

  export type BrandUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    models?: ModelUncheckedUpdateManyWithoutBrandNestedInput
  }

  export type BrandCreateManyInput = {
    id?: string
    name: string
    logoUrl?: string | null
    deletedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type BrandUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BrandUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelCreateInput = {
    id?: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
    brand: BrandCreateNestedOneWithoutModelsInput
    versions?: VersionCreateNestedManyWithoutModelInput
    favorites?: FavoriteCreateNestedManyWithoutModelInput
  }

  export type ModelUncheckedCreateInput = {
    id?: string
    brandId: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
    versions?: VersionUncheckedCreateNestedManyWithoutModelInput
    favorites?: FavoriteUncheckedCreateNestedManyWithoutModelInput
  }

  export type ModelUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    brand?: BrandUpdateOneRequiredWithoutModelsNestedInput
    versions?: VersionUpdateManyWithoutModelNestedInput
    favorites?: FavoriteUpdateManyWithoutModelNestedInput
  }

  export type ModelUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    brandId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    versions?: VersionUncheckedUpdateManyWithoutModelNestedInput
    favorites?: FavoriteUncheckedUpdateManyWithoutModelNestedInput
  }

  export type ModelCreateManyInput = {
    id?: string
    brandId: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type ModelUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ModelUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    brandId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionCreateInput = {
    id?: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    model: ModelCreateNestedOneWithoutVersionsInput
    equipmentItems?: VersionEquipmentCreateNestedManyWithoutVersionInput
    maintenanceCosts?: MaintenanceCostCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemCreateNestedManyWithoutVersionInput
    favorites?: FavoriteCreateNestedManyWithoutVersionInput
  }

  export type VersionUncheckedCreateInput = {
    id?: string
    modelId: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    equipmentItems?: VersionEquipmentUncheckedCreateNestedManyWithoutVersionInput
    maintenanceCosts?: MaintenanceCostUncheckedCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemUncheckedCreateNestedManyWithoutVersionInput
    favorites?: FavoriteUncheckedCreateNestedManyWithoutVersionInput
  }

  export type VersionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelUpdateOneRequiredWithoutVersionsNestedInput
    equipmentItems?: VersionEquipmentUpdateManyWithoutVersionNestedInput
    maintenanceCosts?: MaintenanceCostUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUpdateManyWithoutVersionNestedInput
  }

  export type VersionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    equipmentItems?: VersionEquipmentUncheckedUpdateManyWithoutVersionNestedInput
    maintenanceCosts?: MaintenanceCostUncheckedUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUncheckedUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUncheckedUpdateManyWithoutVersionNestedInput
  }

  export type VersionCreateManyInput = {
    id?: string
    modelId: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type VersionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EquipmentItemCreateInput = {
    id?: string
    name: string
    category: string
    deletedAt?: Date | string | null
    versions?: VersionEquipmentCreateNestedManyWithoutEquipmentItemInput
  }

  export type EquipmentItemUncheckedCreateInput = {
    id?: string
    name: string
    category: string
    deletedAt?: Date | string | null
    versions?: VersionEquipmentUncheckedCreateNestedManyWithoutEquipmentItemInput
  }

  export type EquipmentItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    versions?: VersionEquipmentUpdateManyWithoutEquipmentItemNestedInput
  }

  export type EquipmentItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    versions?: VersionEquipmentUncheckedUpdateManyWithoutEquipmentItemNestedInput
  }

  export type EquipmentItemCreateManyInput = {
    id?: string
    name: string
    category: string
    deletedAt?: Date | string | null
  }

  export type EquipmentItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type EquipmentItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type VersionEquipmentCreateInput = {
    version: VersionCreateNestedOneWithoutEquipmentItemsInput
    equipmentItem: EquipmentItemCreateNestedOneWithoutVersionsInput
  }

  export type VersionEquipmentUncheckedCreateInput = {
    versionId: string
    equipmentItemId: string
  }

  export type VersionEquipmentUpdateInput = {
    version?: VersionUpdateOneRequiredWithoutEquipmentItemsNestedInput
    equipmentItem?: EquipmentItemUpdateOneRequiredWithoutVersionsNestedInput
  }

  export type VersionEquipmentUncheckedUpdateInput = {
    versionId?: StringFieldUpdateOperationsInput | string
    equipmentItemId?: StringFieldUpdateOperationsInput | string
  }

  export type VersionEquipmentCreateManyInput = {
    versionId: string
    equipmentItemId: string
  }

  export type VersionEquipmentUpdateManyMutationInput = {

  }

  export type VersionEquipmentUncheckedUpdateManyInput = {
    versionId?: StringFieldUpdateOperationsInput | string
    equipmentItemId?: StringFieldUpdateOperationsInput | string
  }

  export type MaintenanceCostCreateInput = {
    id?: string
    mileageTag: number
    costClp: number
    deletedAt?: Date | string | null
    version: VersionCreateNestedOneWithoutMaintenanceCostsInput
  }

  export type MaintenanceCostUncheckedCreateInput = {
    id?: string
    versionId: string
    mileageTag: number
    costClp: number
    deletedAt?: Date | string | null
  }

  export type MaintenanceCostUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    mileageTag?: IntFieldUpdateOperationsInput | number
    costClp?: IntFieldUpdateOperationsInput | number
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    version?: VersionUpdateOneRequiredWithoutMaintenanceCostsNestedInput
  }

  export type MaintenanceCostUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    mileageTag?: IntFieldUpdateOperationsInput | number
    costClp?: IntFieldUpdateOperationsInput | number
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MaintenanceCostCreateManyInput = {
    id?: string
    versionId: string
    mileageTag: number
    costClp: number
    deletedAt?: Date | string | null
  }

  export type MaintenanceCostUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    mileageTag?: IntFieldUpdateOperationsInput | number
    costClp?: IntFieldUpdateOperationsInput | number
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MaintenanceCostUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    mileageTag?: IntFieldUpdateOperationsInput | number
    costClp?: IntFieldUpdateOperationsInput | number
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type UserCreateInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    comparisons?: ComparisonCreateNestedManyWithoutUserInput
    favorites?: FavoriteCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    comparisons?: ComparisonUncheckedCreateNestedManyWithoutUserInput
    favorites?: FavoriteUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comparisons?: ComparisonUpdateManyWithoutUserNestedInput
    favorites?: FavoriteUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comparisons?: ComparisonUncheckedUpdateManyWithoutUserNestedInput
    favorites?: FavoriteUncheckedUpdateManyWithoutUserNestedInput
  }

  export type UserCreateManyInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComparisonCreateInput = {
    id?: string
    slug?: string | null
    name?: string | null
    versionsHash: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutComparisonsInput
    items?: ComparisonItemCreateNestedManyWithoutComparisonInput
  }

  export type ComparisonUncheckedCreateInput = {
    id?: string
    userId: string
    slug?: string | null
    name?: string | null
    versionsHash: string
    createdAt?: Date | string
    items?: ComparisonItemUncheckedCreateNestedManyWithoutComparisonInput
  }

  export type ComparisonUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutComparisonsNestedInput
    items?: ComparisonItemUpdateManyWithoutComparisonNestedInput
  }

  export type ComparisonUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ComparisonItemUncheckedUpdateManyWithoutComparisonNestedInput
  }

  export type ComparisonCreateManyInput = {
    id?: string
    userId: string
    slug?: string | null
    name?: string | null
    versionsHash: string
    createdAt?: Date | string
  }

  export type ComparisonUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComparisonUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComparisonItemCreateInput = {
    id?: string
    position: number
    comparison: ComparisonCreateNestedOneWithoutItemsInput
    version: VersionCreateNestedOneWithoutComparisonItemsInput
  }

  export type ComparisonItemUncheckedCreateInput = {
    id?: string
    comparisonId: string
    versionId: string
    position: number
  }

  export type ComparisonItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    comparison?: ComparisonUpdateOneRequiredWithoutItemsNestedInput
    version?: VersionUpdateOneRequiredWithoutComparisonItemsNestedInput
  }

  export type ComparisonItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    comparisonId?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
  }

  export type ComparisonItemCreateManyInput = {
    id?: string
    comparisonId: string
    versionId: string
    position: number
  }

  export type ComparisonItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
  }

  export type ComparisonItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    comparisonId?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
  }

  export type FavoriteCreateInput = {
    id?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutFavoritesInput
    model: ModelCreateNestedOneWithoutFavoritesInput
    version: VersionCreateNestedOneWithoutFavoritesInput
  }

  export type FavoriteUncheckedCreateInput = {
    id?: string
    userId: string
    modelId: string
    versionId: string
    createdAt?: Date | string
  }

  export type FavoriteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFavoritesNestedInput
    model?: ModelUpdateOneRequiredWithoutFavoritesNestedInput
    version?: VersionUpdateOneRequiredWithoutFavoritesNestedInput
  }

  export type FavoriteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FavoriteCreateManyInput = {
    id?: string
    userId: string
    modelId: string
    versionId: string
    createdAt?: Date | string
  }

  export type FavoriteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FavoriteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type ModelListRelationFilter = {
    every?: ModelWhereInput
    some?: ModelWhereInput
    none?: ModelWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type ModelOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type BrandCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    logoUrl?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type BrandMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    logoUrl?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type BrandMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    logoUrl?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type JsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type BrandRelationFilter = {
    is?: BrandWhereInput
    isNot?: BrandWhereInput
  }

  export type VersionListRelationFilter = {
    every?: VersionWhereInput
    some?: VersionWhereInput
    none?: VersionWhereInput
  }

  export type FavoriteListRelationFilter = {
    every?: FavoriteWhereInput
    some?: FavoriteWhereInput
    none?: FavoriteWhereInput
  }

  export type VersionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type FavoriteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ModelBrandIdNameCompoundUniqueInput = {
    brandId: string
    name: string
  }

  export type ModelCountOrderByAggregateInput = {
    id?: SortOrder
    brandId?: SortOrder
    name?: SortOrder
    segment?: SortOrder
    imageUrl?: SortOrder
    galleryUrls?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type ModelMaxOrderByAggregateInput = {
    id?: SortOrder
    brandId?: SortOrder
    name?: SortOrder
    segment?: SortOrder
    imageUrl?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type ModelMinOrderByAggregateInput = {
    id?: SortOrder
    brandId?: SortOrder
    name?: SortOrder
    segment?: SortOrder
    imageUrl?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type FloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type ModelRelationFilter = {
    is?: ModelWhereInput
    isNot?: ModelWhereInput
  }

  export type VersionEquipmentListRelationFilter = {
    every?: VersionEquipmentWhereInput
    some?: VersionEquipmentWhereInput
    none?: VersionEquipmentWhereInput
  }

  export type MaintenanceCostListRelationFilter = {
    every?: MaintenanceCostWhereInput
    some?: MaintenanceCostWhereInput
    none?: MaintenanceCostWhereInput
  }

  export type ComparisonItemListRelationFilter = {
    every?: ComparisonItemWhereInput
    some?: ComparisonItemWhereInput
    none?: ComparisonItemWhereInput
  }

  export type VersionEquipmentOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type MaintenanceCostOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ComparisonItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type VersionCountOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    name?: SortOrder
    year?: SortOrder
    priceClp?: SortOrder
    transmission?: SortOrder
    fuel?: SortOrder
    engineDisplacementCc?: SortOrder
    powerHp?: SortOrder
    torqueNm?: SortOrder
    consumptionCityKmL?: SortOrder
    consumptionHighwayKmL?: SortOrder
    lengthMm?: SortOrder
    widthMm?: SortOrder
    heightMm?: SortOrder
    weightKg?: SortOrder
    trunkLiters?: SortOrder
    airbagCount?: SortOrder
    hasAbs?: SortOrder
    hasEsp?: SortOrder
    hasCruiseControl?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type VersionAvgOrderByAggregateInput = {
    year?: SortOrder
    priceClp?: SortOrder
    engineDisplacementCc?: SortOrder
    powerHp?: SortOrder
    torqueNm?: SortOrder
    consumptionCityKmL?: SortOrder
    consumptionHighwayKmL?: SortOrder
    lengthMm?: SortOrder
    widthMm?: SortOrder
    heightMm?: SortOrder
    weightKg?: SortOrder
    trunkLiters?: SortOrder
    airbagCount?: SortOrder
  }

  export type VersionMaxOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    name?: SortOrder
    year?: SortOrder
    priceClp?: SortOrder
    transmission?: SortOrder
    fuel?: SortOrder
    engineDisplacementCc?: SortOrder
    powerHp?: SortOrder
    torqueNm?: SortOrder
    consumptionCityKmL?: SortOrder
    consumptionHighwayKmL?: SortOrder
    lengthMm?: SortOrder
    widthMm?: SortOrder
    heightMm?: SortOrder
    weightKg?: SortOrder
    trunkLiters?: SortOrder
    airbagCount?: SortOrder
    hasAbs?: SortOrder
    hasEsp?: SortOrder
    hasCruiseControl?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type VersionMinOrderByAggregateInput = {
    id?: SortOrder
    modelId?: SortOrder
    name?: SortOrder
    year?: SortOrder
    priceClp?: SortOrder
    transmission?: SortOrder
    fuel?: SortOrder
    engineDisplacementCc?: SortOrder
    powerHp?: SortOrder
    torqueNm?: SortOrder
    consumptionCityKmL?: SortOrder
    consumptionHighwayKmL?: SortOrder
    lengthMm?: SortOrder
    widthMm?: SortOrder
    heightMm?: SortOrder
    weightKg?: SortOrder
    trunkLiters?: SortOrder
    airbagCount?: SortOrder
    hasAbs?: SortOrder
    hasEsp?: SortOrder
    hasCruiseControl?: SortOrder
    deletedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type VersionSumOrderByAggregateInput = {
    year?: SortOrder
    priceClp?: SortOrder
    engineDisplacementCc?: SortOrder
    powerHp?: SortOrder
    torqueNm?: SortOrder
    consumptionCityKmL?: SortOrder
    consumptionHighwayKmL?: SortOrder
    lengthMm?: SortOrder
    widthMm?: SortOrder
    heightMm?: SortOrder
    weightKg?: SortOrder
    trunkLiters?: SortOrder
    airbagCount?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type FloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type EquipmentItemCountOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    deletedAt?: SortOrder
  }

  export type EquipmentItemMaxOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    deletedAt?: SortOrder
  }

  export type EquipmentItemMinOrderByAggregateInput = {
    id?: SortOrder
    name?: SortOrder
    category?: SortOrder
    deletedAt?: SortOrder
  }

  export type VersionRelationFilter = {
    is?: VersionWhereInput
    isNot?: VersionWhereInput
  }

  export type EquipmentItemRelationFilter = {
    is?: EquipmentItemWhereInput
    isNot?: EquipmentItemWhereInput
  }

  export type VersionEquipmentVersionIdEquipmentItemIdCompoundUniqueInput = {
    versionId: string
    equipmentItemId: string
  }

  export type VersionEquipmentCountOrderByAggregateInput = {
    versionId?: SortOrder
    equipmentItemId?: SortOrder
  }

  export type VersionEquipmentMaxOrderByAggregateInput = {
    versionId?: SortOrder
    equipmentItemId?: SortOrder
  }

  export type VersionEquipmentMinOrderByAggregateInput = {
    versionId?: SortOrder
    equipmentItemId?: SortOrder
  }

  export type MaintenanceCostVersionIdMileageTagCompoundUniqueInput = {
    versionId: string
    mileageTag: number
  }

  export type MaintenanceCostCountOrderByAggregateInput = {
    id?: SortOrder
    versionId?: SortOrder
    mileageTag?: SortOrder
    costClp?: SortOrder
    deletedAt?: SortOrder
  }

  export type MaintenanceCostAvgOrderByAggregateInput = {
    mileageTag?: SortOrder
    costClp?: SortOrder
  }

  export type MaintenanceCostMaxOrderByAggregateInput = {
    id?: SortOrder
    versionId?: SortOrder
    mileageTag?: SortOrder
    costClp?: SortOrder
    deletedAt?: SortOrder
  }

  export type MaintenanceCostMinOrderByAggregateInput = {
    id?: SortOrder
    versionId?: SortOrder
    mileageTag?: SortOrder
    costClp?: SortOrder
    deletedAt?: SortOrder
  }

  export type MaintenanceCostSumOrderByAggregateInput = {
    mileageTag?: SortOrder
    costClp?: SortOrder
  }

  export type ComparisonListRelationFilter = {
    every?: ComparisonWhereInput
    some?: ComparisonWhereInput
    none?: ComparisonWhereInput
  }

  export type ComparisonOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    email?: SortOrder
    passwordHash?: SortOrder
    name?: SortOrder
    role?: SortOrder
    createdAt?: SortOrder
  }

  export type UserRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type ComparisonUserIdVersionsHashCompoundUniqueInput = {
    userId: string
    versionsHash: string
  }

  export type ComparisonCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    slug?: SortOrder
    name?: SortOrder
    versionsHash?: SortOrder
    createdAt?: SortOrder
  }

  export type ComparisonMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    slug?: SortOrder
    name?: SortOrder
    versionsHash?: SortOrder
    createdAt?: SortOrder
  }

  export type ComparisonMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    slug?: SortOrder
    name?: SortOrder
    versionsHash?: SortOrder
    createdAt?: SortOrder
  }

  export type ComparisonRelationFilter = {
    is?: ComparisonWhereInput
    isNot?: ComparisonWhereInput
  }

  export type ComparisonItemComparisonIdPositionCompoundUniqueInput = {
    comparisonId: string
    position: number
  }

  export type ComparisonItemCountOrderByAggregateInput = {
    id?: SortOrder
    comparisonId?: SortOrder
    versionId?: SortOrder
    position?: SortOrder
  }

  export type ComparisonItemAvgOrderByAggregateInput = {
    position?: SortOrder
  }

  export type ComparisonItemMaxOrderByAggregateInput = {
    id?: SortOrder
    comparisonId?: SortOrder
    versionId?: SortOrder
    position?: SortOrder
  }

  export type ComparisonItemMinOrderByAggregateInput = {
    id?: SortOrder
    comparisonId?: SortOrder
    versionId?: SortOrder
    position?: SortOrder
  }

  export type ComparisonItemSumOrderByAggregateInput = {
    position?: SortOrder
  }

  export type FavoriteUserIdVersionIdCompoundUniqueInput = {
    userId: string
    versionId: string
  }

  export type FavoriteCountOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    modelId?: SortOrder
    versionId?: SortOrder
    createdAt?: SortOrder
  }

  export type FavoriteMaxOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    modelId?: SortOrder
    versionId?: SortOrder
    createdAt?: SortOrder
  }

  export type FavoriteMinOrderByAggregateInput = {
    id?: SortOrder
    userId?: SortOrder
    modelId?: SortOrder
    versionId?: SortOrder
    createdAt?: SortOrder
  }

  export type ModelCreateNestedManyWithoutBrandInput = {
    create?: XOR<ModelCreateWithoutBrandInput, ModelUncheckedCreateWithoutBrandInput> | ModelCreateWithoutBrandInput[] | ModelUncheckedCreateWithoutBrandInput[]
    connectOrCreate?: ModelCreateOrConnectWithoutBrandInput | ModelCreateOrConnectWithoutBrandInput[]
    createMany?: ModelCreateManyBrandInputEnvelope
    connect?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
  }

  export type ModelUncheckedCreateNestedManyWithoutBrandInput = {
    create?: XOR<ModelCreateWithoutBrandInput, ModelUncheckedCreateWithoutBrandInput> | ModelCreateWithoutBrandInput[] | ModelUncheckedCreateWithoutBrandInput[]
    connectOrCreate?: ModelCreateOrConnectWithoutBrandInput | ModelCreateOrConnectWithoutBrandInput[]
    createMany?: ModelCreateManyBrandInputEnvelope
    connect?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type ModelUpdateManyWithoutBrandNestedInput = {
    create?: XOR<ModelCreateWithoutBrandInput, ModelUncheckedCreateWithoutBrandInput> | ModelCreateWithoutBrandInput[] | ModelUncheckedCreateWithoutBrandInput[]
    connectOrCreate?: ModelCreateOrConnectWithoutBrandInput | ModelCreateOrConnectWithoutBrandInput[]
    upsert?: ModelUpsertWithWhereUniqueWithoutBrandInput | ModelUpsertWithWhereUniqueWithoutBrandInput[]
    createMany?: ModelCreateManyBrandInputEnvelope
    set?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
    disconnect?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
    delete?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
    connect?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
    update?: ModelUpdateWithWhereUniqueWithoutBrandInput | ModelUpdateWithWhereUniqueWithoutBrandInput[]
    updateMany?: ModelUpdateManyWithWhereWithoutBrandInput | ModelUpdateManyWithWhereWithoutBrandInput[]
    deleteMany?: ModelScalarWhereInput | ModelScalarWhereInput[]
  }

  export type ModelUncheckedUpdateManyWithoutBrandNestedInput = {
    create?: XOR<ModelCreateWithoutBrandInput, ModelUncheckedCreateWithoutBrandInput> | ModelCreateWithoutBrandInput[] | ModelUncheckedCreateWithoutBrandInput[]
    connectOrCreate?: ModelCreateOrConnectWithoutBrandInput | ModelCreateOrConnectWithoutBrandInput[]
    upsert?: ModelUpsertWithWhereUniqueWithoutBrandInput | ModelUpsertWithWhereUniqueWithoutBrandInput[]
    createMany?: ModelCreateManyBrandInputEnvelope
    set?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
    disconnect?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
    delete?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
    connect?: ModelWhereUniqueInput | ModelWhereUniqueInput[]
    update?: ModelUpdateWithWhereUniqueWithoutBrandInput | ModelUpdateWithWhereUniqueWithoutBrandInput[]
    updateMany?: ModelUpdateManyWithWhereWithoutBrandInput | ModelUpdateManyWithWhereWithoutBrandInput[]
    deleteMany?: ModelScalarWhereInput | ModelScalarWhereInput[]
  }

  export type BrandCreateNestedOneWithoutModelsInput = {
    create?: XOR<BrandCreateWithoutModelsInput, BrandUncheckedCreateWithoutModelsInput>
    connectOrCreate?: BrandCreateOrConnectWithoutModelsInput
    connect?: BrandWhereUniqueInput
  }

  export type VersionCreateNestedManyWithoutModelInput = {
    create?: XOR<VersionCreateWithoutModelInput, VersionUncheckedCreateWithoutModelInput> | VersionCreateWithoutModelInput[] | VersionUncheckedCreateWithoutModelInput[]
    connectOrCreate?: VersionCreateOrConnectWithoutModelInput | VersionCreateOrConnectWithoutModelInput[]
    createMany?: VersionCreateManyModelInputEnvelope
    connect?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
  }

  export type FavoriteCreateNestedManyWithoutModelInput = {
    create?: XOR<FavoriteCreateWithoutModelInput, FavoriteUncheckedCreateWithoutModelInput> | FavoriteCreateWithoutModelInput[] | FavoriteUncheckedCreateWithoutModelInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutModelInput | FavoriteCreateOrConnectWithoutModelInput[]
    createMany?: FavoriteCreateManyModelInputEnvelope
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
  }

  export type VersionUncheckedCreateNestedManyWithoutModelInput = {
    create?: XOR<VersionCreateWithoutModelInput, VersionUncheckedCreateWithoutModelInput> | VersionCreateWithoutModelInput[] | VersionUncheckedCreateWithoutModelInput[]
    connectOrCreate?: VersionCreateOrConnectWithoutModelInput | VersionCreateOrConnectWithoutModelInput[]
    createMany?: VersionCreateManyModelInputEnvelope
    connect?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
  }

  export type FavoriteUncheckedCreateNestedManyWithoutModelInput = {
    create?: XOR<FavoriteCreateWithoutModelInput, FavoriteUncheckedCreateWithoutModelInput> | FavoriteCreateWithoutModelInput[] | FavoriteUncheckedCreateWithoutModelInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutModelInput | FavoriteCreateOrConnectWithoutModelInput[]
    createMany?: FavoriteCreateManyModelInputEnvelope
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
  }

  export type BrandUpdateOneRequiredWithoutModelsNestedInput = {
    create?: XOR<BrandCreateWithoutModelsInput, BrandUncheckedCreateWithoutModelsInput>
    connectOrCreate?: BrandCreateOrConnectWithoutModelsInput
    upsert?: BrandUpsertWithoutModelsInput
    connect?: BrandWhereUniqueInput
    update?: XOR<XOR<BrandUpdateToOneWithWhereWithoutModelsInput, BrandUpdateWithoutModelsInput>, BrandUncheckedUpdateWithoutModelsInput>
  }

  export type VersionUpdateManyWithoutModelNestedInput = {
    create?: XOR<VersionCreateWithoutModelInput, VersionUncheckedCreateWithoutModelInput> | VersionCreateWithoutModelInput[] | VersionUncheckedCreateWithoutModelInput[]
    connectOrCreate?: VersionCreateOrConnectWithoutModelInput | VersionCreateOrConnectWithoutModelInput[]
    upsert?: VersionUpsertWithWhereUniqueWithoutModelInput | VersionUpsertWithWhereUniqueWithoutModelInput[]
    createMany?: VersionCreateManyModelInputEnvelope
    set?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
    disconnect?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
    delete?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
    connect?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
    update?: VersionUpdateWithWhereUniqueWithoutModelInput | VersionUpdateWithWhereUniqueWithoutModelInput[]
    updateMany?: VersionUpdateManyWithWhereWithoutModelInput | VersionUpdateManyWithWhereWithoutModelInput[]
    deleteMany?: VersionScalarWhereInput | VersionScalarWhereInput[]
  }

  export type FavoriteUpdateManyWithoutModelNestedInput = {
    create?: XOR<FavoriteCreateWithoutModelInput, FavoriteUncheckedCreateWithoutModelInput> | FavoriteCreateWithoutModelInput[] | FavoriteUncheckedCreateWithoutModelInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutModelInput | FavoriteCreateOrConnectWithoutModelInput[]
    upsert?: FavoriteUpsertWithWhereUniqueWithoutModelInput | FavoriteUpsertWithWhereUniqueWithoutModelInput[]
    createMany?: FavoriteCreateManyModelInputEnvelope
    set?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    disconnect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    delete?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    update?: FavoriteUpdateWithWhereUniqueWithoutModelInput | FavoriteUpdateWithWhereUniqueWithoutModelInput[]
    updateMany?: FavoriteUpdateManyWithWhereWithoutModelInput | FavoriteUpdateManyWithWhereWithoutModelInput[]
    deleteMany?: FavoriteScalarWhereInput | FavoriteScalarWhereInput[]
  }

  export type VersionUncheckedUpdateManyWithoutModelNestedInput = {
    create?: XOR<VersionCreateWithoutModelInput, VersionUncheckedCreateWithoutModelInput> | VersionCreateWithoutModelInput[] | VersionUncheckedCreateWithoutModelInput[]
    connectOrCreate?: VersionCreateOrConnectWithoutModelInput | VersionCreateOrConnectWithoutModelInput[]
    upsert?: VersionUpsertWithWhereUniqueWithoutModelInput | VersionUpsertWithWhereUniqueWithoutModelInput[]
    createMany?: VersionCreateManyModelInputEnvelope
    set?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
    disconnect?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
    delete?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
    connect?: VersionWhereUniqueInput | VersionWhereUniqueInput[]
    update?: VersionUpdateWithWhereUniqueWithoutModelInput | VersionUpdateWithWhereUniqueWithoutModelInput[]
    updateMany?: VersionUpdateManyWithWhereWithoutModelInput | VersionUpdateManyWithWhereWithoutModelInput[]
    deleteMany?: VersionScalarWhereInput | VersionScalarWhereInput[]
  }

  export type FavoriteUncheckedUpdateManyWithoutModelNestedInput = {
    create?: XOR<FavoriteCreateWithoutModelInput, FavoriteUncheckedCreateWithoutModelInput> | FavoriteCreateWithoutModelInput[] | FavoriteUncheckedCreateWithoutModelInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutModelInput | FavoriteCreateOrConnectWithoutModelInput[]
    upsert?: FavoriteUpsertWithWhereUniqueWithoutModelInput | FavoriteUpsertWithWhereUniqueWithoutModelInput[]
    createMany?: FavoriteCreateManyModelInputEnvelope
    set?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    disconnect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    delete?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    update?: FavoriteUpdateWithWhereUniqueWithoutModelInput | FavoriteUpdateWithWhereUniqueWithoutModelInput[]
    updateMany?: FavoriteUpdateManyWithWhereWithoutModelInput | FavoriteUpdateManyWithWhereWithoutModelInput[]
    deleteMany?: FavoriteScalarWhereInput | FavoriteScalarWhereInput[]
  }

  export type ModelCreateNestedOneWithoutVersionsInput = {
    create?: XOR<ModelCreateWithoutVersionsInput, ModelUncheckedCreateWithoutVersionsInput>
    connectOrCreate?: ModelCreateOrConnectWithoutVersionsInput
    connect?: ModelWhereUniqueInput
  }

  export type VersionEquipmentCreateNestedManyWithoutVersionInput = {
    create?: XOR<VersionEquipmentCreateWithoutVersionInput, VersionEquipmentUncheckedCreateWithoutVersionInput> | VersionEquipmentCreateWithoutVersionInput[] | VersionEquipmentUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: VersionEquipmentCreateOrConnectWithoutVersionInput | VersionEquipmentCreateOrConnectWithoutVersionInput[]
    createMany?: VersionEquipmentCreateManyVersionInputEnvelope
    connect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
  }

  export type MaintenanceCostCreateNestedManyWithoutVersionInput = {
    create?: XOR<MaintenanceCostCreateWithoutVersionInput, MaintenanceCostUncheckedCreateWithoutVersionInput> | MaintenanceCostCreateWithoutVersionInput[] | MaintenanceCostUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: MaintenanceCostCreateOrConnectWithoutVersionInput | MaintenanceCostCreateOrConnectWithoutVersionInput[]
    createMany?: MaintenanceCostCreateManyVersionInputEnvelope
    connect?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
  }

  export type ComparisonItemCreateNestedManyWithoutVersionInput = {
    create?: XOR<ComparisonItemCreateWithoutVersionInput, ComparisonItemUncheckedCreateWithoutVersionInput> | ComparisonItemCreateWithoutVersionInput[] | ComparisonItemUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: ComparisonItemCreateOrConnectWithoutVersionInput | ComparisonItemCreateOrConnectWithoutVersionInput[]
    createMany?: ComparisonItemCreateManyVersionInputEnvelope
    connect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
  }

  export type FavoriteCreateNestedManyWithoutVersionInput = {
    create?: XOR<FavoriteCreateWithoutVersionInput, FavoriteUncheckedCreateWithoutVersionInput> | FavoriteCreateWithoutVersionInput[] | FavoriteUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutVersionInput | FavoriteCreateOrConnectWithoutVersionInput[]
    createMany?: FavoriteCreateManyVersionInputEnvelope
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
  }

  export type VersionEquipmentUncheckedCreateNestedManyWithoutVersionInput = {
    create?: XOR<VersionEquipmentCreateWithoutVersionInput, VersionEquipmentUncheckedCreateWithoutVersionInput> | VersionEquipmentCreateWithoutVersionInput[] | VersionEquipmentUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: VersionEquipmentCreateOrConnectWithoutVersionInput | VersionEquipmentCreateOrConnectWithoutVersionInput[]
    createMany?: VersionEquipmentCreateManyVersionInputEnvelope
    connect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
  }

  export type MaintenanceCostUncheckedCreateNestedManyWithoutVersionInput = {
    create?: XOR<MaintenanceCostCreateWithoutVersionInput, MaintenanceCostUncheckedCreateWithoutVersionInput> | MaintenanceCostCreateWithoutVersionInput[] | MaintenanceCostUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: MaintenanceCostCreateOrConnectWithoutVersionInput | MaintenanceCostCreateOrConnectWithoutVersionInput[]
    createMany?: MaintenanceCostCreateManyVersionInputEnvelope
    connect?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
  }

  export type ComparisonItemUncheckedCreateNestedManyWithoutVersionInput = {
    create?: XOR<ComparisonItemCreateWithoutVersionInput, ComparisonItemUncheckedCreateWithoutVersionInput> | ComparisonItemCreateWithoutVersionInput[] | ComparisonItemUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: ComparisonItemCreateOrConnectWithoutVersionInput | ComparisonItemCreateOrConnectWithoutVersionInput[]
    createMany?: ComparisonItemCreateManyVersionInputEnvelope
    connect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
  }

  export type FavoriteUncheckedCreateNestedManyWithoutVersionInput = {
    create?: XOR<FavoriteCreateWithoutVersionInput, FavoriteUncheckedCreateWithoutVersionInput> | FavoriteCreateWithoutVersionInput[] | FavoriteUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutVersionInput | FavoriteCreateOrConnectWithoutVersionInput[]
    createMany?: FavoriteCreateManyVersionInputEnvelope
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type FloatFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type ModelUpdateOneRequiredWithoutVersionsNestedInput = {
    create?: XOR<ModelCreateWithoutVersionsInput, ModelUncheckedCreateWithoutVersionsInput>
    connectOrCreate?: ModelCreateOrConnectWithoutVersionsInput
    upsert?: ModelUpsertWithoutVersionsInput
    connect?: ModelWhereUniqueInput
    update?: XOR<XOR<ModelUpdateToOneWithWhereWithoutVersionsInput, ModelUpdateWithoutVersionsInput>, ModelUncheckedUpdateWithoutVersionsInput>
  }

  export type VersionEquipmentUpdateManyWithoutVersionNestedInput = {
    create?: XOR<VersionEquipmentCreateWithoutVersionInput, VersionEquipmentUncheckedCreateWithoutVersionInput> | VersionEquipmentCreateWithoutVersionInput[] | VersionEquipmentUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: VersionEquipmentCreateOrConnectWithoutVersionInput | VersionEquipmentCreateOrConnectWithoutVersionInput[]
    upsert?: VersionEquipmentUpsertWithWhereUniqueWithoutVersionInput | VersionEquipmentUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: VersionEquipmentCreateManyVersionInputEnvelope
    set?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    disconnect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    delete?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    connect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    update?: VersionEquipmentUpdateWithWhereUniqueWithoutVersionInput | VersionEquipmentUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: VersionEquipmentUpdateManyWithWhereWithoutVersionInput | VersionEquipmentUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: VersionEquipmentScalarWhereInput | VersionEquipmentScalarWhereInput[]
  }

  export type MaintenanceCostUpdateManyWithoutVersionNestedInput = {
    create?: XOR<MaintenanceCostCreateWithoutVersionInput, MaintenanceCostUncheckedCreateWithoutVersionInput> | MaintenanceCostCreateWithoutVersionInput[] | MaintenanceCostUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: MaintenanceCostCreateOrConnectWithoutVersionInput | MaintenanceCostCreateOrConnectWithoutVersionInput[]
    upsert?: MaintenanceCostUpsertWithWhereUniqueWithoutVersionInput | MaintenanceCostUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: MaintenanceCostCreateManyVersionInputEnvelope
    set?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
    disconnect?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
    delete?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
    connect?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
    update?: MaintenanceCostUpdateWithWhereUniqueWithoutVersionInput | MaintenanceCostUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: MaintenanceCostUpdateManyWithWhereWithoutVersionInput | MaintenanceCostUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: MaintenanceCostScalarWhereInput | MaintenanceCostScalarWhereInput[]
  }

  export type ComparisonItemUpdateManyWithoutVersionNestedInput = {
    create?: XOR<ComparisonItemCreateWithoutVersionInput, ComparisonItemUncheckedCreateWithoutVersionInput> | ComparisonItemCreateWithoutVersionInput[] | ComparisonItemUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: ComparisonItemCreateOrConnectWithoutVersionInput | ComparisonItemCreateOrConnectWithoutVersionInput[]
    upsert?: ComparisonItemUpsertWithWhereUniqueWithoutVersionInput | ComparisonItemUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: ComparisonItemCreateManyVersionInputEnvelope
    set?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    disconnect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    delete?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    connect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    update?: ComparisonItemUpdateWithWhereUniqueWithoutVersionInput | ComparisonItemUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: ComparisonItemUpdateManyWithWhereWithoutVersionInput | ComparisonItemUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: ComparisonItemScalarWhereInput | ComparisonItemScalarWhereInput[]
  }

  export type FavoriteUpdateManyWithoutVersionNestedInput = {
    create?: XOR<FavoriteCreateWithoutVersionInput, FavoriteUncheckedCreateWithoutVersionInput> | FavoriteCreateWithoutVersionInput[] | FavoriteUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutVersionInput | FavoriteCreateOrConnectWithoutVersionInput[]
    upsert?: FavoriteUpsertWithWhereUniqueWithoutVersionInput | FavoriteUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: FavoriteCreateManyVersionInputEnvelope
    set?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    disconnect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    delete?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    update?: FavoriteUpdateWithWhereUniqueWithoutVersionInput | FavoriteUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: FavoriteUpdateManyWithWhereWithoutVersionInput | FavoriteUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: FavoriteScalarWhereInput | FavoriteScalarWhereInput[]
  }

  export type VersionEquipmentUncheckedUpdateManyWithoutVersionNestedInput = {
    create?: XOR<VersionEquipmentCreateWithoutVersionInput, VersionEquipmentUncheckedCreateWithoutVersionInput> | VersionEquipmentCreateWithoutVersionInput[] | VersionEquipmentUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: VersionEquipmentCreateOrConnectWithoutVersionInput | VersionEquipmentCreateOrConnectWithoutVersionInput[]
    upsert?: VersionEquipmentUpsertWithWhereUniqueWithoutVersionInput | VersionEquipmentUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: VersionEquipmentCreateManyVersionInputEnvelope
    set?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    disconnect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    delete?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    connect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    update?: VersionEquipmentUpdateWithWhereUniqueWithoutVersionInput | VersionEquipmentUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: VersionEquipmentUpdateManyWithWhereWithoutVersionInput | VersionEquipmentUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: VersionEquipmentScalarWhereInput | VersionEquipmentScalarWhereInput[]
  }

  export type MaintenanceCostUncheckedUpdateManyWithoutVersionNestedInput = {
    create?: XOR<MaintenanceCostCreateWithoutVersionInput, MaintenanceCostUncheckedCreateWithoutVersionInput> | MaintenanceCostCreateWithoutVersionInput[] | MaintenanceCostUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: MaintenanceCostCreateOrConnectWithoutVersionInput | MaintenanceCostCreateOrConnectWithoutVersionInput[]
    upsert?: MaintenanceCostUpsertWithWhereUniqueWithoutVersionInput | MaintenanceCostUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: MaintenanceCostCreateManyVersionInputEnvelope
    set?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
    disconnect?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
    delete?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
    connect?: MaintenanceCostWhereUniqueInput | MaintenanceCostWhereUniqueInput[]
    update?: MaintenanceCostUpdateWithWhereUniqueWithoutVersionInput | MaintenanceCostUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: MaintenanceCostUpdateManyWithWhereWithoutVersionInput | MaintenanceCostUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: MaintenanceCostScalarWhereInput | MaintenanceCostScalarWhereInput[]
  }

  export type ComparisonItemUncheckedUpdateManyWithoutVersionNestedInput = {
    create?: XOR<ComparisonItemCreateWithoutVersionInput, ComparisonItemUncheckedCreateWithoutVersionInput> | ComparisonItemCreateWithoutVersionInput[] | ComparisonItemUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: ComparisonItemCreateOrConnectWithoutVersionInput | ComparisonItemCreateOrConnectWithoutVersionInput[]
    upsert?: ComparisonItemUpsertWithWhereUniqueWithoutVersionInput | ComparisonItemUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: ComparisonItemCreateManyVersionInputEnvelope
    set?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    disconnect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    delete?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    connect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    update?: ComparisonItemUpdateWithWhereUniqueWithoutVersionInput | ComparisonItemUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: ComparisonItemUpdateManyWithWhereWithoutVersionInput | ComparisonItemUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: ComparisonItemScalarWhereInput | ComparisonItemScalarWhereInput[]
  }

  export type FavoriteUncheckedUpdateManyWithoutVersionNestedInput = {
    create?: XOR<FavoriteCreateWithoutVersionInput, FavoriteUncheckedCreateWithoutVersionInput> | FavoriteCreateWithoutVersionInput[] | FavoriteUncheckedCreateWithoutVersionInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutVersionInput | FavoriteCreateOrConnectWithoutVersionInput[]
    upsert?: FavoriteUpsertWithWhereUniqueWithoutVersionInput | FavoriteUpsertWithWhereUniqueWithoutVersionInput[]
    createMany?: FavoriteCreateManyVersionInputEnvelope
    set?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    disconnect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    delete?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    update?: FavoriteUpdateWithWhereUniqueWithoutVersionInput | FavoriteUpdateWithWhereUniqueWithoutVersionInput[]
    updateMany?: FavoriteUpdateManyWithWhereWithoutVersionInput | FavoriteUpdateManyWithWhereWithoutVersionInput[]
    deleteMany?: FavoriteScalarWhereInput | FavoriteScalarWhereInput[]
  }

  export type VersionEquipmentCreateNestedManyWithoutEquipmentItemInput = {
    create?: XOR<VersionEquipmentCreateWithoutEquipmentItemInput, VersionEquipmentUncheckedCreateWithoutEquipmentItemInput> | VersionEquipmentCreateWithoutEquipmentItemInput[] | VersionEquipmentUncheckedCreateWithoutEquipmentItemInput[]
    connectOrCreate?: VersionEquipmentCreateOrConnectWithoutEquipmentItemInput | VersionEquipmentCreateOrConnectWithoutEquipmentItemInput[]
    createMany?: VersionEquipmentCreateManyEquipmentItemInputEnvelope
    connect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
  }

  export type VersionEquipmentUncheckedCreateNestedManyWithoutEquipmentItemInput = {
    create?: XOR<VersionEquipmentCreateWithoutEquipmentItemInput, VersionEquipmentUncheckedCreateWithoutEquipmentItemInput> | VersionEquipmentCreateWithoutEquipmentItemInput[] | VersionEquipmentUncheckedCreateWithoutEquipmentItemInput[]
    connectOrCreate?: VersionEquipmentCreateOrConnectWithoutEquipmentItemInput | VersionEquipmentCreateOrConnectWithoutEquipmentItemInput[]
    createMany?: VersionEquipmentCreateManyEquipmentItemInputEnvelope
    connect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
  }

  export type VersionEquipmentUpdateManyWithoutEquipmentItemNestedInput = {
    create?: XOR<VersionEquipmentCreateWithoutEquipmentItemInput, VersionEquipmentUncheckedCreateWithoutEquipmentItemInput> | VersionEquipmentCreateWithoutEquipmentItemInput[] | VersionEquipmentUncheckedCreateWithoutEquipmentItemInput[]
    connectOrCreate?: VersionEquipmentCreateOrConnectWithoutEquipmentItemInput | VersionEquipmentCreateOrConnectWithoutEquipmentItemInput[]
    upsert?: VersionEquipmentUpsertWithWhereUniqueWithoutEquipmentItemInput | VersionEquipmentUpsertWithWhereUniqueWithoutEquipmentItemInput[]
    createMany?: VersionEquipmentCreateManyEquipmentItemInputEnvelope
    set?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    disconnect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    delete?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    connect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    update?: VersionEquipmentUpdateWithWhereUniqueWithoutEquipmentItemInput | VersionEquipmentUpdateWithWhereUniqueWithoutEquipmentItemInput[]
    updateMany?: VersionEquipmentUpdateManyWithWhereWithoutEquipmentItemInput | VersionEquipmentUpdateManyWithWhereWithoutEquipmentItemInput[]
    deleteMany?: VersionEquipmentScalarWhereInput | VersionEquipmentScalarWhereInput[]
  }

  export type VersionEquipmentUncheckedUpdateManyWithoutEquipmentItemNestedInput = {
    create?: XOR<VersionEquipmentCreateWithoutEquipmentItemInput, VersionEquipmentUncheckedCreateWithoutEquipmentItemInput> | VersionEquipmentCreateWithoutEquipmentItemInput[] | VersionEquipmentUncheckedCreateWithoutEquipmentItemInput[]
    connectOrCreate?: VersionEquipmentCreateOrConnectWithoutEquipmentItemInput | VersionEquipmentCreateOrConnectWithoutEquipmentItemInput[]
    upsert?: VersionEquipmentUpsertWithWhereUniqueWithoutEquipmentItemInput | VersionEquipmentUpsertWithWhereUniqueWithoutEquipmentItemInput[]
    createMany?: VersionEquipmentCreateManyEquipmentItemInputEnvelope
    set?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    disconnect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    delete?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    connect?: VersionEquipmentWhereUniqueInput | VersionEquipmentWhereUniqueInput[]
    update?: VersionEquipmentUpdateWithWhereUniqueWithoutEquipmentItemInput | VersionEquipmentUpdateWithWhereUniqueWithoutEquipmentItemInput[]
    updateMany?: VersionEquipmentUpdateManyWithWhereWithoutEquipmentItemInput | VersionEquipmentUpdateManyWithWhereWithoutEquipmentItemInput[]
    deleteMany?: VersionEquipmentScalarWhereInput | VersionEquipmentScalarWhereInput[]
  }

  export type VersionCreateNestedOneWithoutEquipmentItemsInput = {
    create?: XOR<VersionCreateWithoutEquipmentItemsInput, VersionUncheckedCreateWithoutEquipmentItemsInput>
    connectOrCreate?: VersionCreateOrConnectWithoutEquipmentItemsInput
    connect?: VersionWhereUniqueInput
  }

  export type EquipmentItemCreateNestedOneWithoutVersionsInput = {
    create?: XOR<EquipmentItemCreateWithoutVersionsInput, EquipmentItemUncheckedCreateWithoutVersionsInput>
    connectOrCreate?: EquipmentItemCreateOrConnectWithoutVersionsInput
    connect?: EquipmentItemWhereUniqueInput
  }

  export type VersionUpdateOneRequiredWithoutEquipmentItemsNestedInput = {
    create?: XOR<VersionCreateWithoutEquipmentItemsInput, VersionUncheckedCreateWithoutEquipmentItemsInput>
    connectOrCreate?: VersionCreateOrConnectWithoutEquipmentItemsInput
    upsert?: VersionUpsertWithoutEquipmentItemsInput
    connect?: VersionWhereUniqueInput
    update?: XOR<XOR<VersionUpdateToOneWithWhereWithoutEquipmentItemsInput, VersionUpdateWithoutEquipmentItemsInput>, VersionUncheckedUpdateWithoutEquipmentItemsInput>
  }

  export type EquipmentItemUpdateOneRequiredWithoutVersionsNestedInput = {
    create?: XOR<EquipmentItemCreateWithoutVersionsInput, EquipmentItemUncheckedCreateWithoutVersionsInput>
    connectOrCreate?: EquipmentItemCreateOrConnectWithoutVersionsInput
    upsert?: EquipmentItemUpsertWithoutVersionsInput
    connect?: EquipmentItemWhereUniqueInput
    update?: XOR<XOR<EquipmentItemUpdateToOneWithWhereWithoutVersionsInput, EquipmentItemUpdateWithoutVersionsInput>, EquipmentItemUncheckedUpdateWithoutVersionsInput>
  }

  export type VersionCreateNestedOneWithoutMaintenanceCostsInput = {
    create?: XOR<VersionCreateWithoutMaintenanceCostsInput, VersionUncheckedCreateWithoutMaintenanceCostsInput>
    connectOrCreate?: VersionCreateOrConnectWithoutMaintenanceCostsInput
    connect?: VersionWhereUniqueInput
  }

  export type VersionUpdateOneRequiredWithoutMaintenanceCostsNestedInput = {
    create?: XOR<VersionCreateWithoutMaintenanceCostsInput, VersionUncheckedCreateWithoutMaintenanceCostsInput>
    connectOrCreate?: VersionCreateOrConnectWithoutMaintenanceCostsInput
    upsert?: VersionUpsertWithoutMaintenanceCostsInput
    connect?: VersionWhereUniqueInput
    update?: XOR<XOR<VersionUpdateToOneWithWhereWithoutMaintenanceCostsInput, VersionUpdateWithoutMaintenanceCostsInput>, VersionUncheckedUpdateWithoutMaintenanceCostsInput>
  }

  export type ComparisonCreateNestedManyWithoutUserInput = {
    create?: XOR<ComparisonCreateWithoutUserInput, ComparisonUncheckedCreateWithoutUserInput> | ComparisonCreateWithoutUserInput[] | ComparisonUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ComparisonCreateOrConnectWithoutUserInput | ComparisonCreateOrConnectWithoutUserInput[]
    createMany?: ComparisonCreateManyUserInputEnvelope
    connect?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
  }

  export type FavoriteCreateNestedManyWithoutUserInput = {
    create?: XOR<FavoriteCreateWithoutUserInput, FavoriteUncheckedCreateWithoutUserInput> | FavoriteCreateWithoutUserInput[] | FavoriteUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutUserInput | FavoriteCreateOrConnectWithoutUserInput[]
    createMany?: FavoriteCreateManyUserInputEnvelope
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
  }

  export type ComparisonUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<ComparisonCreateWithoutUserInput, ComparisonUncheckedCreateWithoutUserInput> | ComparisonCreateWithoutUserInput[] | ComparisonUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ComparisonCreateOrConnectWithoutUserInput | ComparisonCreateOrConnectWithoutUserInput[]
    createMany?: ComparisonCreateManyUserInputEnvelope
    connect?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
  }

  export type FavoriteUncheckedCreateNestedManyWithoutUserInput = {
    create?: XOR<FavoriteCreateWithoutUserInput, FavoriteUncheckedCreateWithoutUserInput> | FavoriteCreateWithoutUserInput[] | FavoriteUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutUserInput | FavoriteCreateOrConnectWithoutUserInput[]
    createMany?: FavoriteCreateManyUserInputEnvelope
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
  }

  export type ComparisonUpdateManyWithoutUserNestedInput = {
    create?: XOR<ComparisonCreateWithoutUserInput, ComparisonUncheckedCreateWithoutUserInput> | ComparisonCreateWithoutUserInput[] | ComparisonUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ComparisonCreateOrConnectWithoutUserInput | ComparisonCreateOrConnectWithoutUserInput[]
    upsert?: ComparisonUpsertWithWhereUniqueWithoutUserInput | ComparisonUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ComparisonCreateManyUserInputEnvelope
    set?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
    disconnect?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
    delete?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
    connect?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
    update?: ComparisonUpdateWithWhereUniqueWithoutUserInput | ComparisonUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ComparisonUpdateManyWithWhereWithoutUserInput | ComparisonUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ComparisonScalarWhereInput | ComparisonScalarWhereInput[]
  }

  export type FavoriteUpdateManyWithoutUserNestedInput = {
    create?: XOR<FavoriteCreateWithoutUserInput, FavoriteUncheckedCreateWithoutUserInput> | FavoriteCreateWithoutUserInput[] | FavoriteUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutUserInput | FavoriteCreateOrConnectWithoutUserInput[]
    upsert?: FavoriteUpsertWithWhereUniqueWithoutUserInput | FavoriteUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: FavoriteCreateManyUserInputEnvelope
    set?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    disconnect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    delete?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    update?: FavoriteUpdateWithWhereUniqueWithoutUserInput | FavoriteUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: FavoriteUpdateManyWithWhereWithoutUserInput | FavoriteUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: FavoriteScalarWhereInput | FavoriteScalarWhereInput[]
  }

  export type ComparisonUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<ComparisonCreateWithoutUserInput, ComparisonUncheckedCreateWithoutUserInput> | ComparisonCreateWithoutUserInput[] | ComparisonUncheckedCreateWithoutUserInput[]
    connectOrCreate?: ComparisonCreateOrConnectWithoutUserInput | ComparisonCreateOrConnectWithoutUserInput[]
    upsert?: ComparisonUpsertWithWhereUniqueWithoutUserInput | ComparisonUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: ComparisonCreateManyUserInputEnvelope
    set?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
    disconnect?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
    delete?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
    connect?: ComparisonWhereUniqueInput | ComparisonWhereUniqueInput[]
    update?: ComparisonUpdateWithWhereUniqueWithoutUserInput | ComparisonUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: ComparisonUpdateManyWithWhereWithoutUserInput | ComparisonUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: ComparisonScalarWhereInput | ComparisonScalarWhereInput[]
  }

  export type FavoriteUncheckedUpdateManyWithoutUserNestedInput = {
    create?: XOR<FavoriteCreateWithoutUserInput, FavoriteUncheckedCreateWithoutUserInput> | FavoriteCreateWithoutUserInput[] | FavoriteUncheckedCreateWithoutUserInput[]
    connectOrCreate?: FavoriteCreateOrConnectWithoutUserInput | FavoriteCreateOrConnectWithoutUserInput[]
    upsert?: FavoriteUpsertWithWhereUniqueWithoutUserInput | FavoriteUpsertWithWhereUniqueWithoutUserInput[]
    createMany?: FavoriteCreateManyUserInputEnvelope
    set?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    disconnect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    delete?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    connect?: FavoriteWhereUniqueInput | FavoriteWhereUniqueInput[]
    update?: FavoriteUpdateWithWhereUniqueWithoutUserInput | FavoriteUpdateWithWhereUniqueWithoutUserInput[]
    updateMany?: FavoriteUpdateManyWithWhereWithoutUserInput | FavoriteUpdateManyWithWhereWithoutUserInput[]
    deleteMany?: FavoriteScalarWhereInput | FavoriteScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutComparisonsInput = {
    create?: XOR<UserCreateWithoutComparisonsInput, UserUncheckedCreateWithoutComparisonsInput>
    connectOrCreate?: UserCreateOrConnectWithoutComparisonsInput
    connect?: UserWhereUniqueInput
  }

  export type ComparisonItemCreateNestedManyWithoutComparisonInput = {
    create?: XOR<ComparisonItemCreateWithoutComparisonInput, ComparisonItemUncheckedCreateWithoutComparisonInput> | ComparisonItemCreateWithoutComparisonInput[] | ComparisonItemUncheckedCreateWithoutComparisonInput[]
    connectOrCreate?: ComparisonItemCreateOrConnectWithoutComparisonInput | ComparisonItemCreateOrConnectWithoutComparisonInput[]
    createMany?: ComparisonItemCreateManyComparisonInputEnvelope
    connect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
  }

  export type ComparisonItemUncheckedCreateNestedManyWithoutComparisonInput = {
    create?: XOR<ComparisonItemCreateWithoutComparisonInput, ComparisonItemUncheckedCreateWithoutComparisonInput> | ComparisonItemCreateWithoutComparisonInput[] | ComparisonItemUncheckedCreateWithoutComparisonInput[]
    connectOrCreate?: ComparisonItemCreateOrConnectWithoutComparisonInput | ComparisonItemCreateOrConnectWithoutComparisonInput[]
    createMany?: ComparisonItemCreateManyComparisonInputEnvelope
    connect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
  }

  export type UserUpdateOneRequiredWithoutComparisonsNestedInput = {
    create?: XOR<UserCreateWithoutComparisonsInput, UserUncheckedCreateWithoutComparisonsInput>
    connectOrCreate?: UserCreateOrConnectWithoutComparisonsInput
    upsert?: UserUpsertWithoutComparisonsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutComparisonsInput, UserUpdateWithoutComparisonsInput>, UserUncheckedUpdateWithoutComparisonsInput>
  }

  export type ComparisonItemUpdateManyWithoutComparisonNestedInput = {
    create?: XOR<ComparisonItemCreateWithoutComparisonInput, ComparisonItemUncheckedCreateWithoutComparisonInput> | ComparisonItemCreateWithoutComparisonInput[] | ComparisonItemUncheckedCreateWithoutComparisonInput[]
    connectOrCreate?: ComparisonItemCreateOrConnectWithoutComparisonInput | ComparisonItemCreateOrConnectWithoutComparisonInput[]
    upsert?: ComparisonItemUpsertWithWhereUniqueWithoutComparisonInput | ComparisonItemUpsertWithWhereUniqueWithoutComparisonInput[]
    createMany?: ComparisonItemCreateManyComparisonInputEnvelope
    set?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    disconnect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    delete?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    connect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    update?: ComparisonItemUpdateWithWhereUniqueWithoutComparisonInput | ComparisonItemUpdateWithWhereUniqueWithoutComparisonInput[]
    updateMany?: ComparisonItemUpdateManyWithWhereWithoutComparisonInput | ComparisonItemUpdateManyWithWhereWithoutComparisonInput[]
    deleteMany?: ComparisonItemScalarWhereInput | ComparisonItemScalarWhereInput[]
  }

  export type ComparisonItemUncheckedUpdateManyWithoutComparisonNestedInput = {
    create?: XOR<ComparisonItemCreateWithoutComparisonInput, ComparisonItemUncheckedCreateWithoutComparisonInput> | ComparisonItemCreateWithoutComparisonInput[] | ComparisonItemUncheckedCreateWithoutComparisonInput[]
    connectOrCreate?: ComparisonItemCreateOrConnectWithoutComparisonInput | ComparisonItemCreateOrConnectWithoutComparisonInput[]
    upsert?: ComparisonItemUpsertWithWhereUniqueWithoutComparisonInput | ComparisonItemUpsertWithWhereUniqueWithoutComparisonInput[]
    createMany?: ComparisonItemCreateManyComparisonInputEnvelope
    set?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    disconnect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    delete?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    connect?: ComparisonItemWhereUniqueInput | ComparisonItemWhereUniqueInput[]
    update?: ComparisonItemUpdateWithWhereUniqueWithoutComparisonInput | ComparisonItemUpdateWithWhereUniqueWithoutComparisonInput[]
    updateMany?: ComparisonItemUpdateManyWithWhereWithoutComparisonInput | ComparisonItemUpdateManyWithWhereWithoutComparisonInput[]
    deleteMany?: ComparisonItemScalarWhereInput | ComparisonItemScalarWhereInput[]
  }

  export type ComparisonCreateNestedOneWithoutItemsInput = {
    create?: XOR<ComparisonCreateWithoutItemsInput, ComparisonUncheckedCreateWithoutItemsInput>
    connectOrCreate?: ComparisonCreateOrConnectWithoutItemsInput
    connect?: ComparisonWhereUniqueInput
  }

  export type VersionCreateNestedOneWithoutComparisonItemsInput = {
    create?: XOR<VersionCreateWithoutComparisonItemsInput, VersionUncheckedCreateWithoutComparisonItemsInput>
    connectOrCreate?: VersionCreateOrConnectWithoutComparisonItemsInput
    connect?: VersionWhereUniqueInput
  }

  export type ComparisonUpdateOneRequiredWithoutItemsNestedInput = {
    create?: XOR<ComparisonCreateWithoutItemsInput, ComparisonUncheckedCreateWithoutItemsInput>
    connectOrCreate?: ComparisonCreateOrConnectWithoutItemsInput
    upsert?: ComparisonUpsertWithoutItemsInput
    connect?: ComparisonWhereUniqueInput
    update?: XOR<XOR<ComparisonUpdateToOneWithWhereWithoutItemsInput, ComparisonUpdateWithoutItemsInput>, ComparisonUncheckedUpdateWithoutItemsInput>
  }

  export type VersionUpdateOneRequiredWithoutComparisonItemsNestedInput = {
    create?: XOR<VersionCreateWithoutComparisonItemsInput, VersionUncheckedCreateWithoutComparisonItemsInput>
    connectOrCreate?: VersionCreateOrConnectWithoutComparisonItemsInput
    upsert?: VersionUpsertWithoutComparisonItemsInput
    connect?: VersionWhereUniqueInput
    update?: XOR<XOR<VersionUpdateToOneWithWhereWithoutComparisonItemsInput, VersionUpdateWithoutComparisonItemsInput>, VersionUncheckedUpdateWithoutComparisonItemsInput>
  }

  export type UserCreateNestedOneWithoutFavoritesInput = {
    create?: XOR<UserCreateWithoutFavoritesInput, UserUncheckedCreateWithoutFavoritesInput>
    connectOrCreate?: UserCreateOrConnectWithoutFavoritesInput
    connect?: UserWhereUniqueInput
  }

  export type ModelCreateNestedOneWithoutFavoritesInput = {
    create?: XOR<ModelCreateWithoutFavoritesInput, ModelUncheckedCreateWithoutFavoritesInput>
    connectOrCreate?: ModelCreateOrConnectWithoutFavoritesInput
    connect?: ModelWhereUniqueInput
  }

  export type VersionCreateNestedOneWithoutFavoritesInput = {
    create?: XOR<VersionCreateWithoutFavoritesInput, VersionUncheckedCreateWithoutFavoritesInput>
    connectOrCreate?: VersionCreateOrConnectWithoutFavoritesInput
    connect?: VersionWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutFavoritesNestedInput = {
    create?: XOR<UserCreateWithoutFavoritesInput, UserUncheckedCreateWithoutFavoritesInput>
    connectOrCreate?: UserCreateOrConnectWithoutFavoritesInput
    upsert?: UserUpsertWithoutFavoritesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutFavoritesInput, UserUpdateWithoutFavoritesInput>, UserUncheckedUpdateWithoutFavoritesInput>
  }

  export type ModelUpdateOneRequiredWithoutFavoritesNestedInput = {
    create?: XOR<ModelCreateWithoutFavoritesInput, ModelUncheckedCreateWithoutFavoritesInput>
    connectOrCreate?: ModelCreateOrConnectWithoutFavoritesInput
    upsert?: ModelUpsertWithoutFavoritesInput
    connect?: ModelWhereUniqueInput
    update?: XOR<XOR<ModelUpdateToOneWithWhereWithoutFavoritesInput, ModelUpdateWithoutFavoritesInput>, ModelUncheckedUpdateWithoutFavoritesInput>
  }

  export type VersionUpdateOneRequiredWithoutFavoritesNestedInput = {
    create?: XOR<VersionCreateWithoutFavoritesInput, VersionUncheckedCreateWithoutFavoritesInput>
    connectOrCreate?: VersionCreateOrConnectWithoutFavoritesInput
    upsert?: VersionUpsertWithoutFavoritesInput
    connect?: VersionWhereUniqueInput
    update?: XOR<XOR<VersionUpdateToOneWithWhereWithoutFavoritesInput, VersionUpdateWithoutFavoritesInput>, VersionUncheckedUpdateWithoutFavoritesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> = 
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue
    lte?: InputJsonValue
    gt?: InputJsonValue
    gte?: InputJsonValue
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedFloatFilter<$PrismaModel>
    _min?: NestedFloatFilter<$PrismaModel>
    _max?: NestedFloatFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type ModelCreateWithoutBrandInput = {
    id?: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
    versions?: VersionCreateNestedManyWithoutModelInput
    favorites?: FavoriteCreateNestedManyWithoutModelInput
  }

  export type ModelUncheckedCreateWithoutBrandInput = {
    id?: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
    versions?: VersionUncheckedCreateNestedManyWithoutModelInput
    favorites?: FavoriteUncheckedCreateNestedManyWithoutModelInput
  }

  export type ModelCreateOrConnectWithoutBrandInput = {
    where: ModelWhereUniqueInput
    create: XOR<ModelCreateWithoutBrandInput, ModelUncheckedCreateWithoutBrandInput>
  }

  export type ModelCreateManyBrandInputEnvelope = {
    data: ModelCreateManyBrandInput | ModelCreateManyBrandInput[]
    skipDuplicates?: boolean
  }

  export type ModelUpsertWithWhereUniqueWithoutBrandInput = {
    where: ModelWhereUniqueInput
    update: XOR<ModelUpdateWithoutBrandInput, ModelUncheckedUpdateWithoutBrandInput>
    create: XOR<ModelCreateWithoutBrandInput, ModelUncheckedCreateWithoutBrandInput>
  }

  export type ModelUpdateWithWhereUniqueWithoutBrandInput = {
    where: ModelWhereUniqueInput
    data: XOR<ModelUpdateWithoutBrandInput, ModelUncheckedUpdateWithoutBrandInput>
  }

  export type ModelUpdateManyWithWhereWithoutBrandInput = {
    where: ModelScalarWhereInput
    data: XOR<ModelUpdateManyMutationInput, ModelUncheckedUpdateManyWithoutBrandInput>
  }

  export type ModelScalarWhereInput = {
    AND?: ModelScalarWhereInput | ModelScalarWhereInput[]
    OR?: ModelScalarWhereInput[]
    NOT?: ModelScalarWhereInput | ModelScalarWhereInput[]
    id?: StringFilter<"Model"> | string
    brandId?: StringFilter<"Model"> | string
    name?: StringFilter<"Model"> | string
    segment?: StringFilter<"Model"> | string
    imageUrl?: StringNullableFilter<"Model"> | string | null
    galleryUrls?: JsonFilter<"Model">
    deletedAt?: DateTimeNullableFilter<"Model"> | Date | string | null
    createdAt?: DateTimeFilter<"Model"> | Date | string
  }

  export type BrandCreateWithoutModelsInput = {
    id?: string
    name: string
    logoUrl?: string | null
    deletedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type BrandUncheckedCreateWithoutModelsInput = {
    id?: string
    name: string
    logoUrl?: string | null
    deletedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type BrandCreateOrConnectWithoutModelsInput = {
    where: BrandWhereUniqueInput
    create: XOR<BrandCreateWithoutModelsInput, BrandUncheckedCreateWithoutModelsInput>
  }

  export type VersionCreateWithoutModelInput = {
    id?: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    equipmentItems?: VersionEquipmentCreateNestedManyWithoutVersionInput
    maintenanceCosts?: MaintenanceCostCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemCreateNestedManyWithoutVersionInput
    favorites?: FavoriteCreateNestedManyWithoutVersionInput
  }

  export type VersionUncheckedCreateWithoutModelInput = {
    id?: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    equipmentItems?: VersionEquipmentUncheckedCreateNestedManyWithoutVersionInput
    maintenanceCosts?: MaintenanceCostUncheckedCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemUncheckedCreateNestedManyWithoutVersionInput
    favorites?: FavoriteUncheckedCreateNestedManyWithoutVersionInput
  }

  export type VersionCreateOrConnectWithoutModelInput = {
    where: VersionWhereUniqueInput
    create: XOR<VersionCreateWithoutModelInput, VersionUncheckedCreateWithoutModelInput>
  }

  export type VersionCreateManyModelInputEnvelope = {
    data: VersionCreateManyModelInput | VersionCreateManyModelInput[]
    skipDuplicates?: boolean
  }

  export type FavoriteCreateWithoutModelInput = {
    id?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutFavoritesInput
    version: VersionCreateNestedOneWithoutFavoritesInput
  }

  export type FavoriteUncheckedCreateWithoutModelInput = {
    id?: string
    userId: string
    versionId: string
    createdAt?: Date | string
  }

  export type FavoriteCreateOrConnectWithoutModelInput = {
    where: FavoriteWhereUniqueInput
    create: XOR<FavoriteCreateWithoutModelInput, FavoriteUncheckedCreateWithoutModelInput>
  }

  export type FavoriteCreateManyModelInputEnvelope = {
    data: FavoriteCreateManyModelInput | FavoriteCreateManyModelInput[]
    skipDuplicates?: boolean
  }

  export type BrandUpsertWithoutModelsInput = {
    update: XOR<BrandUpdateWithoutModelsInput, BrandUncheckedUpdateWithoutModelsInput>
    create: XOR<BrandCreateWithoutModelsInput, BrandUncheckedCreateWithoutModelsInput>
    where?: BrandWhereInput
  }

  export type BrandUpdateToOneWithWhereWithoutModelsInput = {
    where?: BrandWhereInput
    data: XOR<BrandUpdateWithoutModelsInput, BrandUncheckedUpdateWithoutModelsInput>
  }

  export type BrandUpdateWithoutModelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type BrandUncheckedUpdateWithoutModelsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    logoUrl?: NullableStringFieldUpdateOperationsInput | string | null
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionUpsertWithWhereUniqueWithoutModelInput = {
    where: VersionWhereUniqueInput
    update: XOR<VersionUpdateWithoutModelInput, VersionUncheckedUpdateWithoutModelInput>
    create: XOR<VersionCreateWithoutModelInput, VersionUncheckedCreateWithoutModelInput>
  }

  export type VersionUpdateWithWhereUniqueWithoutModelInput = {
    where: VersionWhereUniqueInput
    data: XOR<VersionUpdateWithoutModelInput, VersionUncheckedUpdateWithoutModelInput>
  }

  export type VersionUpdateManyWithWhereWithoutModelInput = {
    where: VersionScalarWhereInput
    data: XOR<VersionUpdateManyMutationInput, VersionUncheckedUpdateManyWithoutModelInput>
  }

  export type VersionScalarWhereInput = {
    AND?: VersionScalarWhereInput | VersionScalarWhereInput[]
    OR?: VersionScalarWhereInput[]
    NOT?: VersionScalarWhereInput | VersionScalarWhereInput[]
    id?: StringFilter<"Version"> | string
    modelId?: StringFilter<"Version"> | string
    name?: StringFilter<"Version"> | string
    year?: IntFilter<"Version"> | number
    priceClp?: IntFilter<"Version"> | number
    transmission?: StringFilter<"Version"> | string
    fuel?: StringFilter<"Version"> | string
    engineDisplacementCc?: IntFilter<"Version"> | number
    powerHp?: IntFilter<"Version"> | number
    torqueNm?: IntFilter<"Version"> | number
    consumptionCityKmL?: FloatFilter<"Version"> | number
    consumptionHighwayKmL?: FloatFilter<"Version"> | number
    lengthMm?: IntFilter<"Version"> | number
    widthMm?: IntFilter<"Version"> | number
    heightMm?: IntFilter<"Version"> | number
    weightKg?: IntFilter<"Version"> | number
    trunkLiters?: IntFilter<"Version"> | number
    airbagCount?: IntFilter<"Version"> | number
    hasAbs?: BoolFilter<"Version"> | boolean
    hasEsp?: BoolFilter<"Version"> | boolean
    hasCruiseControl?: BoolFilter<"Version"> | boolean
    deletedAt?: DateTimeNullableFilter<"Version"> | Date | string | null
    createdAt?: DateTimeFilter<"Version"> | Date | string
  }

  export type FavoriteUpsertWithWhereUniqueWithoutModelInput = {
    where: FavoriteWhereUniqueInput
    update: XOR<FavoriteUpdateWithoutModelInput, FavoriteUncheckedUpdateWithoutModelInput>
    create: XOR<FavoriteCreateWithoutModelInput, FavoriteUncheckedCreateWithoutModelInput>
  }

  export type FavoriteUpdateWithWhereUniqueWithoutModelInput = {
    where: FavoriteWhereUniqueInput
    data: XOR<FavoriteUpdateWithoutModelInput, FavoriteUncheckedUpdateWithoutModelInput>
  }

  export type FavoriteUpdateManyWithWhereWithoutModelInput = {
    where: FavoriteScalarWhereInput
    data: XOR<FavoriteUpdateManyMutationInput, FavoriteUncheckedUpdateManyWithoutModelInput>
  }

  export type FavoriteScalarWhereInput = {
    AND?: FavoriteScalarWhereInput | FavoriteScalarWhereInput[]
    OR?: FavoriteScalarWhereInput[]
    NOT?: FavoriteScalarWhereInput | FavoriteScalarWhereInput[]
    id?: StringFilter<"Favorite"> | string
    userId?: StringFilter<"Favorite"> | string
    modelId?: StringFilter<"Favorite"> | string
    versionId?: StringFilter<"Favorite"> | string
    createdAt?: DateTimeFilter<"Favorite"> | Date | string
  }

  export type ModelCreateWithoutVersionsInput = {
    id?: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
    brand: BrandCreateNestedOneWithoutModelsInput
    favorites?: FavoriteCreateNestedManyWithoutModelInput
  }

  export type ModelUncheckedCreateWithoutVersionsInput = {
    id?: string
    brandId: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
    favorites?: FavoriteUncheckedCreateNestedManyWithoutModelInput
  }

  export type ModelCreateOrConnectWithoutVersionsInput = {
    where: ModelWhereUniqueInput
    create: XOR<ModelCreateWithoutVersionsInput, ModelUncheckedCreateWithoutVersionsInput>
  }

  export type VersionEquipmentCreateWithoutVersionInput = {
    equipmentItem: EquipmentItemCreateNestedOneWithoutVersionsInput
  }

  export type VersionEquipmentUncheckedCreateWithoutVersionInput = {
    equipmentItemId: string
  }

  export type VersionEquipmentCreateOrConnectWithoutVersionInput = {
    where: VersionEquipmentWhereUniqueInput
    create: XOR<VersionEquipmentCreateWithoutVersionInput, VersionEquipmentUncheckedCreateWithoutVersionInput>
  }

  export type VersionEquipmentCreateManyVersionInputEnvelope = {
    data: VersionEquipmentCreateManyVersionInput | VersionEquipmentCreateManyVersionInput[]
    skipDuplicates?: boolean
  }

  export type MaintenanceCostCreateWithoutVersionInput = {
    id?: string
    mileageTag: number
    costClp: number
    deletedAt?: Date | string | null
  }

  export type MaintenanceCostUncheckedCreateWithoutVersionInput = {
    id?: string
    mileageTag: number
    costClp: number
    deletedAt?: Date | string | null
  }

  export type MaintenanceCostCreateOrConnectWithoutVersionInput = {
    where: MaintenanceCostWhereUniqueInput
    create: XOR<MaintenanceCostCreateWithoutVersionInput, MaintenanceCostUncheckedCreateWithoutVersionInput>
  }

  export type MaintenanceCostCreateManyVersionInputEnvelope = {
    data: MaintenanceCostCreateManyVersionInput | MaintenanceCostCreateManyVersionInput[]
    skipDuplicates?: boolean
  }

  export type ComparisonItemCreateWithoutVersionInput = {
    id?: string
    position: number
    comparison: ComparisonCreateNestedOneWithoutItemsInput
  }

  export type ComparisonItemUncheckedCreateWithoutVersionInput = {
    id?: string
    comparisonId: string
    position: number
  }

  export type ComparisonItemCreateOrConnectWithoutVersionInput = {
    where: ComparisonItemWhereUniqueInput
    create: XOR<ComparisonItemCreateWithoutVersionInput, ComparisonItemUncheckedCreateWithoutVersionInput>
  }

  export type ComparisonItemCreateManyVersionInputEnvelope = {
    data: ComparisonItemCreateManyVersionInput | ComparisonItemCreateManyVersionInput[]
    skipDuplicates?: boolean
  }

  export type FavoriteCreateWithoutVersionInput = {
    id?: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutFavoritesInput
    model: ModelCreateNestedOneWithoutFavoritesInput
  }

  export type FavoriteUncheckedCreateWithoutVersionInput = {
    id?: string
    userId: string
    modelId: string
    createdAt?: Date | string
  }

  export type FavoriteCreateOrConnectWithoutVersionInput = {
    where: FavoriteWhereUniqueInput
    create: XOR<FavoriteCreateWithoutVersionInput, FavoriteUncheckedCreateWithoutVersionInput>
  }

  export type FavoriteCreateManyVersionInputEnvelope = {
    data: FavoriteCreateManyVersionInput | FavoriteCreateManyVersionInput[]
    skipDuplicates?: boolean
  }

  export type ModelUpsertWithoutVersionsInput = {
    update: XOR<ModelUpdateWithoutVersionsInput, ModelUncheckedUpdateWithoutVersionsInput>
    create: XOR<ModelCreateWithoutVersionsInput, ModelUncheckedCreateWithoutVersionsInput>
    where?: ModelWhereInput
  }

  export type ModelUpdateToOneWithWhereWithoutVersionsInput = {
    where?: ModelWhereInput
    data: XOR<ModelUpdateWithoutVersionsInput, ModelUncheckedUpdateWithoutVersionsInput>
  }

  export type ModelUpdateWithoutVersionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    brand?: BrandUpdateOneRequiredWithoutModelsNestedInput
    favorites?: FavoriteUpdateManyWithoutModelNestedInput
  }

  export type ModelUncheckedUpdateWithoutVersionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    brandId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    favorites?: FavoriteUncheckedUpdateManyWithoutModelNestedInput
  }

  export type VersionEquipmentUpsertWithWhereUniqueWithoutVersionInput = {
    where: VersionEquipmentWhereUniqueInput
    update: XOR<VersionEquipmentUpdateWithoutVersionInput, VersionEquipmentUncheckedUpdateWithoutVersionInput>
    create: XOR<VersionEquipmentCreateWithoutVersionInput, VersionEquipmentUncheckedCreateWithoutVersionInput>
  }

  export type VersionEquipmentUpdateWithWhereUniqueWithoutVersionInput = {
    where: VersionEquipmentWhereUniqueInput
    data: XOR<VersionEquipmentUpdateWithoutVersionInput, VersionEquipmentUncheckedUpdateWithoutVersionInput>
  }

  export type VersionEquipmentUpdateManyWithWhereWithoutVersionInput = {
    where: VersionEquipmentScalarWhereInput
    data: XOR<VersionEquipmentUpdateManyMutationInput, VersionEquipmentUncheckedUpdateManyWithoutVersionInput>
  }

  export type VersionEquipmentScalarWhereInput = {
    AND?: VersionEquipmentScalarWhereInput | VersionEquipmentScalarWhereInput[]
    OR?: VersionEquipmentScalarWhereInput[]
    NOT?: VersionEquipmentScalarWhereInput | VersionEquipmentScalarWhereInput[]
    versionId?: StringFilter<"VersionEquipment"> | string
    equipmentItemId?: StringFilter<"VersionEquipment"> | string
  }

  export type MaintenanceCostUpsertWithWhereUniqueWithoutVersionInput = {
    where: MaintenanceCostWhereUniqueInput
    update: XOR<MaintenanceCostUpdateWithoutVersionInput, MaintenanceCostUncheckedUpdateWithoutVersionInput>
    create: XOR<MaintenanceCostCreateWithoutVersionInput, MaintenanceCostUncheckedCreateWithoutVersionInput>
  }

  export type MaintenanceCostUpdateWithWhereUniqueWithoutVersionInput = {
    where: MaintenanceCostWhereUniqueInput
    data: XOR<MaintenanceCostUpdateWithoutVersionInput, MaintenanceCostUncheckedUpdateWithoutVersionInput>
  }

  export type MaintenanceCostUpdateManyWithWhereWithoutVersionInput = {
    where: MaintenanceCostScalarWhereInput
    data: XOR<MaintenanceCostUpdateManyMutationInput, MaintenanceCostUncheckedUpdateManyWithoutVersionInput>
  }

  export type MaintenanceCostScalarWhereInput = {
    AND?: MaintenanceCostScalarWhereInput | MaintenanceCostScalarWhereInput[]
    OR?: MaintenanceCostScalarWhereInput[]
    NOT?: MaintenanceCostScalarWhereInput | MaintenanceCostScalarWhereInput[]
    id?: StringFilter<"MaintenanceCost"> | string
    versionId?: StringFilter<"MaintenanceCost"> | string
    mileageTag?: IntFilter<"MaintenanceCost"> | number
    costClp?: IntFilter<"MaintenanceCost"> | number
    deletedAt?: DateTimeNullableFilter<"MaintenanceCost"> | Date | string | null
  }

  export type ComparisonItemUpsertWithWhereUniqueWithoutVersionInput = {
    where: ComparisonItemWhereUniqueInput
    update: XOR<ComparisonItemUpdateWithoutVersionInput, ComparisonItemUncheckedUpdateWithoutVersionInput>
    create: XOR<ComparisonItemCreateWithoutVersionInput, ComparisonItemUncheckedCreateWithoutVersionInput>
  }

  export type ComparisonItemUpdateWithWhereUniqueWithoutVersionInput = {
    where: ComparisonItemWhereUniqueInput
    data: XOR<ComparisonItemUpdateWithoutVersionInput, ComparisonItemUncheckedUpdateWithoutVersionInput>
  }

  export type ComparisonItemUpdateManyWithWhereWithoutVersionInput = {
    where: ComparisonItemScalarWhereInput
    data: XOR<ComparisonItemUpdateManyMutationInput, ComparisonItemUncheckedUpdateManyWithoutVersionInput>
  }

  export type ComparisonItemScalarWhereInput = {
    AND?: ComparisonItemScalarWhereInput | ComparisonItemScalarWhereInput[]
    OR?: ComparisonItemScalarWhereInput[]
    NOT?: ComparisonItemScalarWhereInput | ComparisonItemScalarWhereInput[]
    id?: StringFilter<"ComparisonItem"> | string
    comparisonId?: StringFilter<"ComparisonItem"> | string
    versionId?: StringFilter<"ComparisonItem"> | string
    position?: IntFilter<"ComparisonItem"> | number
  }

  export type FavoriteUpsertWithWhereUniqueWithoutVersionInput = {
    where: FavoriteWhereUniqueInput
    update: XOR<FavoriteUpdateWithoutVersionInput, FavoriteUncheckedUpdateWithoutVersionInput>
    create: XOR<FavoriteCreateWithoutVersionInput, FavoriteUncheckedCreateWithoutVersionInput>
  }

  export type FavoriteUpdateWithWhereUniqueWithoutVersionInput = {
    where: FavoriteWhereUniqueInput
    data: XOR<FavoriteUpdateWithoutVersionInput, FavoriteUncheckedUpdateWithoutVersionInput>
  }

  export type FavoriteUpdateManyWithWhereWithoutVersionInput = {
    where: FavoriteScalarWhereInput
    data: XOR<FavoriteUpdateManyMutationInput, FavoriteUncheckedUpdateManyWithoutVersionInput>
  }

  export type VersionEquipmentCreateWithoutEquipmentItemInput = {
    version: VersionCreateNestedOneWithoutEquipmentItemsInput
  }

  export type VersionEquipmentUncheckedCreateWithoutEquipmentItemInput = {
    versionId: string
  }

  export type VersionEquipmentCreateOrConnectWithoutEquipmentItemInput = {
    where: VersionEquipmentWhereUniqueInput
    create: XOR<VersionEquipmentCreateWithoutEquipmentItemInput, VersionEquipmentUncheckedCreateWithoutEquipmentItemInput>
  }

  export type VersionEquipmentCreateManyEquipmentItemInputEnvelope = {
    data: VersionEquipmentCreateManyEquipmentItemInput | VersionEquipmentCreateManyEquipmentItemInput[]
    skipDuplicates?: boolean
  }

  export type VersionEquipmentUpsertWithWhereUniqueWithoutEquipmentItemInput = {
    where: VersionEquipmentWhereUniqueInput
    update: XOR<VersionEquipmentUpdateWithoutEquipmentItemInput, VersionEquipmentUncheckedUpdateWithoutEquipmentItemInput>
    create: XOR<VersionEquipmentCreateWithoutEquipmentItemInput, VersionEquipmentUncheckedCreateWithoutEquipmentItemInput>
  }

  export type VersionEquipmentUpdateWithWhereUniqueWithoutEquipmentItemInput = {
    where: VersionEquipmentWhereUniqueInput
    data: XOR<VersionEquipmentUpdateWithoutEquipmentItemInput, VersionEquipmentUncheckedUpdateWithoutEquipmentItemInput>
  }

  export type VersionEquipmentUpdateManyWithWhereWithoutEquipmentItemInput = {
    where: VersionEquipmentScalarWhereInput
    data: XOR<VersionEquipmentUpdateManyMutationInput, VersionEquipmentUncheckedUpdateManyWithoutEquipmentItemInput>
  }

  export type VersionCreateWithoutEquipmentItemsInput = {
    id?: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    model: ModelCreateNestedOneWithoutVersionsInput
    maintenanceCosts?: MaintenanceCostCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemCreateNestedManyWithoutVersionInput
    favorites?: FavoriteCreateNestedManyWithoutVersionInput
  }

  export type VersionUncheckedCreateWithoutEquipmentItemsInput = {
    id?: string
    modelId: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    maintenanceCosts?: MaintenanceCostUncheckedCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemUncheckedCreateNestedManyWithoutVersionInput
    favorites?: FavoriteUncheckedCreateNestedManyWithoutVersionInput
  }

  export type VersionCreateOrConnectWithoutEquipmentItemsInput = {
    where: VersionWhereUniqueInput
    create: XOR<VersionCreateWithoutEquipmentItemsInput, VersionUncheckedCreateWithoutEquipmentItemsInput>
  }

  export type EquipmentItemCreateWithoutVersionsInput = {
    id?: string
    name: string
    category: string
    deletedAt?: Date | string | null
  }

  export type EquipmentItemUncheckedCreateWithoutVersionsInput = {
    id?: string
    name: string
    category: string
    deletedAt?: Date | string | null
  }

  export type EquipmentItemCreateOrConnectWithoutVersionsInput = {
    where: EquipmentItemWhereUniqueInput
    create: XOR<EquipmentItemCreateWithoutVersionsInput, EquipmentItemUncheckedCreateWithoutVersionsInput>
  }

  export type VersionUpsertWithoutEquipmentItemsInput = {
    update: XOR<VersionUpdateWithoutEquipmentItemsInput, VersionUncheckedUpdateWithoutEquipmentItemsInput>
    create: XOR<VersionCreateWithoutEquipmentItemsInput, VersionUncheckedCreateWithoutEquipmentItemsInput>
    where?: VersionWhereInput
  }

  export type VersionUpdateToOneWithWhereWithoutEquipmentItemsInput = {
    where?: VersionWhereInput
    data: XOR<VersionUpdateWithoutEquipmentItemsInput, VersionUncheckedUpdateWithoutEquipmentItemsInput>
  }

  export type VersionUpdateWithoutEquipmentItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelUpdateOneRequiredWithoutVersionsNestedInput
    maintenanceCosts?: MaintenanceCostUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUpdateManyWithoutVersionNestedInput
  }

  export type VersionUncheckedUpdateWithoutEquipmentItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    maintenanceCosts?: MaintenanceCostUncheckedUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUncheckedUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUncheckedUpdateManyWithoutVersionNestedInput
  }

  export type EquipmentItemUpsertWithoutVersionsInput = {
    update: XOR<EquipmentItemUpdateWithoutVersionsInput, EquipmentItemUncheckedUpdateWithoutVersionsInput>
    create: XOR<EquipmentItemCreateWithoutVersionsInput, EquipmentItemUncheckedCreateWithoutVersionsInput>
    where?: EquipmentItemWhereInput
  }

  export type EquipmentItemUpdateToOneWithWhereWithoutVersionsInput = {
    where?: EquipmentItemWhereInput
    data: XOR<EquipmentItemUpdateWithoutVersionsInput, EquipmentItemUncheckedUpdateWithoutVersionsInput>
  }

  export type EquipmentItemUpdateWithoutVersionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type EquipmentItemUncheckedUpdateWithoutVersionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    category?: StringFieldUpdateOperationsInput | string
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type VersionCreateWithoutMaintenanceCostsInput = {
    id?: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    model: ModelCreateNestedOneWithoutVersionsInput
    equipmentItems?: VersionEquipmentCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemCreateNestedManyWithoutVersionInput
    favorites?: FavoriteCreateNestedManyWithoutVersionInput
  }

  export type VersionUncheckedCreateWithoutMaintenanceCostsInput = {
    id?: string
    modelId: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    equipmentItems?: VersionEquipmentUncheckedCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemUncheckedCreateNestedManyWithoutVersionInput
    favorites?: FavoriteUncheckedCreateNestedManyWithoutVersionInput
  }

  export type VersionCreateOrConnectWithoutMaintenanceCostsInput = {
    where: VersionWhereUniqueInput
    create: XOR<VersionCreateWithoutMaintenanceCostsInput, VersionUncheckedCreateWithoutMaintenanceCostsInput>
  }

  export type VersionUpsertWithoutMaintenanceCostsInput = {
    update: XOR<VersionUpdateWithoutMaintenanceCostsInput, VersionUncheckedUpdateWithoutMaintenanceCostsInput>
    create: XOR<VersionCreateWithoutMaintenanceCostsInput, VersionUncheckedCreateWithoutMaintenanceCostsInput>
    where?: VersionWhereInput
  }

  export type VersionUpdateToOneWithWhereWithoutMaintenanceCostsInput = {
    where?: VersionWhereInput
    data: XOR<VersionUpdateWithoutMaintenanceCostsInput, VersionUncheckedUpdateWithoutMaintenanceCostsInput>
  }

  export type VersionUpdateWithoutMaintenanceCostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelUpdateOneRequiredWithoutVersionsNestedInput
    equipmentItems?: VersionEquipmentUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUpdateManyWithoutVersionNestedInput
  }

  export type VersionUncheckedUpdateWithoutMaintenanceCostsInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    equipmentItems?: VersionEquipmentUncheckedUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUncheckedUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUncheckedUpdateManyWithoutVersionNestedInput
  }

  export type ComparisonCreateWithoutUserInput = {
    id?: string
    slug?: string | null
    name?: string | null
    versionsHash: string
    createdAt?: Date | string
    items?: ComparisonItemCreateNestedManyWithoutComparisonInput
  }

  export type ComparisonUncheckedCreateWithoutUserInput = {
    id?: string
    slug?: string | null
    name?: string | null
    versionsHash: string
    createdAt?: Date | string
    items?: ComparisonItemUncheckedCreateNestedManyWithoutComparisonInput
  }

  export type ComparisonCreateOrConnectWithoutUserInput = {
    where: ComparisonWhereUniqueInput
    create: XOR<ComparisonCreateWithoutUserInput, ComparisonUncheckedCreateWithoutUserInput>
  }

  export type ComparisonCreateManyUserInputEnvelope = {
    data: ComparisonCreateManyUserInput | ComparisonCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type FavoriteCreateWithoutUserInput = {
    id?: string
    createdAt?: Date | string
    model: ModelCreateNestedOneWithoutFavoritesInput
    version: VersionCreateNestedOneWithoutFavoritesInput
  }

  export type FavoriteUncheckedCreateWithoutUserInput = {
    id?: string
    modelId: string
    versionId: string
    createdAt?: Date | string
  }

  export type FavoriteCreateOrConnectWithoutUserInput = {
    where: FavoriteWhereUniqueInput
    create: XOR<FavoriteCreateWithoutUserInput, FavoriteUncheckedCreateWithoutUserInput>
  }

  export type FavoriteCreateManyUserInputEnvelope = {
    data: FavoriteCreateManyUserInput | FavoriteCreateManyUserInput[]
    skipDuplicates?: boolean
  }

  export type ComparisonUpsertWithWhereUniqueWithoutUserInput = {
    where: ComparisonWhereUniqueInput
    update: XOR<ComparisonUpdateWithoutUserInput, ComparisonUncheckedUpdateWithoutUserInput>
    create: XOR<ComparisonCreateWithoutUserInput, ComparisonUncheckedCreateWithoutUserInput>
  }

  export type ComparisonUpdateWithWhereUniqueWithoutUserInput = {
    where: ComparisonWhereUniqueInput
    data: XOR<ComparisonUpdateWithoutUserInput, ComparisonUncheckedUpdateWithoutUserInput>
  }

  export type ComparisonUpdateManyWithWhereWithoutUserInput = {
    where: ComparisonScalarWhereInput
    data: XOR<ComparisonUpdateManyMutationInput, ComparisonUncheckedUpdateManyWithoutUserInput>
  }

  export type ComparisonScalarWhereInput = {
    AND?: ComparisonScalarWhereInput | ComparisonScalarWhereInput[]
    OR?: ComparisonScalarWhereInput[]
    NOT?: ComparisonScalarWhereInput | ComparisonScalarWhereInput[]
    id?: StringFilter<"Comparison"> | string
    userId?: StringFilter<"Comparison"> | string
    slug?: StringNullableFilter<"Comparison"> | string | null
    name?: StringNullableFilter<"Comparison"> | string | null
    versionsHash?: StringFilter<"Comparison"> | string
    createdAt?: DateTimeFilter<"Comparison"> | Date | string
  }

  export type FavoriteUpsertWithWhereUniqueWithoutUserInput = {
    where: FavoriteWhereUniqueInput
    update: XOR<FavoriteUpdateWithoutUserInput, FavoriteUncheckedUpdateWithoutUserInput>
    create: XOR<FavoriteCreateWithoutUserInput, FavoriteUncheckedCreateWithoutUserInput>
  }

  export type FavoriteUpdateWithWhereUniqueWithoutUserInput = {
    where: FavoriteWhereUniqueInput
    data: XOR<FavoriteUpdateWithoutUserInput, FavoriteUncheckedUpdateWithoutUserInput>
  }

  export type FavoriteUpdateManyWithWhereWithoutUserInput = {
    where: FavoriteScalarWhereInput
    data: XOR<FavoriteUpdateManyMutationInput, FavoriteUncheckedUpdateManyWithoutUserInput>
  }

  export type UserCreateWithoutComparisonsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    favorites?: FavoriteCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutComparisonsInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    favorites?: FavoriteUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutComparisonsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutComparisonsInput, UserUncheckedCreateWithoutComparisonsInput>
  }

  export type ComparisonItemCreateWithoutComparisonInput = {
    id?: string
    position: number
    version: VersionCreateNestedOneWithoutComparisonItemsInput
  }

  export type ComparisonItemUncheckedCreateWithoutComparisonInput = {
    id?: string
    versionId: string
    position: number
  }

  export type ComparisonItemCreateOrConnectWithoutComparisonInput = {
    where: ComparisonItemWhereUniqueInput
    create: XOR<ComparisonItemCreateWithoutComparisonInput, ComparisonItemUncheckedCreateWithoutComparisonInput>
  }

  export type ComparisonItemCreateManyComparisonInputEnvelope = {
    data: ComparisonItemCreateManyComparisonInput | ComparisonItemCreateManyComparisonInput[]
    skipDuplicates?: boolean
  }

  export type UserUpsertWithoutComparisonsInput = {
    update: XOR<UserUpdateWithoutComparisonsInput, UserUncheckedUpdateWithoutComparisonsInput>
    create: XOR<UserCreateWithoutComparisonsInput, UserUncheckedCreateWithoutComparisonsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutComparisonsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutComparisonsInput, UserUncheckedUpdateWithoutComparisonsInput>
  }

  export type UserUpdateWithoutComparisonsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    favorites?: FavoriteUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutComparisonsInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    favorites?: FavoriteUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ComparisonItemUpsertWithWhereUniqueWithoutComparisonInput = {
    where: ComparisonItemWhereUniqueInput
    update: XOR<ComparisonItemUpdateWithoutComparisonInput, ComparisonItemUncheckedUpdateWithoutComparisonInput>
    create: XOR<ComparisonItemCreateWithoutComparisonInput, ComparisonItemUncheckedCreateWithoutComparisonInput>
  }

  export type ComparisonItemUpdateWithWhereUniqueWithoutComparisonInput = {
    where: ComparisonItemWhereUniqueInput
    data: XOR<ComparisonItemUpdateWithoutComparisonInput, ComparisonItemUncheckedUpdateWithoutComparisonInput>
  }

  export type ComparisonItemUpdateManyWithWhereWithoutComparisonInput = {
    where: ComparisonItemScalarWhereInput
    data: XOR<ComparisonItemUpdateManyMutationInput, ComparisonItemUncheckedUpdateManyWithoutComparisonInput>
  }

  export type ComparisonCreateWithoutItemsInput = {
    id?: string
    slug?: string | null
    name?: string | null
    versionsHash: string
    createdAt?: Date | string
    user: UserCreateNestedOneWithoutComparisonsInput
  }

  export type ComparisonUncheckedCreateWithoutItemsInput = {
    id?: string
    userId: string
    slug?: string | null
    name?: string | null
    versionsHash: string
    createdAt?: Date | string
  }

  export type ComparisonCreateOrConnectWithoutItemsInput = {
    where: ComparisonWhereUniqueInput
    create: XOR<ComparisonCreateWithoutItemsInput, ComparisonUncheckedCreateWithoutItemsInput>
  }

  export type VersionCreateWithoutComparisonItemsInput = {
    id?: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    model: ModelCreateNestedOneWithoutVersionsInput
    equipmentItems?: VersionEquipmentCreateNestedManyWithoutVersionInput
    maintenanceCosts?: MaintenanceCostCreateNestedManyWithoutVersionInput
    favorites?: FavoriteCreateNestedManyWithoutVersionInput
  }

  export type VersionUncheckedCreateWithoutComparisonItemsInput = {
    id?: string
    modelId: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    equipmentItems?: VersionEquipmentUncheckedCreateNestedManyWithoutVersionInput
    maintenanceCosts?: MaintenanceCostUncheckedCreateNestedManyWithoutVersionInput
    favorites?: FavoriteUncheckedCreateNestedManyWithoutVersionInput
  }

  export type VersionCreateOrConnectWithoutComparisonItemsInput = {
    where: VersionWhereUniqueInput
    create: XOR<VersionCreateWithoutComparisonItemsInput, VersionUncheckedCreateWithoutComparisonItemsInput>
  }

  export type ComparisonUpsertWithoutItemsInput = {
    update: XOR<ComparisonUpdateWithoutItemsInput, ComparisonUncheckedUpdateWithoutItemsInput>
    create: XOR<ComparisonCreateWithoutItemsInput, ComparisonUncheckedCreateWithoutItemsInput>
    where?: ComparisonWhereInput
  }

  export type ComparisonUpdateToOneWithWhereWithoutItemsInput = {
    where?: ComparisonWhereInput
    data: XOR<ComparisonUpdateWithoutItemsInput, ComparisonUncheckedUpdateWithoutItemsInput>
  }

  export type ComparisonUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutComparisonsNestedInput
  }

  export type ComparisonUncheckedUpdateWithoutItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionUpsertWithoutComparisonItemsInput = {
    update: XOR<VersionUpdateWithoutComparisonItemsInput, VersionUncheckedUpdateWithoutComparisonItemsInput>
    create: XOR<VersionCreateWithoutComparisonItemsInput, VersionUncheckedCreateWithoutComparisonItemsInput>
    where?: VersionWhereInput
  }

  export type VersionUpdateToOneWithWhereWithoutComparisonItemsInput = {
    where?: VersionWhereInput
    data: XOR<VersionUpdateWithoutComparisonItemsInput, VersionUncheckedUpdateWithoutComparisonItemsInput>
  }

  export type VersionUpdateWithoutComparisonItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelUpdateOneRequiredWithoutVersionsNestedInput
    equipmentItems?: VersionEquipmentUpdateManyWithoutVersionNestedInput
    maintenanceCosts?: MaintenanceCostUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUpdateManyWithoutVersionNestedInput
  }

  export type VersionUncheckedUpdateWithoutComparisonItemsInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    equipmentItems?: VersionEquipmentUncheckedUpdateManyWithoutVersionNestedInput
    maintenanceCosts?: MaintenanceCostUncheckedUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUncheckedUpdateManyWithoutVersionNestedInput
  }

  export type UserCreateWithoutFavoritesInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    comparisons?: ComparisonCreateNestedManyWithoutUserInput
  }

  export type UserUncheckedCreateWithoutFavoritesInput = {
    id?: string
    email: string
    passwordHash: string
    name: string
    role?: string
    createdAt?: Date | string
    comparisons?: ComparisonUncheckedCreateNestedManyWithoutUserInput
  }

  export type UserCreateOrConnectWithoutFavoritesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutFavoritesInput, UserUncheckedCreateWithoutFavoritesInput>
  }

  export type ModelCreateWithoutFavoritesInput = {
    id?: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
    brand: BrandCreateNestedOneWithoutModelsInput
    versions?: VersionCreateNestedManyWithoutModelInput
  }

  export type ModelUncheckedCreateWithoutFavoritesInput = {
    id?: string
    brandId: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
    versions?: VersionUncheckedCreateNestedManyWithoutModelInput
  }

  export type ModelCreateOrConnectWithoutFavoritesInput = {
    where: ModelWhereUniqueInput
    create: XOR<ModelCreateWithoutFavoritesInput, ModelUncheckedCreateWithoutFavoritesInput>
  }

  export type VersionCreateWithoutFavoritesInput = {
    id?: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    model: ModelCreateNestedOneWithoutVersionsInput
    equipmentItems?: VersionEquipmentCreateNestedManyWithoutVersionInput
    maintenanceCosts?: MaintenanceCostCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemCreateNestedManyWithoutVersionInput
  }

  export type VersionUncheckedCreateWithoutFavoritesInput = {
    id?: string
    modelId: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
    equipmentItems?: VersionEquipmentUncheckedCreateNestedManyWithoutVersionInput
    maintenanceCosts?: MaintenanceCostUncheckedCreateNestedManyWithoutVersionInput
    comparisonItems?: ComparisonItemUncheckedCreateNestedManyWithoutVersionInput
  }

  export type VersionCreateOrConnectWithoutFavoritesInput = {
    where: VersionWhereUniqueInput
    create: XOR<VersionCreateWithoutFavoritesInput, VersionUncheckedCreateWithoutFavoritesInput>
  }

  export type UserUpsertWithoutFavoritesInput = {
    update: XOR<UserUpdateWithoutFavoritesInput, UserUncheckedUpdateWithoutFavoritesInput>
    create: XOR<UserCreateWithoutFavoritesInput, UserUncheckedCreateWithoutFavoritesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutFavoritesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutFavoritesInput, UserUncheckedUpdateWithoutFavoritesInput>
  }

  export type UserUpdateWithoutFavoritesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comparisons?: ComparisonUpdateManyWithoutUserNestedInput
  }

  export type UserUncheckedUpdateWithoutFavoritesInput = {
    id?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    passwordHash?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    role?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    comparisons?: ComparisonUncheckedUpdateManyWithoutUserNestedInput
  }

  export type ModelUpsertWithoutFavoritesInput = {
    update: XOR<ModelUpdateWithoutFavoritesInput, ModelUncheckedUpdateWithoutFavoritesInput>
    create: XOR<ModelCreateWithoutFavoritesInput, ModelUncheckedCreateWithoutFavoritesInput>
    where?: ModelWhereInput
  }

  export type ModelUpdateToOneWithWhereWithoutFavoritesInput = {
    where?: ModelWhereInput
    data: XOR<ModelUpdateWithoutFavoritesInput, ModelUncheckedUpdateWithoutFavoritesInput>
  }

  export type ModelUpdateWithoutFavoritesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    brand?: BrandUpdateOneRequiredWithoutModelsNestedInput
    versions?: VersionUpdateManyWithoutModelNestedInput
  }

  export type ModelUncheckedUpdateWithoutFavoritesInput = {
    id?: StringFieldUpdateOperationsInput | string
    brandId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    versions?: VersionUncheckedUpdateManyWithoutModelNestedInput
  }

  export type VersionUpsertWithoutFavoritesInput = {
    update: XOR<VersionUpdateWithoutFavoritesInput, VersionUncheckedUpdateWithoutFavoritesInput>
    create: XOR<VersionCreateWithoutFavoritesInput, VersionUncheckedCreateWithoutFavoritesInput>
    where?: VersionWhereInput
  }

  export type VersionUpdateToOneWithWhereWithoutFavoritesInput = {
    where?: VersionWhereInput
    data: XOR<VersionUpdateWithoutFavoritesInput, VersionUncheckedUpdateWithoutFavoritesInput>
  }

  export type VersionUpdateWithoutFavoritesInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelUpdateOneRequiredWithoutVersionsNestedInput
    equipmentItems?: VersionEquipmentUpdateManyWithoutVersionNestedInput
    maintenanceCosts?: MaintenanceCostUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUpdateManyWithoutVersionNestedInput
  }

  export type VersionUncheckedUpdateWithoutFavoritesInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    equipmentItems?: VersionEquipmentUncheckedUpdateManyWithoutVersionNestedInput
    maintenanceCosts?: MaintenanceCostUncheckedUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUncheckedUpdateManyWithoutVersionNestedInput
  }

  export type ModelCreateManyBrandInput = {
    id?: string
    name: string
    segment: string
    imageUrl?: string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type ModelUpdateWithoutBrandInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    versions?: VersionUpdateManyWithoutModelNestedInput
    favorites?: FavoriteUpdateManyWithoutModelNestedInput
  }

  export type ModelUncheckedUpdateWithoutBrandInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    versions?: VersionUncheckedUpdateManyWithoutModelNestedInput
    favorites?: FavoriteUncheckedUpdateManyWithoutModelNestedInput
  }

  export type ModelUncheckedUpdateManyWithoutBrandInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    segment?: StringFieldUpdateOperationsInput | string
    imageUrl?: NullableStringFieldUpdateOperationsInput | string | null
    galleryUrls?: JsonNullValueInput | InputJsonValue
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionCreateManyModelInput = {
    id?: string
    name: string
    year: number
    priceClp: number
    transmission: string
    fuel: string
    engineDisplacementCc: number
    powerHp: number
    torqueNm: number
    consumptionCityKmL: number
    consumptionHighwayKmL: number
    lengthMm: number
    widthMm: number
    heightMm: number
    weightKg: number
    trunkLiters: number
    airbagCount: number
    hasAbs: boolean
    hasEsp: boolean
    hasCruiseControl: boolean
    deletedAt?: Date | string | null
    createdAt?: Date | string
  }

  export type FavoriteCreateManyModelInput = {
    id?: string
    userId: string
    versionId: string
    createdAt?: Date | string
  }

  export type VersionUpdateWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    equipmentItems?: VersionEquipmentUpdateManyWithoutVersionNestedInput
    maintenanceCosts?: MaintenanceCostUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUpdateManyWithoutVersionNestedInput
  }

  export type VersionUncheckedUpdateWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    equipmentItems?: VersionEquipmentUncheckedUpdateManyWithoutVersionNestedInput
    maintenanceCosts?: MaintenanceCostUncheckedUpdateManyWithoutVersionNestedInput
    comparisonItems?: ComparisonItemUncheckedUpdateManyWithoutVersionNestedInput
    favorites?: FavoriteUncheckedUpdateManyWithoutVersionNestedInput
  }

  export type VersionUncheckedUpdateManyWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    year?: IntFieldUpdateOperationsInput | number
    priceClp?: IntFieldUpdateOperationsInput | number
    transmission?: StringFieldUpdateOperationsInput | string
    fuel?: StringFieldUpdateOperationsInput | string
    engineDisplacementCc?: IntFieldUpdateOperationsInput | number
    powerHp?: IntFieldUpdateOperationsInput | number
    torqueNm?: IntFieldUpdateOperationsInput | number
    consumptionCityKmL?: FloatFieldUpdateOperationsInput | number
    consumptionHighwayKmL?: FloatFieldUpdateOperationsInput | number
    lengthMm?: IntFieldUpdateOperationsInput | number
    widthMm?: IntFieldUpdateOperationsInput | number
    heightMm?: IntFieldUpdateOperationsInput | number
    weightKg?: IntFieldUpdateOperationsInput | number
    trunkLiters?: IntFieldUpdateOperationsInput | number
    airbagCount?: IntFieldUpdateOperationsInput | number
    hasAbs?: BoolFieldUpdateOperationsInput | boolean
    hasEsp?: BoolFieldUpdateOperationsInput | boolean
    hasCruiseControl?: BoolFieldUpdateOperationsInput | boolean
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FavoriteUpdateWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFavoritesNestedInput
    version?: VersionUpdateOneRequiredWithoutFavoritesNestedInput
  }

  export type FavoriteUncheckedUpdateWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FavoriteUncheckedUpdateManyWithoutModelInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionEquipmentCreateManyVersionInput = {
    equipmentItemId: string
  }

  export type MaintenanceCostCreateManyVersionInput = {
    id?: string
    mileageTag: number
    costClp: number
    deletedAt?: Date | string | null
  }

  export type ComparisonItemCreateManyVersionInput = {
    id?: string
    comparisonId: string
    position: number
  }

  export type FavoriteCreateManyVersionInput = {
    id?: string
    userId: string
    modelId: string
    createdAt?: Date | string
  }

  export type VersionEquipmentUpdateWithoutVersionInput = {
    equipmentItem?: EquipmentItemUpdateOneRequiredWithoutVersionsNestedInput
  }

  export type VersionEquipmentUncheckedUpdateWithoutVersionInput = {
    equipmentItemId?: StringFieldUpdateOperationsInput | string
  }

  export type VersionEquipmentUncheckedUpdateManyWithoutVersionInput = {
    equipmentItemId?: StringFieldUpdateOperationsInput | string
  }

  export type MaintenanceCostUpdateWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    mileageTag?: IntFieldUpdateOperationsInput | number
    costClp?: IntFieldUpdateOperationsInput | number
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MaintenanceCostUncheckedUpdateWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    mileageTag?: IntFieldUpdateOperationsInput | number
    costClp?: IntFieldUpdateOperationsInput | number
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type MaintenanceCostUncheckedUpdateManyWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    mileageTag?: IntFieldUpdateOperationsInput | number
    costClp?: IntFieldUpdateOperationsInput | number
    deletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ComparisonItemUpdateWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    comparison?: ComparisonUpdateOneRequiredWithoutItemsNestedInput
  }

  export type ComparisonItemUncheckedUpdateWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    comparisonId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
  }

  export type ComparisonItemUncheckedUpdateManyWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    comparisonId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
  }

  export type FavoriteUpdateWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    user?: UserUpdateOneRequiredWithoutFavoritesNestedInput
    model?: ModelUpdateOneRequiredWithoutFavoritesNestedInput
  }

  export type FavoriteUncheckedUpdateWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FavoriteUncheckedUpdateManyWithoutVersionInput = {
    id?: StringFieldUpdateOperationsInput | string
    userId?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type VersionEquipmentCreateManyEquipmentItemInput = {
    versionId: string
  }

  export type VersionEquipmentUpdateWithoutEquipmentItemInput = {
    version?: VersionUpdateOneRequiredWithoutEquipmentItemsNestedInput
  }

  export type VersionEquipmentUncheckedUpdateWithoutEquipmentItemInput = {
    versionId?: StringFieldUpdateOperationsInput | string
  }

  export type VersionEquipmentUncheckedUpdateManyWithoutEquipmentItemInput = {
    versionId?: StringFieldUpdateOperationsInput | string
  }

  export type ComparisonCreateManyUserInput = {
    id?: string
    slug?: string | null
    name?: string | null
    versionsHash: string
    createdAt?: Date | string
  }

  export type FavoriteCreateManyUserInput = {
    id?: string
    modelId: string
    versionId: string
    createdAt?: Date | string
  }

  export type ComparisonUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ComparisonItemUpdateManyWithoutComparisonNestedInput
  }

  export type ComparisonUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    items?: ComparisonItemUncheckedUpdateManyWithoutComparisonNestedInput
  }

  export type ComparisonUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    slug?: NullableStringFieldUpdateOperationsInput | string | null
    name?: NullableStringFieldUpdateOperationsInput | string | null
    versionsHash?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FavoriteUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    model?: ModelUpdateOneRequiredWithoutFavoritesNestedInput
    version?: VersionUpdateOneRequiredWithoutFavoritesNestedInput
  }

  export type FavoriteUncheckedUpdateWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type FavoriteUncheckedUpdateManyWithoutUserInput = {
    id?: StringFieldUpdateOperationsInput | string
    modelId?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ComparisonItemCreateManyComparisonInput = {
    id?: string
    versionId: string
    position: number
  }

  export type ComparisonItemUpdateWithoutComparisonInput = {
    id?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
    version?: VersionUpdateOneRequiredWithoutComparisonItemsNestedInput
  }

  export type ComparisonItemUncheckedUpdateWithoutComparisonInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
  }

  export type ComparisonItemUncheckedUpdateManyWithoutComparisonInput = {
    id?: StringFieldUpdateOperationsInput | string
    versionId?: StringFieldUpdateOperationsInput | string
    position?: IntFieldUpdateOperationsInput | number
  }



  /**
   * Aliases for legacy arg types
   */
    /**
     * @deprecated Use BrandCountOutputTypeDefaultArgs instead
     */
    export type BrandCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BrandCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ModelCountOutputTypeDefaultArgs instead
     */
    export type ModelCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ModelCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VersionCountOutputTypeDefaultArgs instead
     */
    export type VersionCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VersionCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use EquipmentItemCountOutputTypeDefaultArgs instead
     */
    export type EquipmentItemCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = EquipmentItemCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserCountOutputTypeDefaultArgs instead
     */
    export type UserCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ComparisonCountOutputTypeDefaultArgs instead
     */
    export type ComparisonCountOutputTypeArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ComparisonCountOutputTypeDefaultArgs<ExtArgs>
    /**
     * @deprecated Use BrandDefaultArgs instead
     */
    export type BrandArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = BrandDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ModelDefaultArgs instead
     */
    export type ModelArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ModelDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VersionDefaultArgs instead
     */
    export type VersionArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VersionDefaultArgs<ExtArgs>
    /**
     * @deprecated Use EquipmentItemDefaultArgs instead
     */
    export type EquipmentItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = EquipmentItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use VersionEquipmentDefaultArgs instead
     */
    export type VersionEquipmentArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = VersionEquipmentDefaultArgs<ExtArgs>
    /**
     * @deprecated Use MaintenanceCostDefaultArgs instead
     */
    export type MaintenanceCostArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = MaintenanceCostDefaultArgs<ExtArgs>
    /**
     * @deprecated Use UserDefaultArgs instead
     */
    export type UserArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = UserDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ComparisonDefaultArgs instead
     */
    export type ComparisonArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ComparisonDefaultArgs<ExtArgs>
    /**
     * @deprecated Use ComparisonItemDefaultArgs instead
     */
    export type ComparisonItemArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = ComparisonItemDefaultArgs<ExtArgs>
    /**
     * @deprecated Use FavoriteDefaultArgs instead
     */
    export type FavoriteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = FavoriteDefaultArgs<ExtArgs>

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}