import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const [prompt, setPrompt] = useState('');
    const [optimizedPrompt, setOptimizedPrompt] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [currentTestimonial, setCurrentTestimonial] = useState(0);
    const [currentSlide, setCurrentSlide] = useState(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const onGetStarted = () => {
        navigate('/login');
    };

    // Hero slideshow images with placeholders
    const heroImages = [
        {
            url: '/assets/hero/cat-astronaut.jpg',
            placeholder: 'Một chú mèo trong bộ đồ phi hành gia, nền không gian tối với các vì sao...',
            position: 'center 40%', // Focus on the cat, avoid top area
        },
        {
            url: '/assets/hero/cat-bar.jpg',
            placeholder: 'Một chú mèo mặc yếm xanh, đang uống bia trong quán bar ấm áp...',
            position: 'center 50%', // Focus on the cat at bar
        },
        {
            url: '/assets/hero/farmer-buffalo.jpg',
            placeholder: 'Nông dân cày ruộng với trâu, cảnh đồng xanh tươi mát...',
            position: 'center 60%', // Focus on farmer and buffalo, avoid top
        },
    ];

    // Particle animation
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const particles: Array<{
            x: number;
            y: number;
            radius: number;
            speedX: number;
            speedY: number;
            opacity: number;
        }> = [];

        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.5,
                speedY: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2,
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
                if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;

                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(99, 102, 241, ${particle.opacity})`;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const testimonials = [
        {
            name: 'Nguyễn Văn A',
            role: 'Designer Pro',
            avatar: '👨‍🎨',
            text: "Prompt của tôi luôn mơ hồ, nhưng AI đã biến nó thành bức ảnh hoàn hảo! Tôi không thể tin được chất lượng.",
        },
        {
            name: 'Trần Thị B',
            role: 'Content Creator',
            avatar: '👩‍💼',
            text: "Tốc độ xử lý nhanh chóng, chỉ 5 giây là có ảnh. Công cụ này đã thay đổi cách tôi làm việc hoàn toàn.",
        },
        {
            name: 'Lê Văn C',
            role: 'Marketing Manager',
            avatar: '👨‍💻',
            text: "Tính năng tối ưu prompt thực sự thông minh. Tôi không cần phải là chuyên gia để tạo ra những hình ảnh đẹp.",
        },
    ];

    // Slideshow animation - Auto-rotate every 5 seconds
    // Start immediately, don't wait 5 seconds for first slide
    useEffect(() => {
        // Show first slide immediately
        setCurrentSlide(0);

        // Then rotate every 5 seconds
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [heroImages.length]);

    // Auto-rotate testimonials
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [testimonials.length]);

    const handleGenerate = () => {
        if (prompt.trim()) {
            // Simulate prompt optimization
            const optimized = `A highly detailed, professional ${prompt}, cinematic lighting, 4K resolution, vibrant colors, masterpiece quality`;
            setOptimizedPrompt(optimized);
            setShowPreview(true);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleGenerate();
        }
    };

    // Gallery images - Static images stored in /public/assets/gallery/
    const galleryImages = [
        {
            id: 1,
            image: '/assets/gallery/gallery-1.jpg',
            prompt: "Một lâu đài thủy tinh nổi giữa mây, ánh sáng hoàng hôn",
            category: "fantasy"
        },
        {
            id: 2,
            image: '/assets/gallery/gallery-2.jpg',
            prompt: "Thành phố tương lai với tòa nhà chọc trời, phong cách cyberpunk",
            category: "technology"
        },
        {
            id: 3,
            image: '/assets/gallery/gallery-3.jpg',
            prompt: "Rừng nhiệt đới với thác nước và ánh sáng xuyên qua lá",
            category: "nature"
        },
    ];

    return (
        <div className="min-h-screen text-white overflow-x-hidden relative font-inter">
            {/* Hero Section - Full Screen Slideshow */}
            <section className="relative h-screen w-full overflow-hidden">
                {/* Slideshow Background Images */}
                {heroImages.map((imageData, index) => (
                    <div
                        key={index}
                        className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                        style={{
                            backgroundImage: `url(${imageData.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: imageData.position, // Custom position to focus on subject
                            backgroundRepeat: 'no-repeat',
                            objectFit: 'cover',
                        }}
                    >
                        {/* Fallback gradient if image fails to load */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
                            style={{ display: 'none' }}
                            id={`fallback-${index}`}
                        />
                    </div>
                ))}

                {/* Dark Gradient Overlay - Stronger at top to protect header area, lighter in middle for text readability */}
                <div
                    className="absolute inset-0 z-20"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.6) 15%, rgba(0,0,0,0.4) 40%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.65) 100%)',
                    }}
                />

                {/* Additional overlay at top to ensure header area is protected */}
                <div
                    className="absolute top-0 left-0 right-0 h-20 z-20"
                    style={{
                        background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.95), transparent)',
                    }}
                />

                {/* Navigation - Fixed on top */}
                <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                                    <span className="text-white font-bold text-lg">AI</span>
                                </div>
                                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent font-poppins">
                                    Image Generator
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={onGetStarted}
                                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg shadow-indigo-500/50"
                                >
                                    Đăng nhập
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Text & UI Overlay - Centered, Fixed Position */}
                <div className="absolute inset-0 z-30 flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ top: '30%' }}>
                    <div className="max-w-4xl mx-auto text-center w-full">
                        {/* Main Title */}
                        <h1
                            className="text-4xl sm:text-5xl md:text-6xl lg:text-[48px] font-bold mb-6 leading-tight font-poppins"
                            style={{
                                background: 'linear-gradient(to right, #ffffff, #e0e7ff, #fce7f3)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                                textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 2px 10px rgba(0,0,0,0.6)',
                                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))',
                            }}
                        >
                            Tạo Ảnh AI Từ Câu Chữ
                        </h1>

                        {/* Subheader */}
                        <p
                            className="text-lg sm:text-xl md:text-[20px] mb-12 max-w-3xl mx-auto leading-relaxed font-poppins font-semibold"
                            style={{
                                color: '#ffffff',
                                opacity: 1,
                                textShadow: '0 2px 15px rgba(0,0,0,0.9), 0 1px 5px rgba(0,0,0,0.7)',
                            }}
                        >
                            Tối ưu prompt và tạo ảnh chất lượng cao trong 5 giây
                        </p>

                        {/* Input Section */}
                        <div className="mb-8 max-w-3xl mx-auto w-full sm:w-[90%]">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={heroImages[currentSlide]?.placeholder || "Nhập mô tả, ví dụ: 'Một thành phố tương lai dưới mưa sao băng, phong cách cyberpunk'..."}
                                    className="w-full h-14 sm:h-16 px-6 pr-32 bg-white rounded-[12px] text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all duration-300 font-poppins text-base sm:text-[16px] shadow-xl placeholder-animate"
                                    style={{ fontFamily: 'Poppins, sans-serif' }}
                                    key={`input-${currentSlide}`}
                                />
                                <button
                                    onClick={onGetStarted}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.03] shadow-lg font-poppins text-sm sm:text-base hero-glow-button"
                                    style={{
                                        background: 'linear-gradient(to right, #8b5cf6, #ec4899)',
                                    }}
                                >
                                    Tạo ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Live Preview Area - Below Hero */}
            {showPreview && (
                <section className="relative py-12 px-4 sm:px-6 lg:px-8 bg-slate-900" style={{ zIndex: 1 }}>
                    <div className="max-w-4xl mx-auto bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 animate-fadeIn">
                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-indigo-400">Prompt đã tối ưu:</h3>
                                <div className="bg-slate-900/50 rounded-lg p-4 text-sm">
                                    <p className="text-gray-300">
                                        {optimizedPrompt.split(' ').map((word, idx) => {
                                            const isNew = word.includes('highly') || word.includes('cinematic') || word.includes('4K') || word.includes('masterpiece');
                                            return (
                                                <span key={idx} className={isNew ? 'text-pink-400 font-semibold' : ''}>
                                                    {word}{' '}
                                                </span>
                                            );
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-3 text-indigo-400">Kết quả:</h3>
                                <div className="bg-slate-900/50 rounded-lg p-4 aspect-square flex items-center justify-center border-2 border-dashed border-slate-700">
                                    <div className="text-center">
                                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl mx-auto mb-3 flex items-center justify-center">
                                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-400 text-sm">Ảnh sẽ được hiển thị ở đây</p>
                                        <p className="text-gray-500 text-xs mt-1">Đăng nhập để tạo ảnh thật</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Features Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative bg-slate-900" style={{ zIndex: 1 }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-16 font-poppins">
                        <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                            Công nghệ đột phá đằng sau
                        </span>
                    </h2>

                    {/* Prompt Optimizer - Featured Section */}
                    <div className="mb-12 bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30 backdrop-blur-lg border-2 border-indigo-500/50 rounded-3xl p-8 md:p-10 shadow-2xl shadow-indigo-500/20">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/50">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-2xl md:text-3xl font-bold font-poppins bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                                    Prompt Optimizer
                                </h3>
                                <p className="text-gray-300 text-sm md:text-base mt-1">
                                    LLM tự động điều chỉnh prompt để đạt chất lượng ảnh tốt nhất
                                </p>
                            </div>
                        </div>

                        {/* Example: Before & After */}
                        <div className="relative mt-8">
                            <div className="grid md:grid-cols-2 gap-6">
                                {/* Before - User Input */}
                                <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                        <span className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Prompt gốc</span>
                                    </div>
                                    <p className="text-white text-base leading-relaxed font-poppins italic">
                                        "Một con mèo"
                                    </p>
                                </div>

                                {/* After - Optimized */}
                                <div className="bg-gradient-to-br from-indigo-900/40 to-pink-900/40 backdrop-blur-sm rounded-xl p-6 border-2 border-indigo-500/50">
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-sm font-semibold text-indigo-300 uppercase tracking-wide">Prompt đã tối ưu</span>
                                    </div>
                                    <p className="text-white text-base leading-relaxed font-poppins">
                                        "Một bức ảnh chuyên nghiệp, chi tiết cao về một chú mèo tabby màu cam dễ thương, đang ngồi thanh lịch,
                                        <span className="text-pink-400 font-semibold"> ánh sáng điện ảnh</span>,
                                        <span className="text-indigo-400 font-semibold"> nền tự nhiên mềm mại</span>,
                                        <span className="text-purple-400 font-semibold"> độ phân giải 4K</span>,
                                        <span className="text-yellow-400 font-semibold"> màu sắc sống động</span>,
                                        <span className="text-cyan-400 font-semibold"> chất lượng kiệt tác</span>,
                                        <span className="text-green-400 font-semibold"> nét sắc bén</span>"
                                    </p>
                                </div>
                            </div>

                            {/* Arrow - Desktop */}
                            <div className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>

                            {/* Arrow - Mobile */}
                            <div className="md:hidden flex items-center justify-center my-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50">
                                    <svg className="w-6 h-6 text-white rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Other Features */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        {/* Feature 2 */}
                        <div className="group bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 hover:border-pink-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-pink-500/20 mt-6 md:mt-0">
                            <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3 font-poppins">Đa dạng phong cách</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Hỗ trợ nghệ thuật số, anime, chân thực, vẽ tay...
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="group bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-cyan-500/20">
                            <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3 font-poppins">Tốc độ & Chất lượng</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Xử lý dưới 5s, độ phân giải 4K
                            </p>
                        </div>

                        {/* Feature 4 */}
                        <div className="group bg-slate-800/60 backdrop-blur-lg border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300 transform hover:scale-105 hover:shadow-xl hover:shadow-purple-500/20">
                            <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold mb-3 font-poppins">Tùy chỉnh nâng cao</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                Điều chỉnh ánh sáng, tỷ lệ khung hình, yếu tố nghệ thuật
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-4xl font-bold text-center mb-12 font-poppins">
                        <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
                            Khám phá sáng tạo từ cộng đồng
                        </span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {galleryImages.map((image) => (
                            <div
                                key={image.id}
                                className="group relative aspect-square rounded-xl overflow-hidden border border-slate-700/50 hover:border-indigo-500/50 transition-all duration-300 cursor-pointer"
                            >
                                {/* Image */}
                                <img
                                    src={image.image}
                                    alt={image.prompt}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                    onError={(e) => {
                                        // Fallback to gradient if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = target.nextElementSibling as HTMLElement;
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                                {/* Fallback gradient */}
                                <div
                                    className="w-full h-full hidden items-center justify-center bg-gradient-to-br from-indigo-900/20 to-pink-900/20"
                                >
                                    <div className="text-4xl">
                                        {image.category === 'fantasy' && '🏰'}
                                        {image.category === 'technology' && '🤖'}
                                        {image.category === 'nature' && '🌲'}
                                    </div>
                                </div>
                                {/* Overlay on hover */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                                    <div>
                                        <p className="text-white text-sm font-medium mb-1">Prompt:</p>
                                        <p className="text-gray-300 text-xs">{image.prompt}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-lg border border-slate-700/50 rounded-3xl p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-pink-500 to-indigo-500 opacity-50"></div>

                        <div className="relative">
                            <div className="text-center mb-8">
                                <div className="text-6xl mb-4">{testimonials[currentTestimonial].avatar}</div>
                                <p className="text-xl text-gray-300 italic mb-4 leading-relaxed">
                                    "{testimonials[currentTestimonial].text}"
                                </p>
                                <div className="mt-6">
                                    <p className="font-bold text-lg">{testimonials[currentTestimonial].name}</p>
                                    <p className="text-gray-400 text-sm">@{testimonials[currentTestimonial].role}</p>
                                </div>
                            </div>

                            <div className="flex justify-center gap-2 mt-8">
                                {testimonials.map((_, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setCurrentTestimonial(idx)}
                                        className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentTestimonial
                                                ? 'bg-indigo-500 w-8'
                                                : 'bg-slate-600 hover:bg-slate-500'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Call-to-Action Footer */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 relative" style={{ zIndex: 1 }}>
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl font-bold mb-6 font-poppins">
                        Sẵn sàng tạo nên kiệt tác?
                    </h2>
                    <p className="text-xl text-gray-300 mb-8">
                        Bắt đầu miễn phí và khám phá sức mạnh của AI
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={onGetStarted}
                            className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-indigo-500/50"
                        >
                            Đăng ký miễn phí
                        </button>
                        <button
                            className="px-10 py-4 bg-transparent border-2 border-slate-700 hover:border-indigo-500 rounded-xl font-semibold text-lg transition-all duration-300 backdrop-blur-sm"
                        >
                            Xem demo
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-700/50 relative" style={{ zIndex: 1 }}>
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-pink-500 rounded-xl flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">AI</span>
                                </div>
                                <span className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent font-poppins">
                                    Image Generator
                                </span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Tạo hình ảnh AI từ văn bản với công nghệ tiên tiến nhất.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Sản phẩm</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Về chúng tôi</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Tính năng</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Bảng giá</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Tài nguyên</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">API Docs</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Hướng dẫn</a></li>
                                <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-4">Kết nối</h4>
                            <div className="flex gap-4">
                                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                                    <span className="text-lg">📘</span>
                                </a>
                                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                                    <span className="text-lg">🐦</span>
                                </a>
                                <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-indigo-600 rounded-lg flex items-center justify-center transition-colors">
                                    <span className="text-lg">📷</span>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="pt-8 border-t border-slate-700/50 text-center text-gray-400 text-sm">
                        <p>&copy; 2025 AI Image Generator. Tất cả quyền được bảo lưu.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
