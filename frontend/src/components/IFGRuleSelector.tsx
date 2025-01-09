import * as React from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { t } from "../translations";
import type { IFGRule } from "../types/highlights";
import { Select } from "./ui/Select";

interface IFGRuleSelectorProps {
  rules: IFGRule[];
  selectedRule?: IFGRule;
  onSelectRule: (rule: IFGRule | undefined) => void;
}

export function IFGRuleSelector({
  rules,
  selectedRule,
  onSelectRule,
}: IFGRuleSelectorProps) {
  const { language } = useLanguage();

  // Group rules by paragraph
  const groupedOptions = React.useMemo(() => {
    const groups: { [key: string]: IFGRule[] } = {};
    rules.forEach((rule) => {
      const paragraph = rule.reference.substring(0, 2); // Get §3, §4, §5, §6
      if (!groups[paragraph]) {
        groups[paragraph] = [];
      }
      groups[paragraph].push(rule);
    });

    return Object.entries(groups).map(([paragraph, paragraphRules]) => ({
      label: `§${paragraph[1]}`,
      options: paragraphRules.map(rule => ({
        value: rule.reference,
        label: rule.title,
        title: `${rule.reference}\n\n${rule.reason}\n\n${rule.full_text}`
      }))
    }));
  }, [rules]);

  return (
    <div className="mt-2">
      <Select
        value={selectedRule?.reference || ""}
        onChange={(e) => {
          const rule = rules.find((r) => r.reference === e.target.value);
          onSelectRule(rule);
        }}
        options={groupedOptions}
        placeholder={t(language, "ifgSelector.placeholder") || "Select IFG reason..."}
        size="sm"
        className="w-full text-neutral-text-primary bg-white"
        title={selectedRule
          ? `${selectedRule.reference}\n${selectedRule.reason}\n${selectedRule.url}`
          : undefined}
      />
    </div>
  );
}
