/**
 * Standard paginated response envelope.
 * All paginated endpoints return this format.
 */
export interface PaginatedResponse<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Helper to build a PaginatedResponse from a Prisma query result.
 *
 * The trick: query for `limit + 1` items. If you get `limit + 1` back,
 * there are more items. Return only `limit` items and set the cursor
 * to the last item's ID.
 *
 * @param items  - Array from Prisma (queried with take: limit + 1)
 * @param limit  - The requested page size
 */
export function paginate<T extends { id: string }>(
  items: T[],
  limit: number,
): PaginatedResponse<T> {
  const hasMore = items.length > limit;
  const data = hasMore ? items.slice(0, limit) : items;
  const nextCursor = data.length > 0 ? data[data.length - 1].id : null;

  return {
    data,
    nextCursor: hasMore ? nextCursor : null,
    hasMore,
  };
}
