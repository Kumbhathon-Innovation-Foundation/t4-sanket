import React from 'react';
import { RouteTier, SupportedLanguage } from '../types';
export interface TierBadgeProps {
    tier: RouteTier;
    language?: SupportedLanguage;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
}
export declare const TierBadge: React.FC<TierBadgeProps>;
