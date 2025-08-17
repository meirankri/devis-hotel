"use client";

import React from "react";
import { MultiStepQuoteForm } from "@/components/quote/MultiStepQuoteForm";
import { User, Mail, Phone, Calendar, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Types
import type { Stay } from "@/types/quote";

interface QuoteFormProps {
  stay: Stay;
}

/**
 * QuoteFormV2 Component
 * Wrapper for the multi-step quote form
 */
export function QuoteFormV2({ stay }: QuoteFormProps) {
  return <MultiStepQuoteForm stay={stay} />;
}

// Sub-components for better organization - exported for use in MultiStepQuoteForm

export const PersonalInfoSection: React.FC<{
  register: any;
  errors: any;
  t: any;
}> = ({ register, errors, t }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
        <User className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{t("personalInfo")}</h3>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="firstName" className="text-gray-700 font-medium">
          {t("firstName")} *
        </Label>
        <Input
          id="firstName"
          {...register("firstName")}
          placeholder={t("firstNamePlaceholder")}
          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
        />
        {errors.firstName && (
          <p className="text-sm text-red-600 mt-1">
            {errors.firstName.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName" className="text-gray-700 font-medium">
          {t("lastName")} *
        </Label>
        <Input
          id="lastName"
          {...register("lastName")}
          placeholder={t("lastNamePlaceholder")}
          className="h-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
        />
        {errors.lastName && (
          <p className="text-sm text-red-600 mt-1">{errors.lastName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">
          {t("email")} *
        </Label>
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder={t("emailPlaceholder")}
            className="h-12 pl-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
          />
        </div>
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone" className="text-gray-700 font-medium">
          {t("phone")} *
        </Label>
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder={t("phonePlaceholder")}
            className="h-12 pl-12 border-2 border-gray-200 focus:border-blue-500 rounded-xl transition-colors"
          />
        </div>
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
        )}
      </div>
    </div>
  </div>
);

export const StayDatesSection: React.FC<{
  register: any;
  errors: any;
  nights: number;
  t: any;
}> = ({ register, errors, nights, t }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
        <Calendar className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">{t("stayDates")}</h3>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label htmlFor="checkIn" className="text-gray-700 font-medium">
          {t("checkIn")} *
        </Label>
        <Input
          id="checkIn"
          type="date"
          {...register("checkIn")}
          disabled={true}
          className="h-12 border-2 border-gray-200 rounded-xl bg-gray-50"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="checkOut" className="text-gray-700 font-medium">
          {t("checkOut")} *
        </Label>
        <Input
          id="checkOut"
          type="date"
          {...register("checkOut")}
          disabled={true}
          className="h-12 border-2 border-gray-200 rounded-xl bg-gray-50"
        />
      </div>
    </div>

    {nights > 0 && (
      <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200/50">
        <p className="text-center text-blue-800 font-semibold">
          {nights} {t("nights")}
        </p>
      </div>
    )}
  </div>
);

export const SpecialRequestsSection: React.FC<{
  register: any;
  t: any;
}> = ({ register, t }) => (
  <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-white/20 p-8">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
        <FileText className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">
        {t("specialRequests")}
      </h3>
    </div>

    <textarea
      id="specialRequests"
      {...register("specialRequests")}
      placeholder={t("specialRequestsPlaceholder")}
      rows={4}
      className="w-full p-4 border-2 border-gray-200 focus:border-blue-500 rounded-xl resize-none transition-colors"
    />
  </div>
);
