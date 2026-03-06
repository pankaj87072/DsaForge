import React, { useState } from 'react';

const IdeaValidationPage = () => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [selectedPlan, setSelectedPlan] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const plans = [
        { id: '1_month', name: '1 Month Access', price: '₹299', description: 'Early access to all features' },
        { id: '3_months', name: '3 Months Access', price: '₹799', description: 'Best for interview prep' },
        { id: 'lifetime', name: 'Life-Time Access', price: '₹1999', description: 'One-time payment. Free updates for life!' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) {
            setError('Email is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/validation/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    phone,
                    pricing_plan: selectedPlan
                }),
            });

            if (response.ok) {
                setSubmitted(true);
            } else {
                const data = await response.json();
                setError(data.detail || 'Something went wrong. Please try again.');
            }
        } catch (err) {
            setError('Failed to connect to the server.');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 noise-bg">
                <div className="glass p-8 rounded-2xl max-w-md w-full text-center glow-green">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-4 gradient-text">Thank You!</h2>
                    <p className="text-gray-400 mb-6 font-medium">
                        We've locked in your interest. You'll be notified immediately when we launch!
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-green-500 to-blue-600 font-bold hover:opacity-90 transition-opacity"
                    >
                        Done
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12 noise-bg">
            <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-black mb-4 gradient-text">Design Your DSA Journey</h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
                        Join the elite circle of early adopters. Select a plan to validate our idea and secure your spot.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="glass p-8 rounded-2xl glow-purple">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-sm">1</span>
                            Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Email Address *</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className="w-full bg-[#0F0F1A] border border-gray-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number (Optional)</label>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+91 XXXXX XXXXX"
                                    className="w-full bg-[#0F0F1A] border border-gray-800 rounded-xl px-4 py-3 focus:border-purple-500 outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="glass p-8 rounded-2xl glow-orange">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-sm">2</span>
                            Choose Your Priority Plan
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan.id)}
                                    className={`cursor-pointer p-6 rounded-2xl border-2 transition-all relative overflow-hidden ${selectedPlan === plan.id
                                        ? 'border-orange-500 bg-orange-500/10 scale-105 shadow-2xl shadow-orange-500/20'
                                        : 'border-white/5 hover:border-white/10 bg-[#0F0F1A]/50'
                                        }`}
                                >
                                    {plan.id === 'lifetime' && (
                                        <div className="absolute top-0 right-0 bg-orange-500 text-black text-[10px] font-black px-2 py-1 rounded-bl-lg uppercase">
                                            Best Value
                                        </div>
                                    )}
                                    <div className="font-bold text-lg mb-1">{plan.name}</div>
                                    <div className={`font-black text-3xl mb-3 ${plan.id === 'lifetime' ? 'text-orange-400' : 'text-white'}`}>
                                        {plan.price}
                                    </div>
                                    <div className="text-sm text-gray-500 leading-relaxed">{plan.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-green-600 font-bold text-xl shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 ${loading ? 'animate-pulse' : ''}`}
                    >
                        {loading ? 'Submitting...' : 'Validate & Join Priority List'}
                    </button>

                    <p className="text-center text-gray-500 text-sm font-medium">
                        Secure your spot today. Pricing will increase after public launch.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default IdeaValidationPage;
