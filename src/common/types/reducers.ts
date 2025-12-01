export const reducerArray = <T>() => ({
  default: () => [] as T[],
  reducer: (current: T[] | undefined, update: T[] | undefined) => update ?? current,
});

export const reducerUndefined = <T>() => ({
  default: () => undefined,
  reducer: (current: T | undefined, update: T | undefined) => update ?? current,
});

export const reducerBoolean = () => ({
  default: () => false,
  reducer: (current: boolean, update: boolean) => update ?? current,
});
