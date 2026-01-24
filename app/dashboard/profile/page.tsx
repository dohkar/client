"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authService } from "@/services/auth.service";
import { usersService } from "@/services/users.service";
import { uploadService, validateImageFile, ALLOWED_IMAGE_TYPES } from "@/services/upload.service";
import { useAuthStore } from "@/stores";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/react-query/query-keys";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState, useCallback, useRef } from "react";
import {
  Crown,
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Sparkles,
  ImageIcon,
  Check,
  AlertCircle,
  RefreshCw,
  Copy,
  Upload,
  Camera,
} from "lucide-react";
import { formatDate, formatPhoneInput } from "@/lib/utils/format";

// Схема валидации - avatar больше не нужен, загрузка отдельно
const profileSchema = z.object({
  name: z
    .string()
    .min(2, "Имя должно содержать минимум 2 символа")
    .max(50, "Имя не должно превышать 50 символов")
    .regex(/^[a-zA-Zа-яА-ЯёЁ\s-]+$/, "Имя может содержать только буквы, пробелы и дефисы"),
  phone: z
    .string()
    .optional()
    .refine(
      (val) => !val || /^\+?[0-9\s\-()]{10,20}$/.test(val),
      "Введите корректный номер телефона"
    ),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { setUser } = useAuthStore();
  const queryClient = useQueryClient();

  // Состояния для аватара
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Запрос данных пользователя
  const {
    data: currentUser,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: async () => {
      const response = await authService.getCurrentUser();
      if (response) {
        setUser({
          id: response.id,
          name: response.name,
          email: response.email,
          phone: response.phone,
          avatar: response.avatar,
          isPremium: response.isPremium,
          role: response.role as "user" | "premium" | "admin",
          createdAt: response.createdAt,
        });
      }
      return response;
    },
    staleTime: 0,
    refetchOnMount: true,
  });

  // Форма
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
    reset,
    setValue,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      phone: "",
    },
  });

  // Инициализация формы при загрузке данных
  useEffect(() => {
    if (currentUser) {
      reset({
        name: currentUser.name || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser, reset]);

  // Мутация обновления профиля
  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => usersService.updateUser(data),
    onSuccess: async () => {
      const updatedUser = await authService.getCurrentUser();
      const userForStore = {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        avatar: updatedUser.avatar,
        isPremium: updatedUser.isPremium,
        role: updatedUser.role as "user" | "premium" | "admin",
        createdAt: updatedUser.createdAt,
      };
      setUser(userForStore);
      queryClient.setQueryData(queryKeys.auth.user(), updatedUser);
      reset({
        name: updatedUser.name || "",
        phone: updatedUser.phone || "",
      });
      toast.success("Профиль успешно обновлен");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Ошибка обновления профиля");
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate(data);
  };

  // Обработчик выбора файла аватара
  const handleAvatarSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Валидация на клиенте
      const validationError = validateImageFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Создаем превью
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setIsAvatarUploading(true);

      try {
        // Загружаем на сервер
        const result = await uploadService.uploadAvatar(file);

        // Обновляем данные пользователя
        const updatedUser = await authService.getCurrentUser();
        const userForStore = {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          avatar: updatedUser.avatar,
          isPremium: updatedUser.isPremium,
          role: updatedUser.role as "user" | "premium" | "admin",
          createdAt: updatedUser.createdAt,
        };
        setUser(userForStore);
        queryClient.setQueryData(queryKeys.auth.user(), updatedUser);

        toast.success("Аватар успешно обновлен");

        // Очищаем локальное превью - теперь используем URL с сервера
        setAvatarPreview(null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Ошибка загрузки аватара");
        // Очищаем превью при ошибке
        setAvatarPreview(null);
      } finally {
        setIsAvatarUploading(false);
        // Очищаем input для возможности повторной загрузки того же файла
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Очищаем object URL
        URL.revokeObjectURL(previewUrl);
      }
    },
    [queryClient, setUser]
  );

  // Открытие диалога выбора файла
  const handleAvatarClick = useCallback(() => {
    if (!isAvatarUploading) {
      fileInputRef.current?.click();
    }
  }, [isAvatarUploading]);

  // Копирование ID
  const handleCopyId = async () => {
    if (currentUser?.id) {
      try {
        await navigator.clipboard.writeText(currentUser.id);
        toast.success("ID скопирован");
      } catch {
        toast.error("Не удалось скопировать");
      }
    }
  };

  // Сброс формы
  const handleReset = useCallback(() => {
    if (currentUser) {
      reset({
        name: currentUser.name || "",
        phone: currentUser.phone || "",
      });
    }
  }, [currentUser, reset]);

  // Получение инициалов
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  // Конфигурация роли
  const getRoleConfig = (role?: string, isPremium?: boolean) => {
    const roleUpper = role?.toUpperCase();
    if (roleUpper === "ADMIN") {
      return {
        icon: Shield,
        label: "Администратор",
        variant: "destructive" as const,
        gradient: "from-red-500/20 to-orange-500/20",
        color: "text-red-500",
      };
    }
    if (roleUpper === "PREMIUM" || isPremium) {
      return {
        icon: Crown,
        label: "Premium",
        variant: "default" as const,
        gradient: "from-amber-500/20 to-yellow-500/20",
        color: "text-amber-500",
      };
    }
    return {
      icon: User,
      label: "Пользователь",
      variant: "secondary" as const,
      gradient: "from-slate-500/20 to-gray-500/20",
      color: "text-muted-foreground",
    };
  };

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Spinner className="w-10 h-10 mx-auto" />
          <p className="text-sm text-muted-foreground">Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  // Состояние ошибки
  if (isError || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-destructive" />
            <div>
              <h3 className="font-semibold">Ошибка загрузки</h3>
              <p className="text-sm text-muted-foreground">
                Не удалось загрузить данные профиля
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const roleConfig = getRoleConfig(currentUser.role, currentUser.isPremium);
  const RoleIcon = roleConfig.icon;

  // Количество изменённых полей
  const changedFieldsCount = Object.keys(dirtyFields).length;

  // URL аватара для отображения: превью или текущий
  const displayAvatarUrl = avatarPreview || currentUser.avatar || undefined;

  // Mobile and desktop visibility helper classes
  // For "Детали аккаунта" и "Премиум предложение" (premium CTA) to render after form on mobile, before form on desktop:
  // Use: 'block lg:hidden' (mobile only), 'hidden lg:block' (desktop only)

  const AccountDetailsCard = (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Детали аккаунта
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Account ID */}
        {/* <div className="p-3 rounded-lg bg-muted/50 space-y-1">
          <p className="text-xs text-muted-foreground">ID аккаунта</p>
          <div className="flex items-center justify-between gap-2">
            <p className="font-mono text-xs truncate">{currentUser.id}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleCopyId}
              title="Копировать ID"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        </div> */}

        {/* Premium Status */}
        <div className="p-3 rounded-lg bg-muted/50 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5" />
            Premium статус
          </p>
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${currentUser.isPremium ? "bg-green-500" : "bg-gray-400"
                }`}
            />
            <p className="text-sm font-medium">
              {currentUser.isPremium ? "Активен" : "Не активен"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PremiumCtaCard = !currentUser.isPremium && (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 dark:border-amber-800">
      <CardContent className="p-4 sm:p-6 text-center space-y-4">
        <div className="w-10 h-10 sm:w-14 sm:h-14 mx-auto rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
          <Crown className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-base sm:text-lg">Станьте Premium</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Разблокируйте все возможности платформы
          </p>
        </div>
        <ul className="text-xs text-left space-y-2">
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span>Приоритетная поддержка</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span>Расширенная аналитика</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500 shrink-0" />
            <span>Без ограничений</span>
          </li>
        </ul>
        <Button className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md">
          <Sparkles className="w-4 h-4 mr-2" />
          Активировать Premium
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen py-4 px-1 md:px-4 md:py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="overflow-hidden">
          <div className={`h-20 sm:h-24 md:h-32 bg-gradient-to-r ${roleConfig.gradient}`} />
          <CardContent className="relative px-2 sm:px-4 pb-6 md:px-6">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-4 -mt-10 sm:-mt-12 md:-mt-16">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 border-4 border-background shadow-xl">
                  <AvatarImage
                    src={displayAvatarUrl}
                    alt={currentUser.name || "Аватар"}
                  />
                  <AvatarFallback className="text-xl sm:text-2xl md:text-3xl font-semibold bg-muted">
                    {getInitials(currentUser.name, currentUser.email)}
                  </AvatarFallback>
                </Avatar>
                {currentUser.isPremium && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg">
                    <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left space-y-1 sm:space-y-2 md:pb-2">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  {currentUser.name || "Имя не указано"}
                </h1>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 sm:gap-x-4 gap-y-2">
                  <Badge variant={roleConfig.variant} className="gap-1.5">
                    <RoleIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    {roleConfig.label}
                  </Badge>
                  {currentUser.email && (
                    <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1.5">
                      <Mail className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                      {currentUser.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Registration Date */}
              <div className="flex-col items-end text-right gap-1 text-muted-foreground hidden lg:flex">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  <p className="text-xs text-muted-foreground">
                    Дата регистрации:
                  </p>
                </div>
                <p className="text-sm font-medium">
                  {new Date(currentUser.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  <span className="mx-1">•</span>
                  {formatDate(currentUser.createdAt, "ru-RU", { relative: true, short: true })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Grid */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Sidebar, DESKTOP ONLY */}
          <div className="space-y-6 order-1 lg:order-2 hidden lg:block">
            {AccountDetailsCard}
            {PremiumCtaCard}
          </div>

          {/* Form Card */}
          <Card className="order-2 lg:order-1 lg:col-span-2">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
                <div className="w-full sm:w-auto">
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Личная информация
                  </CardTitle>
                  <CardDescription>
                    Обновите данные вашего профиля
                  </CardDescription>
                </div>
                {isDirty && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    {changedFieldsCount} {changedFieldsCount === 1 ? "изменение" : "изменения"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Avatar Upload Section */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                    Аватар
                  </Label>

                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    {/* Avatar Preview with Upload Button */}
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        disabled={isAvatarUploading}
                        className="relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-full"
                      >
                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-2 border-dashed border-muted-foreground/30 transition-all group-hover:border-primary/50">
                          <AvatarImage src={displayAvatarUrl} alt="Превью" />
                          <AvatarFallback className="bg-muted/50">
                            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                          </AvatarFallback>
                        </Avatar>

                        {/* Loading Overlay */}
                        {isAvatarUploading && (
                          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                            <Spinner className="w-8 h-8 text-white" />
                          </div>
                        )}

                        {/* Hover Overlay */}
                        {!isAvatarUploading && (
                          <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Camera className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </button>

                      {/* Hidden File Input */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={handleAvatarSelect}
                        className="hidden"
                      />
                    </div>

                    {/* Upload Instructions */}
                    <div className="flex-1 space-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAvatarClick}
                        disabled={isAvatarUploading}
                        className="gap-2"
                      >
                        {isAvatarUploading ? (
                          <>
                            <Spinner className="w-4 h-4" />
                            Загрузка...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4" />
                            Выбрать файл
                          </>
                        )}
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        JPG, PNG или WebP. Максимум 5MB.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Изображение будет автоматически оптимизировано.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Name & Phone Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      Имя
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      {...register("name")}
                      placeholder="Введите ваше имя"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* Phone Field */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      Телефон
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      {...register("phone", {
                        onChange: (e) => {
                          const formatted = formatPhoneInput(e.target.value);
                          setValue("phone", formatted, { shouldValidate: true });
                        },
                      })}
                      placeholder="+7 (999) 000-00-00"
                      className={errors.phone ? "border-destructive" : ""}
                    />
                    {errors.phone && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.phone.message}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Формат: +7 (XXX) XXX-XX-XX
                    </p>
                  </div>
                </div>

                {/* Email Field (Read Only) */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={currentUser.email || "Не указан"}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email привязан к аккаунту и не может быть изменён
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center sm:text-left">
                    {isDirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      disabled={!isDirty || updateMutation.isPending}
                    >
                      Отмена
                    </Button>
                    <Button
                      type="submit"
                      disabled={!isDirty || updateMutation.isPending}
                      className="min-w-[120px]"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Spinner className="w-4 h-4 mr-2" />
                          Сохранение...
                        </>
                      ) : (
                        "Сохранить"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Sidebar, MOBILE ONLY */}
          <div className="space-y-6 order-3 lg:hidden mt-4">
            {AccountDetailsCard}
            {PremiumCtaCard}
          </div>
        </div>
      </div>
    </div>
  );
}
