// src/sections/product/utils.ts

export const visuallyHidden = {
  border: 0,
  margin: -1,
  padding: 0,
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
  clip: 'rect(0 0 0 0)',
} as const;

export function emptyRows(page: number, rowsPerPage: number, arrayLength: number) {
  return page ? Math.max(0, (1 + page) * rowsPerPage - arrayLength) : 0;
}

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

// ✅ FIXED HERE
export function getComparator<T>(
  order: 'asc' | 'desc',
  orderBy: keyof T
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

type ApplyFilterProps<T> = {
  inputData: T[];
  filterName: string;
  comparator: (a: T, b: T) => number;
};

export function applyFilter<T extends { itemName?: string; name?: string }>({
  inputData,
  comparator,
  filterName,
}: ApplyFilterProps<T>) {
  const stabilizedThis = inputData.map((el, index) => [el, index] as const);

  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) return order;
    return a[1] - b[1];
  });

  let filtered = stabilizedThis.map((el) => el[0]);

  if (filterName) {
    filtered = filtered.filter((item) =>
      (item.itemName ?? item.name ?? '').toLowerCase().includes(filterName.toLowerCase())
    );
  }

  return filtered;
}
