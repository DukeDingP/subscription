import en from './en';
import zhCN from './zh-CN';

// 导入更多语言...
// import zhTW from './zh-TW';
// import es from './es';
// import fr from './fr';
// 等等...

// 定义翻译消息类型
export type TranslationMessages = typeof en;

// 语言映射
const messages: { [key: string]: TranslationMessages } = {
  'en': en,
  'zh-CN': zhCN,
  // 'zh-TW': zhTW,
  // 'es': es,
  // 'fr': fr,
  // 等等...
};

// 获取指定语言的翻译
export const getMessages = (locale: string): TranslationMessages => {
  return messages[locale] || en; // 默认返回英文
};

// 获取浏览器默认语言
export const getBrowserLanguage = (): string => {
  if (typeof window === 'undefined') return 'en'; // 服务器端渲染时默认英文
  
  const browserLang = navigator.language;
  
  // 检查是否支持该语言
  if (messages[browserLang]) {
    return browserLang;
  }
  
  // 检查语言的主要部分是否支持（例如zh-CN的zh部分）
  const mainLang = browserLang.split('-')[0];
  const supportedVariant = Object.keys(messages).find(locale => locale.startsWith(mainLang + '-'));
  
  if (supportedVariant) {
    return supportedVariant;
  }
  
  // 默认返回英文
  return 'en';
};

// 支持的语言列表
export const supportedLocales = Object.keys(messages); 