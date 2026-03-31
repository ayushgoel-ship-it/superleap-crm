import { useState } from 'react';
import { Mail, User, Phone, MapPin, ArrowLeft, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase/client';
import { toast } from 'sonner@2.0.3';

interface SignupPageProps {
    onBack: () => void;
}

const ROLES = [
    { value: 'KAM', label: 'Key Account Manager (KAM)' },
    { value: 'TL', label: 'Team Lead (TL)' },
];

const REGIONS = ['NCR', 'West', 'South', 'East', 'North', 'Central'];

export function SignupPage({ onBack }: SignupPageProps) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [role, setRole] = useState('KAM');
    const [city, setCity] = useState('');
    const [region, setRegion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name.trim() || !email.trim()) {
            setError('Name and email are required');
            return;
        }

        // Domain validation
        if (!email.endsWith('@cars24.com')) {
            setError('Only @cars24.com email addresses are allowed');
            return;
        }

        if (!email.includes('@') || email.indexOf('@') === 0) {
            setError('Please enter a valid email address');
            return;
        }

        setIsLoading(true);

        try {
            const { error: insertError } = await supabase
                .from('signup_requests')
                .insert({
                    name: name.trim(),
                    email: email.trim().toLowerCase(),
                    phone: phone.trim() || null,
                    role,
                    city: city.trim() || null,
                    region: region || null,
                });

            if (insertError) {
                if (insertError.code === '23505') {
                    setError('A signup request with this email already exists');
                } else {
                    setError(insertError.message);
                }
                return;
            }

            setSubmitted(true);
            toast.success('Signup request submitted!');
        } catch (err: any) {
            setError(err.message || 'Failed to submit request');
        } finally {
            setIsLoading(false);
        }
    };

    // Success state
    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Submitted!</h2>
                        <p className="text-gray-600 mb-6">
                            Your access request has been sent to the admin team.
                            You'll be notified once it's approved.
                        </p>
                        <p className="text-sm text-gray-500 mb-6">
                            Submitted for: <strong>{email}</strong>
                        </p>
                        <button
                            onClick={onBack}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                            Back to Sign In
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4">
                        <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Request Access</h1>
                    <p className="text-gray-600 text-sm">SuperLeap CRM • CARS24</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name */}
                        <div>
                            <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 mb-1">
                                Full Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="signup-name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                                    placeholder="Amit Verma"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                                Work Email <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="signup-email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                                    placeholder="name@cars24.com"
                                />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Only @cars24.com emails are accepted</p>
                        </div>

                        {/* Phone */}
                        <div>
                            <label htmlFor="signup-phone" className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    id="signup-phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                                    placeholder="+91 98765 43210"
                                />
                            </div>
                        </div>

                        {/* Role */}
                        <div>
                            <label htmlFor="signup-role" className="block text-sm font-medium text-gray-700 mb-1">
                                Role <span className="text-red-500">*</span>
                            </label>
                            <select
                                id="signup-role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm bg-white"
                            >
                                {ROLES.map((r) => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* City + Region row */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="signup-city" className="block text-sm font-medium text-gray-700 mb-1">
                                    City
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <MapPin className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="signup-city"
                                        type="text"
                                        value={city}
                                        onChange={(e) => setCity(e.target.value)}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                                        placeholder="Gurugram"
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="signup-region" className="block text-sm font-medium text-gray-700 mb-1">
                                    Region
                                </label>
                                <select
                                    id="signup-region"
                                    value={region}
                                    onChange={(e) => setRegion(e.target.value)}
                                    className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm bg-white"
                                >
                                    <option value="">Select...</option>
                                    {REGIONS.map((r) => (
                                        <option key={r} value={r}>{r}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    Submitting...
                                </span>
                            ) : (
                                'Submit Request'
                            )}
                        </button>

                        {/* Back to login */}
                        <div className="text-center pt-2">
                            <button
                                type="button"
                                onClick={onBack}
                                className="text-sm text-gray-600 hover:text-gray-900 font-medium inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sign In
                            </button>
                        </div>
                    </form>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-xs text-gray-500">
                        🔒 Secured with Supabase Auth
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        SuperLeap CRM © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
