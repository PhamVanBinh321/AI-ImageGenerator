import React from 'react';
import CreditIcon from '../../components/common/icons/CreditIcon';

interface CreditPackage {
    id: string;
    price: number;
    credits: number;
    bonus?: number;
    popular?: boolean;
}

interface BuyCreditsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentCredits: number;
    onSelectPackage: (packageId: string) => void;
}

const creditPackages: CreditPackage[] = [
    {
        id: 'package-1',
        price: 10000,
        credits: 10,
    },
    {
        id: 'package-2',
        price: 30000,
        credits: 35,
        bonus: 5,
        popular: true,
    },
    {
        id: 'package-3',
        price: 100000,
        credits: 130,
        bonus: 30,
    },
];

const BuyCreditsModal: React.FC<BuyCreditsModalProps> = ({
    isOpen,
    onClose,
    currentCredits,
    onSelectPackage,
}) => {
    if (!isOpen) return null;

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto custom-scrollbar-credit">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600/90 to-blue-600/90 p-6 rounded-t-2xl flex items-center justify-between z-10">
                    <div className="flex items-center space-x-3">
                        <CreditIcon className="h-8 w-8 text-yellow-400" />
                        <h2 className="text-2xl font-bold text-white">Mua Credit</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                        aria-label="Đóng"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Current Credits Info */}
                    <div className="mb-6 p-4 bg-gray-700/50 rounded-lg border border-gray-600/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <CreditIcon className="h-5 w-5 text-yellow-400" />
                                <span className="text-gray-300">Credit hiện tại:</span>
                            </div>
                            <span className="text-2xl font-bold text-yellow-400">
                                {currentCredits}
                            </span>
                        </div>
                    </div>

                    {/* Packages Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        {creditPackages.map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`relative bg-gradient-to-br ${pkg.popular
                                        ? 'from-purple-600/20 to-blue-600/20 border-2 border-purple-500/50'
                                        : 'from-gray-700/50 to-gray-800/50 border border-gray-600/50'
                                    } rounded-xl p-6 hover:scale-105 transition-all duration-300 cursor-pointer group`}
                                onClick={() => onSelectPackage(pkg.id)}
                            >
                                {/* Popular Badge */}
                                {pkg.popular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                                        PHỔ BIẾN
                                    </div>
                                )}

                                {/* Bonus Badge */}
                                {pkg.bonus && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-gray-900 text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                                        +{pkg.bonus} Bonus
                                    </div>
                                )}

                                <div className="text-center">
                                    {/* Price */}
                                    <div className="mb-4">
                                        <div className="text-3xl font-bold text-white mb-1">
                                            {formatPrice(pkg.price)}
                                        </div>
                                        <div className="text-sm text-gray-400">Thanh toán một lần</div>
                                    </div>

                                    {/* Credits */}
                                    <div className="mb-6">
                                        <div className="flex items-center justify-center space-x-2 mb-2">
                                            <CreditIcon className="h-6 w-6 text-yellow-400" />
                                            <span className="text-4xl font-bold text-yellow-400">
                                                {pkg.credits}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-400">Credit</div>
                                        {pkg.bonus && (
                                            <div className="mt-2 text-xs text-green-400 font-semibold">
                                                + {pkg.bonus} credit miễn phí
                                            </div>
                                        )}
                                    </div>

                                    {/* Value per credit */}
                                    <div className="mb-4 pb-4 border-b border-gray-600/50">
                                        <div className="text-xs text-gray-500">
                                            ~{formatPrice(Math.round(pkg.price / (pkg.credits + (pkg.bonus || 0))))} / credit
                                        </div>
                                    </div>

                                    {/* Select Button */}
                                    <button
                                        className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 ${pkg.popular
                                                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 shadow-lg shadow-purple-500/50'
                                                : 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                                            } group-hover:scale-105`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onSelectPackage(pkg.id);
                                        }}
                                    >
                                        Chọn gói
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Info Section */}
                    <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                        <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                            <svg
                                className="h-5 w-5 mr-2 text-blue-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            Thông tin
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-300">
                            <li className="flex items-start">
                                <span className="text-green-400 mr-2">✓</span>
                                <span>1 credit = 1 hình ảnh được tạo</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-400 mr-2">✓</span>
                                <span>Credit không có thời hạn sử dụng</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-400 mr-2">✓</span>
                                <span>Thanh toán an toàn và bảo mật</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-400 mr-2">✓</span>
                                <span>Credit được cộng ngay sau khi thanh toán thành công</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BuyCreditsModal;
