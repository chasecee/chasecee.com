function itemKey(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const key = (value as { _key?: unknown })._key;
  return typeof key === "string" ? key : undefined;
}

export function reconcileByKey<T>(current: T[] | undefined, next: T[]): T[] {
  const byKey = new Map(
    (current ?? [])
      .map((item) => [itemKey(item), item] as const)
      .filter((entry): entry is [string, T] => !!entry[0]),
  );

  return next.map((item) => {
    const key = itemKey(item);
    return key ? (byKey.get(key) ?? item) : item;
  });
}
