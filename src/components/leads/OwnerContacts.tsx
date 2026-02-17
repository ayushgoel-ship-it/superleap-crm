import { Phone, User } from 'lucide-react';

type Channel = 'C2B' | 'GS' | 'C2D' | 'DCF';

interface OwnerContactsProps {
  channel: Channel;
  inspectionDone: boolean;
  tokenCollected: boolean;
  regNo: string; // To determine which PA to show
}

export function OwnerContacts({ channel, inspectionDone, tokenCollected, regNo }: OwnerContactsProps) {
  // DCF doesn't show RA/PA
  if (channel === 'DCF') {
    return null;
  }

  const raDetails = {
    name: 'Rajesh Kumar',
    email: 'rajesh.kumar@cars24.com',
    phone: '+91 98765 12001',
  };

  // Different PA details based on lead
  const getPADetails = () => {
    if (regNo === 'DL6CAC9999') {
      // C2B lead
      return {
        name: 'Ankit Sinha',
        email: 'ankit.sinha@cars24.com',
        phone: '+91 98200 44567',
      };
    } else if (regNo === 'HR26DK8888') {
      // C2D lead
      return {
        name: 'Sanjay Mehta',
        email: 'sanjay.mehta@cars24.com',
        phone: '+91 98111 33445',
      };
    } else {
      // Default PA for other leads
      return {
        name: 'Ankit Sinha',
        email: 'ankit.sinha@cars24.com',
        phone: '+91 98200 44567',
      };
    }
  };

  const paDetails = getPADetails();

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <h2 className="text-gray-900 mb-3">RA &amp; PA Details</h2>

      <div className="space-y-3">
        {/* RA Row */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-blue-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">RA</div>
            {inspectionDone ? (
              <>
                <div className="text-sm text-gray-900">{raDetails.name}</div>
                <div className="text-xs text-gray-600">{raDetails.email}</div>
              </>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Inspection pending – RA will be shown after inspection is done.
              </div>
            )}
          </div>

          {/* Phone Action */}
          {inspectionDone && (
            <a
              href={`tel:${raDetails.phone}`}
              className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-green-200 transition-colors"
            >
              <Phone className="w-4 h-4 text-green-600" />
            </a>
          )}
        </div>

        {/* PA Row - Now shown for C2B, GS, and C2D */}
        <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
          {/* Avatar */}
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-purple-600" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">PA</div>
            {tokenCollected ? (
              <>
                <div className="text-sm text-gray-900">{paDetails.name}</div>
                <div className="text-xs text-gray-600">{paDetails.email}</div>
              </>
            ) : (
              <div className="text-xs text-gray-500 italic">
                Token pending – PA will be shown after token is collected.
              </div>
            )}
          </div>

          {/* Phone Action */}
          {tokenCollected && (
            <a
              href={`tel:${paDetails.phone}`}
              className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-green-200 transition-colors"
            >
              <Phone className="w-4 h-4 text-green-600" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}