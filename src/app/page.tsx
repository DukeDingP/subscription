'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const { data: session } = useSession();
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

  const handleGenerate = async () => {
    if (!session) {
      // 如果用户未登录，提示登录
      signIn();
      return;
    }
    
    if (!prompt.trim()) return;
    
    // 开始生成图像
    try {
      setIsGenerating(true);
      setError(null);
      
      // 调用后端API生成图像

       // 调用Next.js API代理路由
      const response = await fetch(`/api/generate?prompt=${encodeURIComponent(prompt)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '生成图像失败');
      }
      
      const data = await response.json();
      
      if (data.status === 'success') {
        // 将Base64编码的图像转换为可显示的URL
        const imageUrls = data.images.map((base64: string) => `data:image/webp;base64,${base64}`);
        setImages(imageUrls);
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

  return (
    <>
      <div className="container">
        <div className="sidebar">
          <div className="nav-icons">
            <div className="logo">
              <svg viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10-4.48-10-10-10zm-1 14.5v-9l7 4.5-7 4.5z"/>
              </svg>
            </div>
            <div className="nav-icon home-icon">
              <i className="fas fa-home"></i>
            </div>
            <div className="nav-icon">
              <i className="fas fa-search"></i>
            </div>
          </div>

          <div className="input-section">
            <div className="input-header">
              <h3 className="input-title">描述提示词</h3>
              <p className="input-subtitle">请用英文输入提示词以获得最佳效果</p>
            </div>
            
            <div className="textarea-container">
          <textarea 
            className="image-input" 
                placeholder="您想看到什么？" 
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
                    <label htmlFor="negativePromptToggle">负面提示词</label>
                  </div>
                  <div className="toggle-option">
                    <input
                      type="checkbox"
                      id="highQualityToggle"
                      
                    />
                    <label htmlFor="highQualityToggle">高质量</label>
                  </div>
                </div>
              </div>
            </div>
            
            {showNegativePrompt && (
              <div className="negative-prompt-container">
                <textarea 
                  className="negative-input" 
                  placeholder="输入负面提示词（不希望出现在图像中的内容）" 
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
                {isGenerating ? '生成中...' : '生成'}
          </button>
            </div>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
          </div>
          
          <div className="generated-images">
            {isGenerating ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>AI正在创作中...</p>
              </div>
            ) : (
              images.map((src, index) => (
                <Image 
                  key={index} 
                  src={src} 
                  alt={`生成的图像 ${index + 1}`} 
                  className="generated-image" 
                  onClick={() => handleImageClick(src)}
                  width={400}
                  height={400}
                />
              ))
            )}
          </div>

          <div className="footer">
            <div className="footer-links">
              <a href="#" className="footer-link">法律条款</a>
              <a href="#" className="footer-link">安全与隐私中心</a>
              <a href="#" className="footer-link">隐私政策</a>
              <a href="#" className="footer-link">Cookie</a>
              <a href="#" className="footer-link">关于广告</a>
              <a href="#" className="footer-link">无障碍</a>
              <a href="#" className="footer-link">收集通知</a>
            </div>
            <button className="language-btn">
              <i className="fas fa-globe"></i>
              简体中文
            </button>
          </div>
        </div>

        <div className="main-content">
          <div className="header">
            <div className="search-bar">
              <i className="fas fa-search" style={{ color: "#b3b3b3" }}></i>
              <input type="text" placeholder="搜索图像或创意" />
            </div>
            <div className="nav-buttons">
              <a href="#" className="nav-link">高级会员</a>
              <a href="#" className="nav-link">支持</a>
              <a href="#" className="nav-link">下载</a>
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
                        <span className="user-name">{session.user?.name || '用户'}</span>
                        <span className="user-email">{session.user?.email || ''}</span>
                      </div>
                      <div className="dropdown-divider"></div>
                      <Link href="/account" className="dropdown-item">
                        <i className="fas fa-id-card"></i>
                        账户信息
                      </Link>
                  <button 
                        className="dropdown-item"
                    onClick={() => signOut()}
                  >
                        <i className="fas fa-sign-out-alt"></i>
                    退出登录
                  </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link href="/register" className="btn btn-outline">
                    注册
                  </Link>
                  <Link href="/login" className="btn btn-primary">
                    登录
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="scrollable-content">
            <div className="section">
              <div className="section-header">
                <h2 className="section-title">热门创意</h2>
                <a href="#" className="show-all">查看全部</a>
              </div>
              <div className="image-gallery">
                {publicImages.map((src, index) => (
                  <div key={index} className="gallery-item">
                    <Image 
                      src={src} 
                      alt={`创意图像 ${index + 1}`} 
                      className="gallery-img" 
                      onClick={() => handleImageClick(src)} 
                      width={400}
                      height={400}
                    />
                  <div className="gallery-info">
                      <h3 className="gallery-title">创意图像 {index + 1}</h3>
                      <p className="gallery-author">来自: 图片库</p>
                  </div>
                </div>
                ))}
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <h2 className="section-title">热门创作者</h2>
                <a href="#" className="show-all">查看全部</a>
              </div>
              <div className="creators-grid">
                {[1, 5, 9, 13].map((imageIndex, index) => (
                  <div key={index} className="creator-card">
                    <Image 
                      src={`/images/${imageIndex}.webp`} 
                      alt={`创作者 ${index + 1}`} 
                      className="creator-img" 
                      width={180}
                      height={180}
                    />
                    <h3 className="creator-title">{['张艺谋', '刘慈欣', '王家卫', '陈凯歌'][index]}</h3>
                    <p className="creator-subtitle">{['视觉艺术家', '科幻作家', '电影导演', '电影导演'][index]}</p>
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
                <i className="fas fa-heart"></i> 喜欢
              </button>
              <button className="modal-btn">
                <i className="fas fa-download"></i> 下载
              </button>
              <button className="modal-btn">
                <i className="fas fa-share"></i> 分享
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
              <p>生成高质量图像需要升级到Pro版本</p>
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
                <Link href="/subscription" className="upgrade-btn">升级到Pro</Link>
              </div>
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
          .image-gallery {
            column-count: 2;
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
          padding: 16px 0;
          border-top: 1px solid #282828;
          margin-top: 10px;
        }

        .footer-links {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-bottom: 16px;
        }

        .footer-link {
          color: #b3b3b3;
          text-decoration: none;
          font-size: 12px;
        }

        .language-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: transparent;
          color: #fff;
          border: 1px solid #727272;
          border-radius: 20px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
        }

        .preview-banner {
          background: linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%);
          padding: 12px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .preview-text {
          color: #fff;
          font-size: 14px;
        }

        .preview-title {
          font-weight: 700;
          margin-bottom: 4px;
        }

        .signup-free-btn {
          background-color: #fff;
          color: #000;
          border: none;
          border-radius: 20px;
          padding: 12px 32px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
        }

        .logo {
          width: 28px;
          height: 28px;
          margin-right: 4px;
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
      `}</style>
    </>
  );
} 