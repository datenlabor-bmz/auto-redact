import * as React from 'react';
import { IFGRule } from '../types/highlights';
import { useLanguage } from '../contexts/LanguageContext';
import { t } from '../translations';

interface IFGRuleSelectorProps {
  rules: IFGRule[];
  selectedRule?: IFGRule;
  onSelectRule: (rule: IFGRule | undefined) => void;
}

export function IFGRuleSelector({ rules, selectedRule, onSelectRule }: IFGRuleSelectorProps) {
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = React.useState(false);

  // Group rules by paragraph
  const groupedRules = React.useMemo(() => {
    const groups: { [key: string]: IFGRule[] } = {};
    rules.forEach(rule => {
      const paragraph = rule.reference.substring(0, 2); // Get §3, §4, §5, §6
      if (!groups[paragraph]) {
        groups[paragraph] = [];
      }
      groups[paragraph].push(rule);
    });
    return groups;
  }, [rules]);

  return (
    <div style={{ position: 'relative', marginTop: '0.5rem' }}>
      <select
        value={selectedRule?.reference || ''}
        onChange={(e) => {
          const rule = rules.find(r => r.reference === e.target.value);
          onSelectRule(rule);
        }}
        style={{
          width: '100%',
          padding: '0.4rem',
          fontSize: '0.75rem',
          color: '#1e293b',
          backgroundColor: '#fff',
          border: '1px solid #e2e8f0',
          borderRadius: '4px',
          cursor: 'pointer',
          outline: 'none',
        }}
        title={selectedRule ? `${selectedRule.reference}\n${selectedRule.reason}\n${selectedRule.url}` : undefined}
      >
        <option value="">{t(language, 'ifgSelector.placeholder') || 'Select IFG reason...'}</option>
        {Object.entries(groupedRules).map(([paragraph, paragraphRules]) => (
          <optgroup key={paragraph} label={`§${paragraph[1]}`}>
            {paragraphRules.map((rule) => (
              <option key={rule.reference} value={rule.reference} title={`${rule.reference}\n\n${rule.reason}\n\n${rule.full_text}`}>
                {rule.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
} 