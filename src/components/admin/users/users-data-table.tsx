"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "../shared/data-table-pagination";
import { Users } from "lucide-react";
import type { UserWithCount } from "./columns";

interface UsersDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
}

export function UsersDataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchValue = "",
  onSearchChange: _onSearchChange,
}: UsersDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      const searchValue = filterValue.toLowerCase();
      const user = row.original as UserWithCount;
      
      // Поиск по email
      if (user.email?.toLowerCase().includes(searchValue)) return true;
      // Поиск по имени
      if (user.name?.toLowerCase().includes(searchValue)) return true;
      // Поиск по роли
      if (user.role?.toLowerCase().includes(searchValue)) return true;
      // Поиск по телефону
      if (user.phone?.toLowerCase().includes(searchValue)) return true;
      // Поиск по количеству объявлений
      if (String(user.propertiesCount || 0).includes(searchValue)) return true;
      
      return false;
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
  });

  // Синхронизация внешнего поиска с глобальным фильтром
  React.useEffect(() => {
    if (searchValue !== undefined) {
      setGlobalFilter(searchValue || "");
    }
  }, [searchValue]);

  if (isLoading) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Загрузка пользователей...
      </div>
    );
  }

  // Проверяем результаты после фильтрации
  const filteredRows = table.getFilteredRowModel().rows;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Пользователи не найдены</p>
        <p className="text-sm mt-2">
          {searchValue
            ? "Попробуйте изменить параметры поиска"
            : "В системе пока нет пользователей"}
        </p>
      </div>
    );
  }

  if (filteredRows.length === 0 && globalFilter) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">Ничего не найдено</p>
        <p className="text-sm mt-2">
          По запросу &quot;{globalFilter}&quot; ничего не найдено. Попробуйте изменить параметры поиска.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row, index) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={
                      index % 2 === 0 ? "bg-background" : "bg-muted/30"
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    Нет результатов.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}
