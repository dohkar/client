"use client";

import { useState, type FormEvent } from "react";
import { Container } from "@/components/layout/Container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";

interface FormData {
  name: string;
  email: string;
  message: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const response = await fetch(`${API_URL}/api/inbox`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category: "CONTACT",
          severity: "MEDIUM",
          name: formData.name,
          email: formData.email,
          message: formData.message,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      setFormData({ name: "", email: "", message: "" });
      toast.success("Сообщение отправлено успешно!");
    } catch (error) {
      logger.error("Error submitting form:", error);
      toast.error("Произошла ошибка при отправке сообщения.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <Container size='md' className='py-6 sm:py-8 md:py-12'>
      <div className='space-y-6 sm:space-y-8'>
        <div className='text-center space-y-3 sm:space-y-4'>
          <h1 className='text-3xl sm:text-4xl font-bold text-foreground'>Контакты</h1>
          <p className='text-base sm:text-lg md:text-xl text-muted-foreground'>
            Свяжитесь с нами любым удобным способом
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8'>
          <Card className='shadow-lg border-primary/20'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-xl sm:text-2xl'>
                <MessageSquare className='w-5 h-5 text-primary' />
                Напишите нам
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form className='space-y-4' onSubmit={handleSubmit} noValidate>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Имя</Label>
                  <Input
                    id='name'
                    placeholder='Ваше имя'
                    value={formData.name}
                    onChange={handleChange}
                    required
                    autoComplete='name'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    placeholder='your@email.com'
                    value={formData.email}
                    onChange={handleChange}
                    required
                    autoComplete='email'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='message'>Сообщение</Label>
                  <Textarea
                    id='message'
                    rows={5}
                    placeholder='Ваше сообщение...'
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Button
                  type='submit'
                  className='w-full min-h-[44px]'
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Отправка..." : "Отправить"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className='space-y-4 sm:space-y-6'>
            <Card className='border-primary/20 hover:shadow-lg transition-shadow'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
                  <Mail className='w-5 h-5 text-primary' />
                  Email
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href='mailto:support@dohkar.ru'
                  className='text-primary hover:underline font-medium transition-colors'
                >
                  support@dohkar.ru
                </a>
              </CardContent>
            </Card>

            <Card className='border-primary/20 hover:shadow-lg transition-shadow'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
                  <Phone className='w-5 h-5 text-primary' />
                  Телефон
                </CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href='tel:+79990000000'
                  className='text-primary hover:underline font-medium transition-colors'
                >
                  +7 (999) 000-00-00
                </a>
              </CardContent>
            </Card>

            <Card className='border-primary/20 hover:shadow-lg transition-shadow'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-lg sm:text-xl'>
                  <MapPin className='w-5 h-5 text-primary' />
                  Адрес
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm sm:text-base text-foreground leading-relaxed'>
                  Магас, пр. Борова 2
                  <br />
                  Республика Ингушетия
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Container>
  );
}
