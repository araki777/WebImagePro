import { z } from "zod";

const emailField = z.string().email({
  message: "有効なメールアドレスを入力してください",
});

const easyPasswordField = z
  .string()
  .min(1, { message: "パスワードを入力してください" });

const passwordField = z
  .string()
  .min(8, { message: "パスワードは8文字以上です" })
  .regex(/[a-z]/, { message: "パスワードには小文字を含めてください" })
  .regex(/[A-Z]/, { message: "パスワードには大文字を含めてください" })
  .regex(/[0-9]/, { message: "パスワードには数字を含めてください" })
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"|,.<>/?`~]/, {
    message: "パスワードには特殊文字を含めてください",
  });

export const loginSchema = z.object({
  email: emailField,
  password: easyPasswordField,
});

export const sendEmailSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  password: passwordField,
  confirmPassword: passwordField,
});

export const signupSchema = z.object({
  email: emailField,
  password: passwordField,
  confirmPassword: passwordField,
});
