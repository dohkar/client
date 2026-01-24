"use client";

import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfilePageSkeleton() {
  return (
    <div className="min-h-screen py-4 px-1 md:px-4 md:py-8 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card Skeleton */}
        <Card className="overflow-hidden">
          <div className={`h-20 sm:h-24 md:h-32 bg-gradient-to-r from-slate-500/20 to-gray-500/20`} />
          <CardContent className="relative px-2 sm:px-4 pb-6 md:px-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-10 sm:-mt-12 md:-mt-16">
              {/* Avatar Skeleton */}
              <div className="relative">
                <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full" />
              </div>
              {/* User Info Skeleton */}
              <div className="flex-1 text-center md:text-left space-y-2 md:pb-2">
                <Skeleton className="h-8 w-44 sm:w-64 md:w-80 mx-auto md:mx-0 rounded" />
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 sm:gap-x-4 gap-y-2">
                  <Skeleton className="h-6 w-24 rounded" />
                  <Skeleton className="h-4 w-36 rounded" />
                </div>
              </div>
              {/* Registration Date Skeleton */}
              <div className="flex-col items-end text-right gap-1 hidden lg:flex">
                <Skeleton className="h-4 w-32 my-1 rounded" />
                <Skeleton className="h-4 w-24 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Sidebar, DESKTOP ONLY */}
          <div className="space-y-6 order-1 lg:order-2 hidden lg:block">
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center space-y-4">
                <Skeleton className="mx-auto rounded-full w-10 h-10 sm:w-14 sm:h-14" />
                <Skeleton className="h-5 w-32 mx-auto" />
                <Skeleton className="h-3 w-52 mx-auto" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-4 w-28 mx-auto" />
                </div>
                <Skeleton className="h-9 w-full rounded" />
              </CardContent>
            </Card>
          </div>

          {/* Form Card Skeleton */}
          <Card className="order-2 lg:order-1 lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                <div className="w-full sm:w-auto">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-4 w-32 mt-1" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </CardHeader>
            <CardContent>
              {/* Avatar Upload Skeleton */}
              <div className="space-y-3 mb-6">
                <Skeleton className="h-5 w-20" />
                <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                  <Skeleton className="w-20 h-20 sm:w-24 sm:h-24 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              </div>

              {/* Name & Phone Grid Skeleton */}
              <div className="grid gap-4 md:grid-cols-2 mb-6">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>

              {/* Email Field Skeleton */}
              <div className="space-y-2 mb-6">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-56" />
              </div>

              {/* Form Actions Skeleton */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t mt-4">
                <Skeleton className="h-4 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-10 w-20 rounded" />
                  <Skeleton className="h-10 w-32 rounded" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sidebar, MOBILE ONLY */}
          <div className="space-y-6 order-3 lg:hidden mt-4">
            <Card>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-36" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center space-y-4">
                <Skeleton className="mx-auto rounded-full w-10 h-10 sm:w-14 sm:h-14" />
                <Skeleton className="h-5 w-32 mx-auto" />
                <Skeleton className="h-3 w-52 mx-auto" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 mx-auto" />
                  <Skeleton className="h-4 w-32 mx-auto" />
                  <Skeleton className="h-4 w-28 mx-auto" />
                </div>
                <Skeleton className="h-9 w-full rounded" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
