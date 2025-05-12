import { z } from "zod";

// 共通のフィールド
const emailField = z
  .string()
  .email({ message: "有効なメールアドレスを入力してください" });
const passwordField = z
  .string()
  .min(6, { message: "パスワードは6文字以上です" });

// ログイン
export const loginSchema = z.object({
  email: emailField,
  password: passwordField,
});

// メール送信
export const sendEmailSchema = z.object({
  email: emailField,
});

// パスワードリセット・サインアップ共通
const passwordWithConfirmSchema = z
  .object({
    password: passwordField,
    confirmPassword: passwordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

// パスワードリセット
export const resetPasswordSchema = passwordWithConfirmSchema;

// サインアップ
export const signupSchema = z
  .object({
    email: emailField,
    password: passwordField,
    confirmPassword: passwordField,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type SendEmailInput = z.infer<typeof sendEmailSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
