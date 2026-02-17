import { Phone, User } from 'lucide-react';

interface KAMOwnerCardProps {
  kamName: string;
  kamPhone: string;
  kamEmail: string;
}

export function KAMOwnerCard({ kamName, kamPhone, kamEmail }: KAMOwnerCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h2 className="text-gray-900 mb-3">KAM Owner</h2>

      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-blue-600" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="text-sm text-gray-900 mb-0.5">{kamName}</div>
          <div className="text-xs text-gray-600">
            {kamPhone} • {kamEmail}
          </div>
        </div>

        {/* Phone Action */}
        <a
          href={`tel:${kamPhone}`}
          className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-green-200 transition-colors"
        >
          <Phone className="w-4 h-4 text-green-600" />
        </a>
      </div>
    </div>
  );
}
