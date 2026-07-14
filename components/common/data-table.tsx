"use client";

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { useMemo, useState } from "react";
import { Columns3, Download, Inbox, Loader2, type LucideIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { TableSkeleton } from "@/components/skeletons/table-skeleton";
import { toast } from "@/lib/toast";

export interface BulkAction<TData> {
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
  /** If set, shows a confirmation dialog (with this copy) before running. */
  confirmDescription?: string;
  /** Runs the action per-row against the SAME server actions the row-level controls already call — no new backend logic, just looping an existing one. */
  onRun: (rows: TData[]) => Promise<{ successCount: number; failureCount: number }>;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  searchPlaceholder?: string;
  searchColumnId?: string;
  /** Required to enable row selection / bulk actions — must be stable per row. */
  getRowId?: (row: TData) => string;
  bulkActions?: BulkAction<TData>[];
  /** Enables the "Export CSV" button, serializing the currently filtered rows. */
  exportFileName?: string;
  getExportRow?: (row: TData) => Record<string, string | number>;
  emptyTitle?: string;
  emptyDescription?: string;
}

function headerLabel(header: unknown, fallback: string): string {
  return typeof header === "string" ? header : fallback;
}

function downloadCsv(fileName: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => escape(row[h] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Generic admin data table (products, categories, enquiries lists) —
 * sorting, filtering, pagination, sticky header, column visibility, CSV
 * export, a mobile card-view fallback, and opt-in row-selection with
 * caller-supplied bulk actions, all wired once here so every admin screen
 * gets the same behavior for free.
 */
export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  searchPlaceholder = "Search...",
  searchColumnId,
  getRowId,
  bulkActions,
  exportFileName,
  getExportRow,
  emptyTitle = "No results",
  emptyDescription = "Nothing matches yet — try adjusting your search or filters.",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pendingAction, setPendingAction] = useState<BulkAction<TData> | null>(
    null,
  );
  const [isRunningAction, setIsRunningAction] = useState(false);

  const enableSelection = !!bulkActions?.length && !!getRowId;

  const tableColumns = useMemo<ColumnDef<TData, TValue>[]>(() => {
    if (!enableSelection) return columns;
    const selectColumn: ColumnDef<TData, TValue> = {
      id: "__select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={
            !table.getIsAllPageRowsSelected() &&
            table.getIsSomePageRowsSelected()
          }
          onCheckedChange={(checked) => table.toggleAllPageRowsSelected(checked)}
          aria-label="Select all rows on this page"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked) => row.toggleSelected(checked)}
          aria-label="Select row"
        />
      ),
    };
    return [selectColumn, ...columns];
  }, [columns, enableSelection]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: { sorting, globalFilter, columnVisibility, rowSelection },
    getRowId: getRowId as ((row: TData) => string) | undefined,
    enableRowSelection: enableSelection,
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const visibleRows = table.getFilteredRowModel().rows.map((r) => r.original);

  if (isLoading) return <TableSkeleton columns={tableColumns.length} />;

  function runBulkAction(action: BulkAction<TData>) {
    setIsRunningAction(true);
    action
      .onRun(selectedRows)
      .then(({ successCount, failureCount }) => {
        if (failureCount === 0) {
          toast.success(
            `${action.label}: ${successCount} item${successCount === 1 ? "" : "s"} updated`,
          );
        } else {
          toast.error(
            `${action.label}: ${successCount} succeeded, ${failureCount} failed`,
          );
        }
        setRowSelection({});
      })
      .finally(() => {
        setIsRunningAction(false);
        setPendingAction(null);
      });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {searchColumnId && (
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="max-w-sm"
          />
        )}

        <div className="ml-auto flex items-center gap-2">
          {exportFileName && getExportRow && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadCsv(exportFileName, visibleRows.map(getExportRow))
              }
            >
              <Download className="size-3.5" />
              Export CSV
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <Columns3 className="size-3.5" />
              Columns
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllLeafColumns()
                  .filter(
                    (c) =>
                      c.id !== "__select" &&
                      typeof c.columnDef.header === "string" &&
                      c.columnDef.header.length > 0,
                  )
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={column.getIsVisible()}
                      onCheckedChange={(v) => column.toggleVisibility(!!v)}
                    >
                      {headerLabel(column.columnDef.header, column.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {enableSelection && selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gold/30 bg-gold/5 px-3 py-2">
          <p className="text-sm font-medium">
            {selectedRows.length} selected
          </p>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {bulkActions!.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.label}
                  size="sm"
                  variant={action.variant === "destructive" ? "destructive" : "outline"}
                  disabled={isRunningAction}
                  onClick={() =>
                    action.confirmDescription
                      ? setPendingAction(action)
                      : runBulkAction(action)
                  }
                >
                  {Icon && <Icon className="size-3.5" />}
                  {action.label}
                </Button>
              );
            })}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setRowSelection({})}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Desktop / tablet table */}
      <div className="hidden overflow-hidden rounded-lg border border-border sm:block">
        <div className="max-h-[70vh] overflow-y-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="sticky top-0 z-10 bg-background"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={tableColumns.length} className="p-0">
                    <EmptyState title={emptyTitle} description={emptyDescription} />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile card fallback */}
      <div className="space-y-2 sm:hidden">
        {table.getRowModel().rows.length ? (
          table.getRowModel().rows.map((row) => (
            <div
              key={row.id}
              data-state={row.getIsSelected() ? "selected" : undefined}
              className="space-y-1.5 rounded-lg border border-border p-3 data-[state=selected]:border-gold/40 data-[state=selected]:bg-gold/5"
            >
              {row.getVisibleCells().map((cell) => {
                if (cell.column.id === "__select") {
                  return (
                    <div key={cell.id} className="flex justify-end">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </div>
                  );
                }
                const label = headerLabel(
                  cell.column.columnDef.header,
                  cell.column.id,
                );
                return (
                  <div
                    key={cell.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    {label && (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {label}
                      </span>
                    )}
                    <span className="min-w-0 text-right">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </span>
                  </div>
                );
              })}
            </div>
          ))
        ) : (
          <EmptyState title={emptyTitle} description={emptyDescription} />
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {Math.max(1, table.getPageCount())} · {visibleRows.length} row
          {visibleRows.length === 1 ? "" : "s"}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      <AlertDialog
        open={pendingAction !== null}
        onOpenChange={(open) => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.label} {selectedRows.length} item
              {selectedRows.length === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={pendingAction?.variant === "destructive" ? "destructive" : undefined}
              disabled={isRunningAction}
              onClick={() => pendingAction && runBulkAction(pendingAction)}
            >
              {isRunningAction ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : null}
              {pendingAction?.label}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
      <Inbox className="size-8 text-muted-foreground/50" strokeWidth={1.5} />
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="max-w-xs text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
