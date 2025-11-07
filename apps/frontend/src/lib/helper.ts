// ================== HELPERS ==================

export function deepMergeEntity<T extends Record<string, any>>(
  oldItem: T | undefined,
  newItem: T
): T {
  if (!oldItem) return newItem;

  const merged: any = { ...oldItem };

  for (const key in newItem) {
    const newVal = newItem[key];
    const oldVal = oldItem[key];

    if (Array.isArray(newVal)) {
      // Nếu là mảng các object có id (labels, views, cards)
      if (newVal.length && typeof newVal[0] === 'object' && 'id' in newVal[0]) {
        const mergedArray = [...newVal];
        const seen = new Set(mergedArray.map((i: any) => i.id));
        oldVal?.forEach((item: any) => {
          if (!seen.has(item.id)) mergedArray.push(item);
        });
        merged[key] = mergedArray;
      } else {
        merged[key] = newVal; // ghi đè nếu là mảng thường
      }
    } else if (
      newVal &&
      typeof newVal === 'object' &&
      !Array.isArray(newVal)
    ) {
      merged[key] = deepMergeEntity(oldVal, newVal); // merge sâu object
    } else if (newVal !== undefined) {
      merged[key] = newVal; // chỉ ghi đè khi có giá trị
    }
  }

  return merged;
}

export function mergeLatest<T extends { id: string; updatedAt?: string }>(
  oldItem: T | undefined,
  newItem: T
): T {
  if (!oldItem) return newItem;
  if (!newItem.updatedAt || !oldItem.updatedAt) {
    return deepMergeEntity(oldItem, newItem);
  }

  // Nếu bản mới có updatedAt lớn hơn → merge sâu, ngược lại giữ nguyên
  return new Date(newItem.updatedAt) > new Date(oldItem.updatedAt)
    ? deepMergeEntity(oldItem, newItem)
    : oldItem;
}
