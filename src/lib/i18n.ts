import { getMessages } from '@/messages';

// 创建国际化上下文
export class I18nContext {
  private locale: string;
  private messages: Record<string, unknown>;

  constructor(locale: string) {
    this.locale = locale;
    this.messages = getMessages(locale);
  }

  // 获取翻译文本
  t(key: string, params?: Record<string, string>): string {
    // 支持嵌套键，如 'pro_features.higher_resolution'
    const keys = key.split('.');
    let value: unknown = this.messages;
    
    for (const k of keys) {
      if (!value || typeof value !== 'object' || !(k in (value as Record<string, unknown>))) {
        console.warn(`Translation key not found: ${key} for locale: ${this.locale}`);
        return key; // 如果找不到翻译，返回键名
      }
      value = (value as Record<string, unknown>)[k];
    }
    
    // 如果不是字符串，可能是一个对象
    if (typeof value !== 'string') {
      console.warn(`Translation value is not a string for key: ${key}`);
      return key;
    }
    
    // 处理参数替换，如 'Hello, {name}!' 替换为 'Hello, John!'
    if (params) {
      return Object.entries(params).reduce((text, [paramKey, paramValue]) => {
        return text.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
      }, value);
    }
    
    return value;
  }
  
  // 获取当前语言
  getLocale(): string {
    return this.locale;
  }
}

// 创建i18n实例
export const createI18n = (locale: string): I18nContext => {
  return new I18nContext(locale);
}; 