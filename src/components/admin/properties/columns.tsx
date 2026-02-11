"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Eye, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableColumnHeader } from "../shared/data-table-column-header";
import { formatCurrency } from "@/lib/utils/format";
import type { AdminProperty } from "@/services/admin.service";

export const createPropertyColumns = (
  onStatusChange: (
    propertyId: string,
    status: "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED",
    rejectionReason?: string
  ) => void,
  onDelete: (propertyId: string) => void,
  isDeleting: boolean
): ColumnDef<AdminProperty>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Название" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      return (
        <span className="truncate block max-w-[150px] sm:max-w-xs" title={property.title}>
          {property.title}
        </span>
      );
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Цена" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      return (
        <div className="font-medium">
          {formatCurrency(
            property.price,
            (property.currency as "RUB" | "USD") || "RUB"
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Тип" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      return (
        <Badge variant="outline" className="text-xs">
          {property.type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Статус" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      return (
        <Select
          value={property.status}
          onValueChange={(value) =>
            onStatusChange(
              property.id,
              value as "ACTIVE" | "PENDING" | "REJECTED" | "SOLD" | "ARCHIVED"
            )
          }
        >
          <SelectTrigger className="w-36 min-h-[36px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Активное
              </div>
            </SelectItem>
            <SelectItem value="PENDING">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                На модерации
              </div>
            </SelectItem>
            <SelectItem value="REJECTED">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                Отклонено
              </div>
            </SelectItem>
            <SelectItem value="SOLD">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                Продано
              </div>
            </SelectItem>
            <SelectItem value="ARCHIVED">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-500" />
                Архив
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
  {
    accessorKey: "views",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Просмотры" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      return (
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          {property.views || 0}
        </div>
      );
    },
  },
  {
    accessorKey: "userId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Владелец" />
    ),
    cell: ({ row }) => {
      const property = row.original;
      return (
        <span
          className="truncate block max-w-[100px] sm:max-w-xs text-muted-foreground text-xs sm:text-sm"
          title={property.userId}
        >
          {property.userId}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const property = row.original;
      return (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (
              confirm(
                `Вы уверены, что хотите удалить объявление "${property.title}"?`
              )
            ) {
              onDelete(property.id);
            }
          }}
          disabled={isDeleting}
          className="min-h-[36px]"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      );
    },
  },
];
