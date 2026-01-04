"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";
import { ROUTES } from "@/constants";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setIsSent(true);
      toast.success("Инструкции отправлены на email");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ошибка отправки");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12'>
      <Card className='w-full max-w-md border-primary/20'>
        <CardHeader className='space-y-1 text-center'>
          <div className='mx-auto w-12 h-12 gradient-mountains rounded-lg flex items-center justify-center mb-4'>
            <span className='text-white font-bold text-xl'>Д</span>
          </div>
          <CardTitle className='text-2xl font-bold'>Восстановление пароля</CardTitle>
          <CardDescription>
            {isSent ? "Проверьте вашу почту" : "Введите email для восстановления пароля"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className='space-y-4 text-center'>
              <p className='text-muted-foreground'>
                Мы отправили инструкции по восстановлению пароля на адрес{" "}
                <strong>{email}</strong>
              </p>
              <Link href={ROUTES.login}>
                <Button variant='outline' className='w-full'>
                  Вернуться к входу
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  placeholder='your@email.com'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type='submit' className='w-full btn-caucasus' disabled={isLoading}>
                {isLoading ? "Отправка..." : "Отправить"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
