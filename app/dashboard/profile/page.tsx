"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usersService } from "@/services/users.service";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { Spinner } from "@/components/ui/spinner";

const profileSchema = z.object({
  name: z.string().min(2, "Имя должно быть не менее 2 символов"),
  phone: z.string().optional(),
  avatar: z.string().url().optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: currentUser, isLoading } = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const response = await usersService.getCurrentUser();
      return response.data;
    },
    enabled: !!user,
    initialData: user ?? undefined,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: currentUser?.name || "",
      phone: currentUser?.phone || "",
      avatar: currentUser?.avatar || "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => usersService.updateUser(data),
    onSuccess: (response) => {
      if (response.status === "success" && response.data) {
        setUser(response.data);
        queryClient.setQueryData(queryKeys.auth.user(), response.data);
        toast.success("Профиль обновлен");
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка обновления профиля");
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-12'>
        <div className='flex justify-center'>
          <Spinner className='w-8 h-8' />
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-12'>
      <div className='max-w-2xl mx-auto'>
        <div className='mb-8'>
          <h1 className='text-3xl font-bold mb-2'>Профиль</h1>
          <p className='text-muted-foreground'>Управляйте информацией о себе</p>
        </div>

        <Card className='border-primary/20'>
          <CardHeader>
            <CardTitle>Личная информация</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Имя *</Label>
                <Input id='name' {...register("name")} placeholder='Ваше имя' />
                {errors.name && (
                  <p className='text-sm text-destructive'>
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={currentUser?.email || ""}
                  disabled
                  className='bg-muted'
                />
                <p className='text-xs text-muted-foreground'>
                  Email нельзя изменить
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='phone'>Телефон</Label>
                <Input
                  id='phone'
                  type='tel'
                  {...register("phone")}
                  placeholder='+7 (928) 000-00-00'
                />
                {errors.phone && (
                  <p className='text-sm text-destructive'>
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className='space-y-2'>
                <Label htmlFor='avatar'>URL аватара</Label>
                <Input
                  id='avatar'
                  type='url'
                  {...register("avatar")}
                  placeholder='https://example.com/avatar.jpg'
                />
                {errors.avatar && (
                  <p className='text-sm text-destructive'>
                    {errors.avatar.message}
                  </p>
                )}
              </div>

              <div className='flex justify-end'>
                <Button
                  type='submit'
                  className='btn-caucasus'
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
