import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DESIGN_TOKENS } from '../tokens';
import { ShieldAlert, Info, Cpu, CheckCircle } from 'lucide-react';
export const TierBadge = ({ tier, language = 'hi', size = 'md', showIcon = true }) => {
    const tierConfig = tier === 1
        ? DESIGN_TOKENS.tiers.tier1
        : tier === 2
            ? DESIGN_TOKENS.tiers.tier2
            : tier === 3
                ? DESIGN_TOKENS.tiers.tier3
                : DESIGN_TOKENS.tiers.tier4;
    const label = language === 'mr'
        ? tierConfig.label_mr
        : language === 'hi'
            ? tierConfig.label_hi
            : tierConfig.label_en;
    const iconSize = size === 'sm' ? 12 : size === 'lg' ? 18 : 14;
    const renderIcon = () => {
        switch (tier) {
            case 1:
                return _jsx(ShieldAlert, { size: iconSize });
            case 2:
                return _jsx(Info, { size: iconSize });
            case 3:
                return _jsx(Cpu, { size: iconSize });
            case 4:
            default:
                return _jsx(CheckCircle, { size: iconSize });
        }
    };
    const paddingStyle = size === 'sm'
        ? '2px 8px'
        : size === 'lg'
            ? '6px 14px'
            : '4px 10px';
    const fontSize = size === 'sm' ? '11px' : size === 'lg' ? '14px' : '12px';
    return (_jsxs("span", { style: {
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
        }, children: [showIcon && renderIcon(), _jsx("span", { children: label })] }));
};
