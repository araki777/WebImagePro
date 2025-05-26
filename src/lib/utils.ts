import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

type FileSize = {
  bytes: number;
};

type DateTime = {
  value: Date;
};

// フォーマッターの型マッピング
type FormatterTypeMap = {
  fileSize: FileSize;
  date: DateTime;
};

// フォーマッターの種類を型安全に定義
type FormatterType = keyof FormatterTypeMap;

interface IFormatter<T> {
  format(value: T): string;
}

// ファイルサイズフォーマッター
class FileSizeFormatter implements IFormatter<FileSize> {
  private readonly k = 1024;
  private readonly sizes = ["B", "KB", "MB", "GB"];

  format(fileSize: FileSize): string {
    if (fileSize.bytes === 0) return "0 B";
    const i = Math.floor(Math.log(fileSize.bytes) / Math.log(this.k));
    return `${parseFloat((fileSize.bytes / Math.pow(this.k, i)).toFixed(2))} ${this.sizes[i]}`;
  }
}

// 日付フォーマッター
class DateFormatter implements IFormatter<DateTime> {
  private readonly locale = "ja-JP";
  private readonly options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  };

  format(dateTime: DateTime): string {
    return new Intl.DateTimeFormat(this.locale, this.options).format(
      dateTime.value
    );
  }
}

// フォーマッターのファクトリー
class FormatterFactory {
  private static formatters = new Map<FormatterType, IFormatter<unknown>>();

  static {
    this.formatters.set("fileSize", new FileSizeFormatter());
    this.formatters.set("date", new DateFormatter());
  }

  static getFormatter<T extends FormatterType>(
    type: T
  ): IFormatter<FormatterTypeMap[T]> {
    const formatter = this.formatters.get(type);
    if (!formatter) {
      throw new Error(`Formatter not found for type: ${type}`);
    }
    return formatter as IFormatter<FormatterTypeMap[T]>;
  }
}

// ユーティリティ関数
export function formatFileSize(bytes: number): string {
  return FormatterFactory.getFormatter("fileSize").format({
    bytes,
  });
}

export function formatDate(date: Date): string {
  const dateTime: DateTime = { value: date };
  return FormatterFactory.getFormatter("date").format(dateTime);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
