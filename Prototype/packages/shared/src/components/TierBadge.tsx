import React from 'react';
import { RouteTier, SupportedLanguage } from '../types';
import { DESIGN_TOKENS } from '../tokens';
import { ShieldAlert, Info, Cpu, CheckCircle } from 'lucide-react';

export interface TierBadgeProps {
  tier: RouteTier;
  language?: SupportedLanguage;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const TierBadge: React.FC<TierBadgeProps> = ({
  tier,
  language = 'hi',
  size = 'md',
  showIcon = true
}) => {
  const tierConfig =
    tier === 1
      ? DESIGN_TOKENS.tiers.tier1
      : tier === 2
      ? DESIGN_TOKENS.tiers.tier2
      : tier === 3
      ? DESIGN_TOKENS.tiers.tier3
      : DESIGN_TOKENS.tiers.tier4;

  const label =
    language === 'mr'
      ? tierConfig.label_mr
      : language === 'hi'
      ? tierConfig.label_hi
      : tierConfig.label_en;

  const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;

  const renderIcon = () => {
    switch (tier) {
      case 1:
        return <ShieldAlert size={iconSize} />;
      case 2:
        return <Info size={iconSize} />;
      case 3:
        return <Cpu size={iconSize} />;
      case 4:
      default:
        return <CheckCircle size={iconSize} />;
    }
  };

  const paddingStyle =
    size === 'sm'
      ? '2px 8px'
      : size === 'lg'
      ? '6px 14px'
      : '4px 10px';

  const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: paddingStyle,
        borderRadius: DESIGN_TOKENS.geometry.radiusPill,
        backgroundColor: tierConfig.bg,
        color: tierConfig.color,
        border: `1px solid ${tierConfig.border}`,
        fontWeight: 600,
        fontSize,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap'
      }}
    >
      {showIcon && renderIcon()}
      <span>{label}</span>
    </span>
  );
};
