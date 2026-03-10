'use client';

import { ShieldAlert, ShieldCheck, ShieldX, OctagonAlert } from 'lucide-react';
import {
  anton,
  space,
  b5,
  roundedXl,
  shadow6,
  shadow8,
  maxW6Full,
} from '../../consts';

interface ScamRiskBannerProps {
  scamRiskScore: number;
  scamRiskLevel: string;
  scamRedFlags: string[];
}

function getRiskConfig(level: string) {
  switch (level) {
    case 'High':
      return {
        bg: 'bg-[#FF0000]',
        icon: ShieldX,
        label: 'HIGH RISK',
        textColor: 'text-white',
        flagBg: 'bg-white',
        flagBorder: 'border-red-600',
      };
    case 'Medium':
      return {
        bg: 'bg-[#FF6600]',
        icon: ShieldAlert,
        label: 'MEDIUM RISK',
        textColor: 'text-black',
        flagBg: 'bg-white',
        flagBorder: 'border-orange-600',
      };
    default:
      return {
        bg: 'bg-[#90EE90]',
        icon: ShieldCheck,
        label: 'LOW RISK',
        textColor: 'text-black',
        flagBg: 'bg-white',
        flagBorder: 'border-green-600',
      };
  }
}

export function ScamRiskBanner({
  scamRiskScore,
  scamRiskLevel,
  scamRedFlags,
}: ScamRiskBannerProps) {
  const config = getRiskConfig(scamRiskLevel);
  const Icon = config.icon;
  const scorePercent = Math.round(scamRiskScore * 100);

  return (
    <div className={`border-b-4 border-black ${config.bg} p-15`}>
      <div className={maxW6Full}>
        <div className={`bg-white ${b5} ${roundedXl} p-10 ${shadow8}`}>
          <div className="flex items-center gap-4 mb-6">
            <div className={`flex size-16 items-center justify-center ${roundedXl} ${b5} ${config.bg} ${shadow6}`}>
              <Icon className="size-8" strokeWidth={2.5} />
            </div>
            <div>
              <h2 className={`${anton} text-4xl uppercase text-black`}>
                SCAM DETECTION
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`${anton} text-2xl uppercase ${config.textColor} ${config.bg} px-3 py-1 ${b5} ${roundedXl}`}>
                  {config.label}
                </span>
                <span className={`${space} text-sm font-semibold text-gray-500`}>
                  Risk Score: {scorePercent}%
                </span>
              </div>
            </div>
          </div>

          {scamRedFlags.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scamRedFlags.map((flag, index) => (
                <div
                  key={`${flag}-${index + 1}`}
                  className={`flex items-center gap-4 ${roundedXl} ${b5} ${config.flagBg} p-4 ${shadow6}`}
                >
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${b5} bg-black`}>
                    <OctagonAlert className="size-5 text-white" />
                  </div>
                  <p className={`${space} text-sm font-semibold text-gray-700`}>
                    {flag}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className={`${space} text-base font-semibold text-gray-600`}>
              No red flags detected. This listing appears legitimate based on the available information.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
