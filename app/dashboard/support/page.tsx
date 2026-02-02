"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { useAuthStore } from "@/stores";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, Loader2, CheckCircle, HelpCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { ROUTES, API_ENDPOINTS } from "@/constants";
import { logger } from "@/lib/utils/logger";

type SupportCategory = "QUESTION" | "PROBLEM" | "SUGGESTION" | "OTHER";

interface SupportFormData {
  category: SupportCategory | "";
  subject: string;
  message: string;
}

export default function SupportPage() {
  const { isAuthenticated, user, isInitialized, isLoading } = useAuthStore();

  const [formData, setFormData] = useState<SupportFormData>({
    category: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      redirect(ROUTES.login);
    }
  }, [isAuthenticated, isInitialized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category) {
      toast.error("Выберите тему обращения");
      return;
    }

    if (!formData.subject.trim()) {
      toast.error("Введите тему обращения");
      return;
    }

    if (!formData.message.trim()) {
      toast.error("Введите сообщение");
      return;
    }

    try {
      setIsSubmitting(true);
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const categoryLabels: Record<SupportCategory, string> = {
        QUESTION: "Вопрос",
        PROBLEM: "Проблема",
        SUGGESTION: "Предложение",
        OTHER: "Другое",
      };

      const fullMessage = `Тема: ${formData.subject}\nКатегория: ${categoryLabels[formData.category as SupportCategory]}\n\n${formData.message}`;

      const res = await fetch(`${API_URL}${API_ENDPOINTS.inbox.create}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          category: "CONTACT",
          severity: formData.category === "PROBLEM" ? "HIGH" : "MEDIUM",
          name: user?.name || "Пользователь",
          email: user?.email || undefined,
          phone: user?.phone || undefined,
          message: fullMessage,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit support request");
      }

      setIsSuccess(true);
      setFormData({ category: "", subject: "", message: "" });
      toast.success("Обращение отправлено");
    } catch (error) {
      logger.error("Failed to submit support request", error);
      toast.error("Не удалось отправить обращение");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className='min-h-[calc(100vh-65px)] bg-muted/30'>
      <div className='container mx-auto px-4 py-6 sm:py-8 md:py-12'>
        <div className='max-w-2xl mx-auto'>
          {/* Back button */}
          <Link
            href={ROUTES.dashboard}
            className='inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6'
          >
            <ArrowLeft className='w-4 h-4' />
            Назад в личный кабинет
          </Link>

          <div className='mb-6 sm:mb-8'>
            <h1 className='text-2xl sm:text-3xl font-bold text-foreground mb-2 flex items-center gap-3'>
              <HelpCircle className='w-7 h-7 text-primary' />
              Поддержка
            </h1>
            <p className='text-sm sm:text-base text-muted-foreground'>
              Есть вопросы или предложения? Напишите нам, и мы ответим в ближайшее время.
            </p>
          </div>

          {isSuccess ? (
            <Card className='border-green-500/30'>
              <CardContent className='p-8 text-center'>
                <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
                <h2 className='text-xl font-semibold mb-2'>Обращение отправлено</h2>
                <p className='text-muted-foreground mb-6'>
                  Мы получили ваше сообщение и ответим в ближайшее время на указанный
                  email.
                </p>
                <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                  <Button onClick={() => setIsSuccess(false)} variant='outline'>
                    Отправить ещё
                  </Button>
                  <Link href={ROUTES.dashboard}>
                    <Button>Вернуться в кабинет</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Форма обращения</CardTitle>
                <CardDescription>
                  Заполните форму ниже, и мы свяжемся с вами
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className='space-y-5'>
                  {/* Category */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Тема обращения *</label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          category: value as SupportCategory,
                        }))
                      }
                    >
                      <SelectTrigger className='w-full'>
                        <SelectValue placeholder='Выберите тему' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='QUESTION'>Вопрос</SelectItem>
                        <SelectItem value='PROBLEM'>Проблема / Жалоба</SelectItem>
                        <SelectItem value='SUGGESTION'>Предложение</SelectItem>
                        <SelectItem value='OTHER'>Другое</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subject */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Краткая тема *</label>
                    <Input
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      placeholder='О чём ваше обращение?'
                      maxLength={100}
                    />
                  </div>

                  {/* Message */}
                  <div className='space-y-2'>
                    <label className='text-sm font-medium'>Сообщение *</label>
                    <Textarea
                      value={formData.message}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, message: e.target.value }))
                      }
                      placeholder='Опишите подробнее ваш вопрос или проблему...'
                      className='min-h-[150px] resize-none'
                      maxLength={2000}
                    />
                    <p className='text-xs text-muted-foreground text-right'>
                      {formData.message.length} / 2000
                    </p>
                  </div>

                  {/* User info */}
                  <div className='bg-muted/50 rounded-lg p-4 text-sm'>
                    <p className='text-muted-foreground mb-1'>Ответ придёт на:</p>
                    <p className='font-medium'>{user?.email || "Не указан email"}</p>
                  </div>

                  {/* Submit */}
                  <Button
                    type='submit'
                    className='w-full min-h-[44px]'
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                        Отправка...
                      </>
                    ) : (
                      <>
                        <Send className='w-4 h-4 mr-2' />
                        Отправить обращение
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
