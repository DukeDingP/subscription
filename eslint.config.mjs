import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 添加自定义规则覆盖
  {
    rules: {
      "react/no-unescaped-entities": "off", // 彻底关闭规则
      // 或设置为 "warn"（仅警告不报错）
      // "react/no-unescaped-entities": "warn",
    },
  },
];

export default eslintConfig;
