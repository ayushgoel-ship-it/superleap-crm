import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, UserPlus, ChevronLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner@2.0.3';

interface AdminApprovalPanelProps {
    onBack: () => void;
}

interface SignupRequest {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    city: string | null;
    region: string | null;
    status: string;
    rejected_reason: string | null;
    created_at: string;
    reviewed_at: string | null;
}

export function AdminApprovalPanel({ onBack }: AdminApprovalPanelProps) {
    const [requests, setRequests] = useState<SignupRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [rejectReason, setRejectReason] = useState('');

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            let query = supabase
                .from('signup_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;
            if (error) throw error;
            setRequests(data || []);
        } catch (err: any) {
            toast.error('Failed to load requests: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [filter]);

    const handleApprove = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('You must be logged in');
                return;
            }

            const response = await supabase.functions.invoke('approve-signup', {
                body: { request_id: requestId, action: 'approve' },
            });

            if (response.error) {
                throw new Error(response.error.message || 'Failed to approve');
            }

            const result = response.data;
            if (result.error) {
                throw new Error(result.error);
            }

            toast.success(
                `✅ ${result.message}. Temp password: ${result.temp_password}`,
                { duration: 10000 }
            );
            fetchRequests();
        } catch (err: any) {
            toast.error('Approval failed: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string) => {
        setProcessingId(requestId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('You must be logged in');
                return;
            }

            const response = await supabase.functions.invoke('approve-signup', {
                body: {
                    request_id: requestId,
                    action: 'reject',
                    reason: rejectReason || 'Request rejected by admin',
                },
            });

            if (response.error) {
                throw new Error(response.error.message || 'Failed to reject');
            }

            const result = response.data;
            if (result.error) {
                throw new Error(result.error);
            }

            toast.success('Request rejected');
            setRejectingId(null);
            setRejectReason('');
            fetchRequests();
        } catch (err: any) {
            toast.error('Rejection failed: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'pending':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700"><Clock className="w-3 h-3" /> Pending</span>;
            case 'approved':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" /> Approved</span>;
            case 'rejected':
                return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" /> Rejected</span>;
            default:
                return null;
        }
    };

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-1 hover:bg-gray-100 rounded-lg">
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                            User Approvals
                            {filter === 'pending' && pendingCount > 0 && (
                                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{pendingCount}</span>
                            )}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Filter tabs */}
            <div className="bg-white border-b border-gray-200 px-4 py-2 flex gap-2">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-gray-500">Loading requests...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="text-center py-12">
                        <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter} requests</p>
                        <p className="text-sm text-gray-400 mt-1">
                            {filter === 'pending' ? 'All caught up! No pending approvals.' : 'No requests with this status.'}
                        </p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-gray-900">{req.name}</h3>
                                    <p className="text-sm text-gray-600">{req.email}</p>
                                </div>
                                {statusBadge(req.status)}
                            </div>

                            <div className="flex flex-wrap gap-2 mb-3">
                                <span className={`text-xs px-2 py-0.5 rounded ${req.role === 'KAM' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                    {req.role}
                                </span>
                                {req.city && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{req.city}</span>
                                )}
                                {req.region && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{req.region}</span>
                                )}
                                {req.phone && (
                                    <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600">{req.phone}</span>
                                )}
                            </div>

                            <p className="text-xs text-gray-400 mb-3">
                                Requested {new Date(req.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                            </p>

                            {req.status === 'rejected' && req.rejected_reason && (
                                <div className="bg-red-50 border border-red-100 rounded-lg p-2 mb-3">
                                    <p className="text-xs text-red-700 flex items-start gap-1">
                                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        {req.rejected_reason}
                                    </p>
                                </div>
                            )}

                            {/* Action buttons for pending requests */}
                            {req.status === 'pending' && (
                                <>
                                    {rejectingId === req.id ? (
                                        <div className="space-y-2">
                                            <textarea
                                                value={rejectReason}
                                                onChange={(e) => setRejectReason(e.target.value)}
                                                className="w-full text-sm border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                placeholder="Reason for rejection (optional)"
                                                rows={2}
                                            />
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleReject(req.id)}
                                                    disabled={processingId === req.id}
                                                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {processingId === req.id ? 'Rejecting...' : 'Confirm Reject'}
                                                </button>
                                                <button
                                                    onClick={() => { setRejectingId(null); setRejectReason(''); }}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleApprove(req.id)}
                                                disabled={processingId === req.id}
                                                className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                {processingId === req.id ? (
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Approve
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => setRejectingId(req.id)}
                                                disabled={processingId === req.id}
                                                className="flex-1 bg-white border border-red-300 text-red-600 py-2 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-1"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
