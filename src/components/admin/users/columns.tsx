"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Shield, Crown, User as UserIcon, Mail, Calendar, Home, Trash2 } from "lucide-react";

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
import { formatDate } from "@/lib/utils/format";
import type { AdminUser } from "@/services/admin.service";

export type UserWithCount = AdminUser & {
  propertiesCount?: number;
};

export const createUserColumns = (
  onRoleChange: (userId: string, role: "USER" | "PREMIUM" | "ADMIN") => void,
  onDelete: (userId: string) => void,
  isDeleting: boolean
): ColumnDef<UserWithCount>[] => [
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
          <span className="truncate max-w-[150px] sm:max-w-[200px]" title={user.email || ""}>
            {user.email || "-"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Имя" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
          <span className="truncate max-w-[120px] sm:max-w-[150px]" title={user.name || ""}>
            {user.name || "-"}
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Роль" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Select
          value={user.role}
          onValueChange={(value) =>
            onRoleChange(user.id, value as "USER" | "PREMIUM" | "ADMIN")
          }
        >
          <SelectTrigger className="w-36 min-h-[36px]">
            <SelectValue>
              {user.role === "ADMIN" && (
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-red-500" />
                  <Badge
                    variant="outline"
                    className="bg-red-50 text-red-700 border-red-200"
                  >
                    ADMIN
                  </Badge>
                </div>
              )}
              {user.role === "PREMIUM" && (
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-yellow-500" />
                  <Badge
                    variant="outline"
                    className="bg-yellow-50 text-yellow-700 border-yellow-200"
                  >
                    PREMIUM
                  </Badge>
                </div>
              )}
              {user.role === "USER" && (
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-blue-500" />
                  <Badge
                    variant="outline"
                    className="bg-blue-50 text-blue-700 border-blue-200"
                  >
                    USER
                  </Badge>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-500" />
                <Badge
                  variant="outline"
                  className="bg-blue-50 text-blue-700 border-blue-200"
                >
                  USER
                </Badge>
              </div>
            </SelectItem>
            <SelectItem value="PREMIUM">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-yellow-500" />
                <Badge
                  variant="outline"
                  className="bg-yellow-50 text-yellow-700 border-yellow-200"
                >
                  PREMIUM
                </Badge>
              </div>
            </SelectItem>
            <SelectItem value="ADMIN">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-red-500" />
                <Badge
                  variant="outline"
                  className="bg-red-50 text-red-700 border-red-200"
                >
                  ADMIN
                </Badge>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
  {
    accessorKey: "propertiesCount",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Объявлений" />
    ),
    cell: ({ row }) => {
      const count = row.original.propertiesCount ?? 0;
      return (
        <div className="flex items-center gap-2">
          <Home className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{count}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Дата регистрации" />
    ),
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4 shrink-0 hidden sm:block" />
          <span className="text-xs sm:text-sm">
            {formatDate(user.createdAt, "ru-RU", { relative: true })}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => {
            if (
              confirm(
                `Вы уверены, что хотите удалить пользователя ${user.email || user.name || user.id}?`
              )
            ) {
              onDelete(user.id);
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
