export interface ObjectMap<T> {
  [key: string]: T;
}

export type SubType<BaseType, Key extends keyof BaseType> = BaseType[Key];

export type SubTypeWithoutObjectMap<
  BaseType,
  Key extends keyof BaseType
> = SubType<BaseType, Key> extends ObjectMap<infer R> ? R : never;

export type Clone<BaseType extends string, ValueType> = {
  [key in BaseType]: ValueType;
};
