'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { getBrowserLanguage } from '@/messages';
import { createI18n, I18nContext } from '@/lib/i18n';

export default function Home() {
  const { data: session, status } = useSession();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [showNegativePrompt, setShowNegativePrompt] = useState(false);
  const [showProModal, setShowProModal] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [publicImages, setPublicImages] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [highQuality, setHighQuality] = useState(false);
  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showTermsOfService, setShowTermsOfService] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [i18n, setI18n] = useState<I18nContext | null>(null);

  // 初始化i18n
  useEffect(() => {
    // 从localStorage获取保存的语言设置，如果没有则使用浏览器默认语言
    const savedLanguage = localStorage.getItem('preferred-language') || getBrowserLanguage();
    setCurrentLanguage(savedLanguage);
    setI18n(createI18n(savedLanguage));
  }, []);

  // 语言变化时更新i18n实例
  useEffect(() => {
    if (currentLanguage) {
      const newI18n = createI18n(currentLanguage);
      setI18n(newI18n);
      // 保存语言偏好到localStorage
      localStorage.setItem('preferred-language', currentLanguage);
    }
  }, [currentLanguage]);

  // 在组件挂载后设置加载状态为false
  useEffect(() => {
    // 延迟一点时间再设置加载状态为false，确保会话信息已加载
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  // 加载public/images目录下的所有图片
  useEffect(() => {
    const loadPublicImages = async () => {
      try {
        // 在Next.js中，public文件夹下的文件可以直接通过/路径访问
        const imageFiles = Array.from({ length: 16 }, (_, i) => `/images/${i + 1}.webp`);
        setPublicImages(imageFiles);
      } catch (error) {
        console.error('加载图片时出错：', error);
      }
    };
    loadPublicImages();
  }, []);

  // 检查用户订阅状态
  useEffect(() => {
    if (session?.user?.email) {
      checkSubscription();
    }
  }, [session]);

  // 检查用户是否已订阅
  const checkSubscription = async () => {
    try {
      const response = await fetch('/api/subscription');
      if (response.ok) {
        const data = await response.json();
        setHasSubscription(!!data);
      }
    } catch (error) {
      console.error('检查订阅状态失败:', error);
    }
  };

  // 处理高质量切换
  const handleHighQualityToggle = () => {
    if (!session) {
      // 如果用户未登录，提示登录
      signIn();
      return;
    }
    
    if (!hasSubscription) {
      // 如果用户未订阅，显示订阅模态框
      setShowProModal(true);
      return;
    }
    
    // 用户已订阅，可以切换高质量选项
    setHighQuality(!highQuality);
  };

  const handleGenerate = async () => {
    if (!session) {
      // 如果用户未登录，提示登录
      signIn();
      return;
    }
    
    if (!prompt.trim()) return;
    
    // 检查高质量选项是否需要订阅
    if (highQuality && !hasSubscription) {
      setShowProModal(true);
      return;
    }
    
    // 开始生成图像
    try {
      setIsGenerating(true);
      setError(null);
      
      // // 非会员生成图像时增加一些延迟，模拟更慢的生成速度
      // if (!hasSubscription) {
      //   // 在API调用前增加2-4秒的延迟
      //   await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000));
      // }
      
      // 调用Next.js API代理路由
      const response = await fetch(`/api/generate?prompt=${encodeURIComponent(prompt)}${highQuality ? '&highQuality=true' : ''}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '生成图像失败');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // 将Base64编码的图像转换为可显示的URL
       // const imageUrls = data.images.map((base64: string) => `data:image/webp;base64,${base64}`);
        setImages(data.image_urls);
      } else {
        throw new Error(data.detail || '生成图像失败');
      }
    } catch (error) {
      console.error('生成图像时出错:', error);
      setError(error instanceof Error ? error.message : '生成图像时发生错误');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setImages([result, ...images.slice(0, 2)]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCloseProModal = () => {
    setShowProModal(false);
  };

  const handleImageClick = (image: string) => {
    setSelectedImage(image);
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  // 添加点击外部关闭用户菜单的功能
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-profile')) {
        setShowUserMenu(false);
      }
      if (showLanguageMenu && !target.closest('.language-selector')) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, showLanguageMenu]);

  // 从localStorage加载图片
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('generatedImages');
      if (storedData) {
        const { images: storedImages, timestamp } = JSON.parse(storedData);
        const now = new Date().getTime();
        // 检查是否超过10分钟 (600000毫秒)
        if (now - timestamp < 600000) {
          setImages(storedImages);
          // 计算过期时间并设置
          setExpiryTime(timestamp + 600000);
          
          // 设置定时器，到期时清除图片
          const timeLeft = 600000 - (now - timestamp);
          const timerId = setTimeout(() => {
            setImages([]);
            setExpiryTime(null);
            localStorage.removeItem('generatedImages');
          }, timeLeft);
          
          return () => clearTimeout(timerId);
        } else {
          // 已超过10分钟，清除存储
          localStorage.removeItem('generatedImages');
        }
      }
    } catch (error) {
      console.error('加载存储的图片时出错:', error);
    }
  }, []);

  // 当图片更新时，保存到localStorage
  useEffect(() => {
    if (images.length > 0) {
      try {
        const timestamp = new Date().getTime();
        const dataToStore = {
          images,
          timestamp
        };
        localStorage.setItem('generatedImages', JSON.stringify(dataToStore));
        setExpiryTime(timestamp + 600000);
      } catch (error) {
        console.error('保存图片到localStorage时出错:', error);
      }
    }
  }, [images]);
  
  // 倒计时功能
  const [timeLeft, setTimeLeft] = useState<string>('');
  
  useEffect(() => {
    if (!expiryTime) return;
    
    const updateTimeLeft = () => {
      const now = new Date().getTime();
      const remaining = expiryTime - now;
      
      if (remaining <= 0) {
        setTimeLeft('已过期');
        return;
      }
      
      // 计算分钟和秒数
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      
      setTimeLeft(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    };
    
    // 立即更新一次
    updateTimeLeft();
    
    // 每秒更新一次
    const intervalId = setInterval(updateTimeLeft, 1000);
    
    return () => clearInterval(intervalId);
  }, [expiryTime]);

  // 语言切换功能
  const toggleLanguageMenu = () => {
    setShowLanguageMenu(!showLanguageMenu);
  };

  const changeLanguage = (langCode: string) => {
    setCurrentLanguage(langCode);
    setShowLanguageMenu(false);
  };

  // 获取当前语言显示名称
  const getLanguageDisplayName = (langCode: string) => {
    const languages: {[key: string]: string} = {
      'en': 'English',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      'es': 'Español',
      'fr': 'Français',
      'ar': 'العربية',
      'de': 'Deutsch',
      'it': 'Italiano',
      'ru': 'Русский',
      'pt': 'Português',
      'nl': 'Nederlands',
      'pl': 'Polski',
      'ja': '日本語',
      'ko': '한국어',
      'hi': 'हिन्दी',
      'th': 'ไทย',
      'vi': 'Tiếng Việt',
      'id': 'Bahasa Indonesia',
      'tr': 'Türkçe',
      'he': 'עברית',
      'sv': 'Svenska',
      'fi': 'Suomi',
      'da': 'Dansk'
    };
    return languages[langCode] || 'English';
  };

  // 如果正在加载会话信息，显示加载状态
  if (status === "loading" || isLoading || !i18n) {
    return (
      <div className="loading-page">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // 翻译辅助函数
  const t = (key: string, params?: Record<string, string>) => {
    return i18n ? i18n.t(key, params) : key;
  };

  return (
    <>
      <div className="container">
        <div className="sidebar">
          <div className="logo-container">
            <Link href="/" className="logo-link">
              <div className="logo">
                <svg viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#E65900" />
                </svg>
              </div>
              <div className="logo-text">Lalaland</div>
            </Link>
          </div>

          <div className="input-section">
            <div className="input-header">
              <h3 className="input-title">{t('prompt_title')}</h3>
              <p className="input-subtitle">{t('prompt_subtitle')}</p>
            </div>
            
            <div className="textarea-container">
          <textarea 
            className="image-input" 
                placeholder={t('prompt_placeholder')} 
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          ></textarea>
          
              <div className="textarea-controls">
                <div className="options">
                  <div className="toggle-option">
                    <input
                      type="checkbox"
                      id="negativePromptToggle"
                      checked={showNegativePrompt}
                      onChange={() => setShowNegativePrompt(!showNegativePrompt)}
                    />
                    <label htmlFor="negativePromptToggle">{t('negative_prompt')}</label>
                  </div>
                  <div className="toggle-option">
                    <input
                      type="checkbox"
                      id="highQualityToggle"
                      checked={highQuality}
                      onChange={handleHighQualityToggle}
                    />
                    <label htmlFor="highQualityToggle">{t('high_quality')}</label>
                  </div>
                </div>
              </div>
            </div>
            
            {showNegativePrompt && (
              <div className="negative-prompt-container">
                <textarea 
                  className="negative-input" 
                  placeholder={t('negative_prompt_placeholder')} 
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                ></textarea>
              </div>
            )}
            
            <div className="button-group">
              <label className="upload-btn">
                <i className="fas fa-image"></i>
                <span></span>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
          <button 
            className="generate-btn" 
                onClick={() => handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
          >
                {isGenerating ? t('generating') : t('generate')}
          </button>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
          
          <div 
            className={`generated-images ${(images.length > 0 || isGenerating) ? 'visible' : ''}`}
          >
            {isGenerating ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                {hasSubscription ? (
                  <p>{t('ai_creating')}</p>
                ) : (
                  <div className="non-member-loading">
                    <p>{t('ai_creating')}</p>
                    <Link href="/subscribe" className="pro-speed-tip">
                      <i className="fas fa-bolt"></i>
                      <span>{t('pro_speed_tip')}</span>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <>
                {timeLeft && images.length > 0 && (
                  <div className="expiry-timer">
                    <i className="fas fa-clock"></i>
                    <span>{t('image_expiry')} {timeLeft} </span>
                  </div>
                )}
                {images.map((src, index) => (
                  <Image 
                    key={index} 
                    src={src} 
                    alt={`${t('generated_image')} ${index + 1}`} 
                    className="generated-image" 
                    onClick={() => handleImageClick(src)}
                    width={400}
                    height={400}
                  />
                ))}
              </>
            )}
          </div>

          <div className="footer">
            <div className="footer-links">
              <a href="#" className="footer-link" onClick={(e) => {
                e.preventDefault();
                setShowPrivacyPolicy(true);
              }}>Privacy Policy</a>
              <a href="#" className="footer-link" onClick={(e) => {
                e.preventDefault();
                setShowTermsOfService(true);
              }}>Terms of Service</a>
            </div>
            <div className="language-selector">
              <button className="language-btn" onClick={toggleLanguageMenu}>
                <i className="fas fa-globe"></i>
                {getLanguageDisplayName(currentLanguage)}
              </button>
              {showLanguageMenu && (
                <div className="language-dropdown">
                  <div className="language-group">
                    <h4>Global Languages</h4>
                    <button onClick={() => changeLanguage('en')} className={currentLanguage === 'en' ? 'active' : ''}>English</button>
                    <button onClick={() => changeLanguage('zh-CN')} className={currentLanguage === 'zh-CN' ? 'active' : ''}>简体中文</button>
                    <button onClick={() => changeLanguage('zh-TW')} className={currentLanguage === 'zh-TW' ? 'active' : ''}>繁體中文</button>
                    <button onClick={() => changeLanguage('es')} className={currentLanguage === 'es' ? 'active' : ''}>Español</button>
                    <button onClick={() => changeLanguage('fr')} className={currentLanguage === 'fr' ? 'active' : ''}>Français</button>
                    <button onClick={() => changeLanguage('ar')} className={currentLanguage === 'ar' ? 'active' : ''}>العربية</button>
                  </div>
                  <div className="language-group">
                    <h4>European Languages</h4>
                    <button onClick={() => changeLanguage('de')} className={currentLanguage === 'de' ? 'active' : ''}>Deutsch</button>
                    <button onClick={() => changeLanguage('it')} className={currentLanguage === 'it' ? 'active' : ''}>Italiano</button>
                    <button onClick={() => changeLanguage('ru')} className={currentLanguage === 'ru' ? 'active' : ''}>Русский</button>
                    <button onClick={() => changeLanguage('pt')} className={currentLanguage === 'pt' ? 'active' : ''}>Português</button>
                    <button onClick={() => changeLanguage('nl')} className={currentLanguage === 'nl' ? 'active' : ''}>Nederlands</button>
                    <button onClick={() => changeLanguage('pl')} className={currentLanguage === 'pl' ? 'active' : ''}>Polski</button>
                  </div>
                  <div className="language-group">
                    <h4>Asian Languages</h4>
                    <button onClick={() => changeLanguage('ja')} className={currentLanguage === 'ja' ? 'active' : ''}>日本語</button>
                    <button onClick={() => changeLanguage('ko')} className={currentLanguage === 'ko' ? 'active' : ''}>한국어</button>
                    <button onClick={() => changeLanguage('hi')} className={currentLanguage === 'hi' ? 'active' : ''}>हिन्दी</button>
                    <button onClick={() => changeLanguage('th')} className={currentLanguage === 'th' ? 'active' : ''}>ไทย</button>
                    <button onClick={() => changeLanguage('vi')} className={currentLanguage === 'vi' ? 'active' : ''}>Tiếng Việt</button>
                    <button onClick={() => changeLanguage('id')} className={currentLanguage === 'id' ? 'active' : ''}>Bahasa Indonesia</button>
                  </div>
                  <div className="language-group">
                    <h4>Other Languages</h4>
                    <button onClick={() => changeLanguage('tr')} className={currentLanguage === 'tr' ? 'active' : ''}>Türkçe</button>
                    <button onClick={() => changeLanguage('he')} className={currentLanguage === 'he' ? 'active' : ''}>עברית</button>
                    <button onClick={() => changeLanguage('sv')} className={currentLanguage === 'sv' ? 'active' : ''}>Svenska</button>
                    <button onClick={() => changeLanguage('fi')} className={currentLanguage === 'fi' ? 'active' : ''}>Suomi</button>
                    <button onClick={() => changeLanguage('da')} className={currentLanguage === 'da' ? 'active' : ''}>Dansk</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="main-content">
          <div className="header">
            <div className="header-title">
              <h1>{t('explore_ai_world')}</h1>
            </div>

            <div className="auth-buttons">
              {session ? (
                <div className="user-profile">
                  <div className="avatar" onClick={toggleUserMenu}>
                    <div className="avatar-icon">
                    <i className="fas fa-user"></i>
                    </div>
                  </div>
                  {showUserMenu && (
                    <div className="user-dropdown">
                      <div className="user-info">
                        <span className="user-name">{session.user?.name || t('user')}</span>
                        <span className="user-email">{session.user?.email || ''}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link href="/account" className="dropdown-item">
                        <i className="fas fa-id-card"></i>
                        {t('account_info')}
                      </Link>
                      <button 
                        className="dropdown-item"
                        onClick={() => signOut()}
                      >
                        <i className="fas fa-sign-out-alt"></i>
                        {t('logout')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/register" className="btn btn-outline">
                    {t('register')}
                  </Link>
                  <Link href="/login" className="btn btn-primary">
                    {t('login')}
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="scrollable-content">
            <div className="section">

              <div className="image-gallery">
                {publicImages.map((src, index) => (
                  <div key={index} className="gallery-item">
                    <Image 
                      src={src} 
                      alt={`${t('creative_image')} ${index + 1}`} 
                      className="gallery-img" 
                      onClick={() => handleImageClick(src)} 
                      width={400}
                      height={400}
                    />
                  <div className="gallery-info">
                      <h3 className="gallery-title">{t('creative_image')} {index + 1}</h3>
                      <p className="gallery-author">{t('from_gallery')}</p>
                  </div>
                </div>
                ))}
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h2 className="section-title">{t('popular_creators')}</h2>

              </div>
              <div className="creators-grid">
                {[1, 5, 9, 13].map((imageIndex, index) => (
                  <div key={index} className="creator-card">
                    <Image 
                      src={`/images/${imageIndex}.webp`} 
                      alt={`${t(`creators.${index}.name`)} - ${t(`creators.${index}.title`)}`} 
                      className="creator-img" 
                      width={180}
                      height={180}
                    />
                    <h3 className="creator-title">{t(`creators.${index}.name`)}</h3>
                    <p className="creator-subtitle">{t(`creators.${index}.title`)}</p>
                </div>
                ))}
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div className="preview-banner">
        <div className="preview-text">
          <div className="preview-title">Lalaland 预览版</div>
          <div>注册即可获得无限AI创意图像生成，偶尔会有广告。无需信用卡。</div>
        </div>
        <Link href="/register" className="signup-free-btn">免费注册</Link>
      </div> */}

      {selectedImage && (
        <div className="image-modal" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={handleCloseModal}>&times;</span>
            <Image src={selectedImage} alt="放大查看" className="modal-image" width={800} height={800} />
            <div className="modal-actions">
              <button className="modal-btn">
                <i className="fas fa-heart"></i> {t('like')}
              </button>
              <button className="modal-btn">
                <i className="fas fa-download"></i> {t('download')}
              </button>
              <button className="modal-btn">
                <i className="fas fa-share"></i> {t('share')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro版本升级模态框 */}
      {showProModal && (
        <div className="modal-overlay" onClick={handleCloseProModal}>
          <div className="pro-modal" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={handleCloseProModal}>&times;</span>
            <div className="pro-modal-content">
              <h2>升级到Pro版本</h2>
              <p>{highQuality ? '使用高质量图像生成功能' : '生成高质量图像'}需要升级到Pro版本</p>
              <div className="pro-features">
                <div className="feature">
                  <i className="fas fa-check-circle"></i>
                  <span>生成更高分辨率图像</span>
                </div>
                <div className="feature">
                  <i className="fas fa-check-circle"></i>
                  <span>更快的生成速度</span>
                </div>
                <div className="feature">
                  <i className="fas fa-check-circle"></i>
                  <span>优先使用GPU资源</span>
                </div>
                <div className="feature">
                  <i className="fas fa-check-circle"></i>
                  <span>无水印高清下载</span>
                </div>
              </div>
              <div className="pro-actions">
                <button className="cancel-btn" onClick={handleCloseProModal}>取消</button>
                <Link href="/subscribe" className="upgrade-btn">升级到Pro</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 隐私政策模态框 */}
      {showPrivacyPolicy && (
        <div className="modal-overlay" onClick={() => setShowPrivacyPolicy(false)}>
          <div className="privacy-modal" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setShowPrivacyPolicy(false)}>&times;</span>
            <div className="privacy-modal-content">
              <h2>Privacy Policy</h2>
              <p className="privacy-date">Last updated: January 10, 2024</p>
              
              <h3>1. Introduction</h3>
              <p>At Lalaland, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your information when you use our AI image generation service at Lalaland.app ("the Service").</p>
              
              <h3>2. Information We don&apos Collect</h3>
              <p>We are committed to minimal data collection. We do not:</p>
              <ul>
                <li>Require user registration or accounts</li>
                <li>Store your prompts or generated images</li>
                <li>Collect personal information</li>
                <li>Use cookies for tracking</li>
                <li>Share any data with third parties</li>
              </ul>
              
              <h3>3. Information We Process</h3>
              <p>The only information we process includes:</p>
              <ul>
                <li>Temporary text prompts during image generation</li>
                <li>Generated images during the creation process</li>
                <li>Basic usage analytics (non-personally identifiable)</li>
              </ul>
              
              <h3>4. How We Use Information</h3>
              <p>Any information processed is used solely for:</p>
              <ul>
                <li>Generating images in response to your prompts</li>
                <li>Improving the Service's performance and quality</li>
                <li>Maintaining service security and preventing abuse</li>
              </ul>
              
              <h3>5. Data Retention</h3>
              <p>We follow a strict no-storage policy. All prompts and generated images are processed in real-time and deleted immediately after generation. We do not maintain any database of user content.</p>
              
              <h3>6. Security Measures</h3>
              <p>We implement appropriate technical measures to protect against unauthorized access, alteration, or destruction of the limited data we process. Our service operates on secure, encrypted connections.</p>
              
              <h3>7. Children's Privacy</h3>
              <p>Our Service is not intended for children under 13 years of age. We do not knowingly collect or process information from children under 13.</p>
              
              <h3>8. Changes to Privacy Policy</h3>
              <p>We may update this Privacy Policy from time to time. We will notify users of any material changes by posting the new Privacy Policy on this page.</p>
              
              <h3>9. Your Rights</h3>
              <p>Since we don&apos collect personal data, there is typically no user data to:</p>
              <ul>
                <li>Access</li>
                <li>Correct</li>
                <li>Delete</li>
                <li>Export</li>
              </ul>
              
              <h3>10. Contact Information</h3>
              <p>If you have any questions about this Privacy Policy, please contact us at support@lalaland.land.</p>
              
              <h3>11. Legal Basis</h3>
              <p>We process the minimal required information based on legitimate interests in providing and improving the Service while maintaining user privacy and security.</p>
            </div>
          </div>
        </div>
      )}

      {/* 服务条款模态框 */}
      {showTermsOfService && (
        <div className="modal-overlay" onClick={() => setShowTermsOfService(false)}>
          <div className="privacy-modal terms-modal" onClick={(e) => e.stopPropagation()}>
            <span className="close-modal" onClick={() => setShowTermsOfService(false)}>&times;</span>
            <div className="privacy-modal-content">
              <h2>Terms of Service</h2>
              <p className="privacy-date">Last updated: January 10, 2024</p>
              
              <h3>1. Introduction</h3>
              <p>Welcome to Lalaland. By accessing or using our AI image generation service at Lalaland.app ("the Service"), you agree to be bound by these Terms of Service ("Terms"). Please read these Terms carefully before using the Service.</p>
              
              <h3>2. Service Description</h3>
              <p>Lalaland is a free AI image generation service powered by the FLUX.1-Dev model. We provide users with the ability to generate images from text descriptions without requiring registration or payment.</p>
              
              <h3>3. User Obligations</h3>
              <p>By using our Service, you agree to:</p>
              <ul>
                <li>Use the Service in compliance with all applicable laws and regulations</li>
                <li>Not attempt to circumvent any limitations or security measures</li>
                <li>Not use the Service for any illegal or unauthorized purposes</li>
                <li>Not interfere with or disrupt the Service or servers</li>
                <li>Not generate content that violates intellectual property rights or contains harmful material</li>
              </ul>
              
              <h3>4. Intellectual Property Rights</h3>
              <p>Images generated through our Service are provided under the Creative Commons Zero (CC0) license. You may use the generated images for any purpose, including commercial use, without attribution requirements. However, you acknowledge that certain prompts or outputs may be subject to third-party rights.</p>
              
              <h3>5. Privacy and Data Protection</h3>
              <p>Our privacy practices are outlined in our Privacy Policy. We do not store user prompts or generated images, and we do not require user registration or collect personal information.</p>
              
              <h3>6. Service Availability</h3>
              <p>While we strive to maintain continuous service availability, we do not guarantee uninterrupted access to the Service. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time without notice.</p>
              
              <h3>7. Content Guidelines</h3>
              <p>You agree not to generate:</p>
              <ul>
                <li>Content that violates any applicable laws or regulations</li>
                <li>Hateful, discriminatory, or offensive content</li>
                <li>Content that infringes on intellectual property rights</li>
                <li>Sexually explicit or pornographic content</li>
                <li>Content intended to harass, abuse, or harm others</li>
              </ul>
              
              <h3>8. Limitation of Liability</h3>
              <p>The Service is provided "as is" without any warranties. We shall not be liable for any damages arising from the use of the Service, including but not limited to direct, indirect, incidental, punitive, and consequential damages.</p>
              
              <h3>9. Changes to Terms</h3>
              <p>We reserve the right to modify these Terms at any time. Continued use of the Service after any changes constitutes acceptance of the new Terms. We will notify users of material changes by posting the updated Terms on this page.</p>
              
              <h3>10. Contact Information</h3>
              <p>If you have any questions about these Terms, please contact us at support@lalaland.land.</p>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          font-family: 'Montserrat', sans-serif;
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }
        
        *::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        body {
          background-color: #000;
          color: #fff;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .container {
          display: flex;
          flex: 1;
          overflow: hidden;
          gap: 0; /* 减少左右内容间距 */
        }

        .sidebar {
          width: 300px;
          background-color: #121212;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }

        .main-content {
          flex: 1;
          background-color: #121212;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          position: sticky;
          top: 0;
          background-color: rgba(18, 18, 18, 0.95);
          z-index: 100;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .scrollable-content {
          flex: 1;
          overflow-y: auto;
          padding: 0 16px 16px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background-color: #242424;
          border-radius: 24px;
          padding: 10px 18px;
          width: 340px;
          transition: all 0.3s ease;
        }
        
        .search-bar:hover {
          background-color: #2a2a2a;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .search-bar input {
          background: transparent;
          border: none;
          color: #fff;
          width: 100%;
          margin-left: 10px;
          outline: none;
          font-size: 14px;
          letter-spacing: 0.3px;
        }

        .nav-buttons {
          display: flex;
          gap: 20px;
        }

        .nav-link {
          color: #b3b3b3;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
        }

        .auth-buttons {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .btn {
          padding: 8px 24px;
          border-radius: 24px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          text-align: center;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          letter-spacing: 0.3px;
          transition: all 0.3s ease;
        }

        .btn-outline {
          border: none;
          background: transparent;
          color: #fff;
        }

        .btn-primary {
          background: #FB6107; /* 爱马仕橙色 */
          color: #fff;
          border: none;
          box-shadow: 0 4px 8px rgba(251, 97, 7, 0.3);
        }
        
        .btn-primary:hover {
          background: #FF8134; /* 爱马仕橙色亮色调 */
          box-shadow: 0 6px 12px rgba(251, 97, 7, 0.4);
          transform: translateY(-1px);
        }

        .section {
          margin-bottom: 40px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 24px;
          font-weight: 700;
        }

        .show-all {
          color: #b3b3b3;
          text-decoration: none;
          font-size: 14px;
          font-weight: 700;
        }

        .image-gallery {
          column-count: 4;
          column-gap: 8px;
          padding: 16px;
        }

        .gallery-item {
          position: relative;
          background-color: #1e1e1e;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          transition: transform 0.3s ease;
          break-inside: avoid;
          display: inline-block;
          width: 100%;
          margin-bottom: 8px;
        }

        @media (max-width: 1200px) {
          .image-gallery {
            column-count: 3;
          }
        }

        @media (max-width: 768px) {
          .container {
            flex-direction: column;
          }
          
          .sidebar {
            width: 100%;
            max-height: none;
            padding: 12px 10px;
          }
          
          .main-content {
            display: none;
          }
          
          .input-section {
            margin-bottom: 12px;
          }
          
          .input-title {
            font-size: 18px;
          }
          
          .image-input {
            min-height: 60px;
          }
          
          .button-group {
            margin-top: 8px;
          }
          
          .generated-images {
            max-height: 50vh;
          }
          
          .generated-image {
            max-height: 250px;
          }
          
          .footer {
            position: static;
            margin-top: 16px;
            max-width: 100%;
            transform: none;
            background-color: transparent;
            box-shadow: none;
            padding: 0;
          }
          
          .footer::before {
            display: none;
          }
          
          .footer-links {
            justify-content: center;
          }
          
          .language-btn {
            width: auto;
            margin: 0 auto;
          }
          
          .modal-content {
            max-width: 95%;
          }
          
          .pro-modal {
            width: 95%;
            padding: 16px;
          }
          
          .back-to-home {
            top: 10px;
            left: 10px;
          }
          
          .back-to-home a {
            padding: 6px 12px;
            font-size: 12px;
          }
          
          .nav-icons {
            justify-content: space-between;
            margin-bottom: 12px;
          }
          
          .logo-container {
            margin-bottom: 15px;
            padding: 3px 0;
          }
          
          .logo {
            width: 28px;
            height: 28px;
          }
          
          .logo-text {
            font-size: 18px;
          }
        }
        
        /* 小屏幕手机优化 */
        @media (max-width: 480px) {
          .sidebar {
            padding: 10px 8px;
          }
          
          .input-title {
            font-size: 16px;
          }
          
          .input-subtitle {
            font-size: 10px;
          }
          
          .footer-links {
            gap: 6px;
          }
          
          .footer-link {
            font-size: 10px;
          }
          
          .generated-images {
            padding: 6px;
          }
          
          .expiry-timer {
            font-size: 12px;
            padding: 6px 10px;
          }
          
          .pro-speed-tip {
            padding: 6px 12px;
            font-size: 11px;
          }
        }
        
        /* 确保页面在移动设备上正确缩放 */
        @media screen and (max-width: 768px) {
          html, body {
            overflow-x: hidden;
            width: 100%;
          }
        }

        .gallery-item:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.6);
        }

        .gallery-item:nth-child(3n) {
          /* 移除网格跨行设置 */
        }

        .gallery-item:nth-child(5n) {
          /* 移除网格跨列设置 */
        }

        .gallery-img {
          width: 100%;
          height: auto;
          display: block;
          object-fit: contain;
          vertical-align: bottom;
          transition: transform 0.3s ease;
          border-radius: 8px 8px 0 0;
        }

        .gallery-img:hover {
          transform: scale(1.02);
        }

        .gallery-info {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 10px;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 100%);
          color: white;
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .gallery-item:hover .gallery-info {
          opacity: 1;
        }
        
        .image-gallery::after {
          content: '';
          flex: auto;
        }
        
        .section .image-gallery {
          margin-bottom: 20px;
        }

        .gallery-title {
          font-weight: 700;
          margin-bottom: 5px;
          font-size: 16px;
        }

        .gallery-author {
          font-size: 12px;
          opacity: 0.8;
        }

        .creators-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 16px;
          padding: 8px;
        }

        .creator-card {
          background-color: #181818;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
          cursor: pointer;
          text-align: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          overflow: hidden;
        }

        .creator-card:hover {
          background-color: #282828;
          transform: translateY(-5px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.5);
        }

        .creator-img {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: 50%;
          margin-bottom: 16px;
          border: 3px solid #2a2a2a;
          transition: transform 0.3s ease;
        }

        .creator-card:hover .creator-img {
          transform: scale(1.05);
          border-color: #00C9FF;
        }

        .creator-title {
          font-weight: 700;
          margin-bottom: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .creator-subtitle {
          color: #b3b3b3;
          font-size: 14px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .footer {
          position: fixed;
          bottom: 20px;
          left: 20px;
          background-color: rgba(18, 18, 18, 0.8);
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          z-index: 10;
          max-width: 240px;
          transform: translateY(calc(100% - 40px));
          transition: transform 0.3s ease;
        }
        
        .footer:hover {
          transform: translateY(0);
        }
        
        .footer::before {
          content: "法律与隐私";
          display: block;
          color: #b3b3b3;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 10px;
          text-align: center;
        }
        
        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;
        }

        .footer-link {
          color: #b3b3b3;
          text-decoration: none;
          font-size: 11px;
          transition: color 0.2s ease;
        }
        
        .footer-link:hover {
          color: #ffffff;
          text-decoration: underline;
        }
        
        .language-selector {
          position: relative;
          display: inline-block;
        }
        
        .language-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          background-color: transparent;
          color: #fff;
          border: 1px solid #727272;
          border-radius: 16px;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          width: 100%;
        }
        
        .language-btn:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .language-dropdown {
          position: fixed;
          bottom: 60px;
          left: 20px;
          background-color: #1a1a1a;
          border-radius: 8px;
          box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          padding: 12px;
          width: 300px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          animation: fadeIn 0.2s ease;
        }
        
        .language-group {
          margin-bottom: 10px;
          grid-column: span 2;
        }
        
        .language-group h4 {
          font-size: 12px;
          color: #888;
          margin-bottom: 8px;
          padding-bottom: 4px;
          border-bottom: 1px solid #333;
        }
        
        .language-group button {
          background: transparent;
          border: none;
          color: #e0e0e0;
          padding: 6px 10px;
          text-align: left;
          font-size: 13px;
          cursor: pointer;
          width: 100%;
          border-radius: 4px;
          transition: all 0.2s ease;
          display: inline-block;
          width: calc(50% - 5px);
          margin: 0 0 5px 0;
        }
        
        .language-group button:hover {
          background-color: #333;
        }
        
        .language-group button.active {
          background-color: rgba(251, 97, 7, 0.2);
          color: #FB6107;
        }
        
        @media (max-width: 768px) {
          .language-dropdown {
            width: 280px;
            left: 10px;
            bottom: 50px;
            max-height: 300px;
          }
          
          .language-group button {
            width: 100%;
          }
        }

        .generated-images {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 16px;
          width: 100%;
          padding: 8px;
          background: #1a1a1a;
          border-radius: 8px;
          border: 1px solid #333;
          overflow-y: auto;
          max-height: 60vh;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.4s ease, transform 0.4s ease;
          visibility: hidden;
          height: 0;
          margin: 0;
          padding: 0;
        }
        
        .generated-images.visible {
          opacity: 1;
          transform: translateY(0);
          visibility: visible;
          height: auto;
          margin-bottom: 16px;
          padding: 8px;
        }

        .logo-container {
          display: flex;
          align-items: center;
          margin-bottom: 20px;
          padding: 5px 0;
        }
        
        .logo-link {
          display: flex;
          align-items: center;
          text-decoration: none;
          color: #fff;
          transition: transform 0.2s ease;
        }
        
        .logo-link:hover {
          transform: scale(1.05);
        }
        
        .logo {
          width: 32px;
          height: 32px;
          margin-right: 10px;
        }
        
        .logo-text {
          font-size: 20px;
          font-weight: 700;
          background: linear-gradient(90deg, #FB6107, #FF8134);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .header-title {
          font-size: 18px;
          color: #fff;
        }
        
        .header-title h1 {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }

        .nav-icons {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: center;
        }

        .nav-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #000;
          border-radius: 50%;
          color: #fff;
          transition: all 0.2s ease;
        }
        
        .nav-icon:hover {
          background-color: #333;
          transform: scale(1.1);
        }

        .home-icon {
          background-color: #282828;
        }
        
        .input-section {
          background-color: #1a1a1a;
          border-radius: 10px;
          padding: 12px;
          margin-bottom: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .input-header {
          margin-bottom: 10px;
        }

        .input-title {
          font-size: 14px;
          font-weight: 600;
          color: #e0e0e0;
          margin-bottom: 2px;
        }

        .input-subtitle {
          font-size: 11px;
          color: #888;
          font-weight: 400;
        }

        .textarea-container {
          position: relative;
          width: 100%;
          margin-bottom: 12px;
        }
        
        .image-input {
          background-color: #242424;
          border: 1px solid #333;
          border-radius: 6px;
          color: #e0e0e0;
          padding: 12px 14px;
          width: 100%;
          font-size: 14px;
          line-height: 1.4;
          letter-spacing: 0.2px;
          font-weight: 400;
          transition: all 0.3s ease;
          min-height: 80px;
          max-height: 200px;
          resize: vertical;
          overflow-wrap: break-word;
          white-space: pre-wrap;
          overflow-y: auto;
          font-family: 'Montserrat', sans-serif;
        }

        .textarea-controls {
          margin-top: 10px;
          width: 100%;
        }

        .options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .toggle-option {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .toggle-option input[type="checkbox"] {
          position: relative;
          width: 30px;
          height: 16px;
          -webkit-appearance: none;
          appearance: none;
          background-color: #333;
          border-radius: 8px;
          cursor: pointer;
          outline: none;
          transition: all 0.3s ease;
          margin: 0;
        }

        .toggle-option input[type="checkbox"]::before {
          content: '';
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          top: 2px;
          left: 2px;
          background-color: #999;
          transition: all 0.3s ease;
        }

        .toggle-option input[type="checkbox"]:checked::before {
          left: 16px;
          background-color: #d9a875;
        }

        .toggle-option label {
          color: #ccc;
          font-size: 12px;
          user-select: none;
        }
        
        .negative-prompt-container {
          margin-bottom: 12px;
          animation: fadeIn 0.3s ease;
        }

        .negative-input {
          background-color: #242424;
          border: 1px solid #333;
          border-radius: 6px;
          color: #ccc;
          padding: 10px 12px;
          width: 100%;
          font-size: 13px;
          line-height: 1.4;
          min-height: 60px;
          max-height: 150px;
          resize: vertical;
          font-family: 'Montserrat', sans-serif;
        }

        .negative-input:focus {
          outline: none;
          border-color: #555;
        }
        
        .button-group {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          width: 100%;
          margin-top: 12px;
        }

        .upload-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #333;
          color: #ddd;
          border: none;
          border-radius: 4px;
          padding: 6px;
          font-size: 11px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 32px;
          height: 32px;
          flex: 0 0 auto;
        }

        .upload-btn:hover {
          background-color: #444;
        }
        
        .upload-btn i {
          font-size: 14px;
        }

        .generate-btn {
          background-color: #FB6107; /* 爱马仕橙色 */
          color: #fff; /* 白色文字增加对比度 */
          border: none;
          border-radius: 4px;
          padding: 6px 14px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex: 0 1 auto;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 32px;
          min-width: 80px;
          box-shadow: 0 2px 4px rgba(251, 97, 7, 0.2);
        }

        .generate-btn:hover {
          background-color: #FF8134; /* 爱马仕橙色亮色调 */
          box-shadow: 0 3px 6px rgba(251, 97, 7, 0.3);
        }
        
        .generate-btn:disabled {
          background-color: rgba(251, 97, 7, 0.5); /* 半透明爱马仕橙 */
          color: rgba(255, 255, 255, 0.7);
          cursor: not-allowed;
          box-shadow: none;
        }

        .generated-image {
          width: 100%;
          height: auto;
          max-height: 300px;
          object-fit: contain;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
          border: 1px solid #333;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .generated-image:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
          border-color: #d9a875;
        }

        .image-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.9);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          position: relative;
          max-width: 90%;
          max-height: 90%;
          display: flex;
          flex-direction: column;
        }

        .close-modal {
          position: absolute;
          top: -20px;
          right: -20px;
          color: white;
          font-size: 24px;
          cursor: pointer;
          width: 30px;
          height: 30px;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
        }

        .modal-image {
          max-width: 100%;
          max-height: 80vh;
          object-fit: contain;
          border-radius: 8px;
        }

        .modal-actions {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 20px;
        }

        .modal-btn {
          background-color: #00C9FF;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }

        .modal-btn:hover {
          background-color: #0097c0;
        }

        .sidebar-preview {
          margin-bottom: 20px;
          padding: 10px;
          background: #181818;
          border-radius: 12px;
          border: 1px solid #2a2a2a;
        }

        .sidebar-preview-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 12px;
          color: #e0e0e0;
          text-align: center;
        }

        .sidebar-preview-images {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .preview-image-container {
          border-radius: 8px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .preview-image {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          transition: transform 0.3s ease;
          cursor: pointer;
        }

        .preview-image:hover {
          transform: scale(1.05);
        }

        .image-input:focus {
          outline: none;
          border-color: #444;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
        }

        .image-input::placeholder {
          color: #888;
          opacity: 1;
          font-size: 14px;
          font-style: normal;
        }

        .image-input::selection {
          background-color: rgba(0, 201, 255, 0.3);
          color: #fff;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1001;
          backdrop-filter: blur(4px);
        }

        .pro-modal {
          background-color: #1a1a1a;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          position: relative;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
          animation: scaleIn 0.3s ease;
        }

        .pro-modal-content {
          padding: 24px;
        }

        .pro-modal h2 {
          font-size: 24px;
          margin-bottom: 8px;
          background: linear-gradient(90deg, #d9a875, #e0b688);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }

        .pro-modal p {
          margin-bottom: 20px;
          color: #bbb;
          font-size: 15px;
        }

        .pro-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 24px;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .feature i {
          color: #d9a875;
          font-size: 16px;
        }

        .pro-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 20px;
        }

        .cancel-btn {
          background-color: transparent;
          color: #ccc;
          border: 1px solid #444;
          border-radius: 6px;
          padding: 8px 20px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .cancel-btn:hover {
          background-color: #333;
          color: #fff;
        }

        .upgrade-btn {
          background-color: #FB6107; /* 爱马仕橙色 */
          color: #fff; /* 白色文字 */
          border: none;
          border-radius: 6px;
          padding: 8px 20px;
          cursor: pointer;
          font-weight: 600;
          text-decoration: none;
          display: inline-block;
          text-align: center;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(251, 97, 7, 0.2);
        }

        .upgrade-btn:hover {
          background-color: #FF8134; /* 爱马仕橙色亮色调 */
          box-shadow: 0 3px 6px rgba(251, 97, 7, 0.3);
        }

        /* 用户头像和下拉菜单样式 */
        .user-profile {
          position: relative;
        }
        
        .avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background-color: #2a2a2a;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s ease;
          border: 2px solid transparent;
        }
        
        .avatar:hover {
          border-color: #FB6107;
          transform: scale(1.05);
        }
        
        .avatar-icon {
          color: #fff;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          background-color: #333;
        }
        
        .avatar-icon i {
          opacity: 0.9;
        }
        
        .avatar:hover .avatar-icon {
          background-color: #444;
        }
        
        .user-dropdown {
          position: absolute;
          top: 45px;
          right: 0;
          background: #1a1a1a;
          border-radius: 8px;
          min-width: 200px;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        
        .user-info {
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
        }
        
        .user-name {
          font-weight: 600;
          font-size: 14px;
          margin-bottom: 4px;
          color: #fff;
        }
        
        .user-email {
          font-size: 12px;
          color: #999;
        }
        
        .dropdown-divider {
          height: 1px;
          background-color: #333;
          margin: 4px 0;
        }
        
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          color: #e0e0e0;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        
        .dropdown-item:hover {
          background-color: #272727;
          color: #FB6107;
        }
        
        .dropdown-item i {
          font-size: 14px;
          width: 16px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 0;
          width: 100%;
        }
        
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid rgba(251, 97, 7, 0.1);
          border-radius: 50%;
          border-top: 4px solid #FB6107;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .loading-container p {
          color: #e0e0e0;
          font-size: 14px;
          margin: 0;
        }
        
        .error-message {
          background-color: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 10px;
          border-radius: 6px;
          margin-top: 12px;
          font-size: 14px;
          text-align: center;
        }

        .expiry-timer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: rgba(0, 0, 0, 0.6);
          color: #fff;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .expiry-timer i {
          color: #FF9A3C;
        }

        .non-member-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        
        .pro-speed-tip {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background-color: rgba(251, 97, 7, 0.15);
          color: #fff;
          border: 1px solid rgba(251, 97, 7, 0.3);
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 4px;
        }
        
        .pro-speed-tip:hover {
          background-color: rgba(251, 97, 7, 0.25);
          transform: translateY(-2px);
        }
        
        .pro-speed-tip i {
          color: #FB6107;
          font-size: 14px;
        }

        .loading-page {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          width: 100vw;
          background-color: #121212;
        }
        
        .loading-page .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(251, 97, 7, 0.2);
          border-radius: 50%;
          border-top: 4px solid #FB6107;
          animation: spin 1s linear infinite;
        }

        .privacy-modal {
          background-color: #1a1a1a;
          border-radius: 12px;
          width: 90%;
          max-width: 800px;
          max-height: 80vh;
          position: relative;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
          border: 1px solid #333;
          animation: scaleIn 0.3s ease;
          overflow-y: auto;
        }
        
        .privacy-modal-content {
          padding: 24px;
        }
        
        .privacy-modal h2 {
          font-size: 24px;
          margin-bottom: 8px;
          color: #FB6107;
        }
        
        .privacy-date {
          color: #888;
          font-size: 14px;
          margin-bottom: 20px;
        }
        
        .privacy-modal h3 {
          font-size: 18px;
          margin: 20px 0 10px;
          color: #e0e0e0;
        }
        
        .privacy-modal p {
          margin-bottom: 15px;
          color: #bbb;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .privacy-modal ul {
          margin-bottom: 15px;
          padding-left: 20px;
        }
        
        .privacy-modal li {
          color: #bbb;
          font-size: 14px;
          margin-bottom: 5px;
          line-height: 1.5;
        }
      `}</style>
    </>
  );
} 