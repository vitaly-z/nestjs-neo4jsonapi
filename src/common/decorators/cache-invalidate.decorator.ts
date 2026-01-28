import { DataMeta } from "../interfaces/datamodel.interface";

/**
 * Decorator that invalidates cache after the method executes.
 *
 * @param meta - The entity metadata (provides endpoint for cache key)
 * @param id - Optional: The route param name to extract the entity ID.
 *             If omitted, invalidates all entries for this type.
 *             If provided, invalidates the specific element using req.params[id].
 */
export function CacheInvalidate(meta: DataMeta, id?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      if (this.cacheService) {
        if (!id) {
          // No id param → invalidate by type
          await this.cacheService.invalidateByType(meta.endpoint);
        } else {
          // id param provided → invalidate specific element
          const req = args.find((arg) => arg?.params);
          const paramId = req?.params?.[id];

          if (paramId) {
            await this.cacheService.invalidateByElement(meta.endpoint, paramId as string);
          }
        }
      }

      return result;
    };
    return descriptor;
  };
}
