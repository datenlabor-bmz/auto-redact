import { IFGRule } from '../types/highlights'
import { useState } from 'react'
import { Tooltip } from './ui/Tooltip'
import { useLanguage } from '../contexts/LanguageContext'
import { t } from '../translations'

interface IFGRulePopupSelectorProps {
  rules: IFGRule[]
  onRuleSelect: (rule?: IFGRule) => void
}

function groupRulesByGroup (rules: IFGRule[]) {
  const groups: Record<string, IFGRule[]> = {}
  for (const rule of rules) {
    const group = rule.group || 'Ungrouped'
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(rule)
  }
  return groups
}

// Tooltip content component for a rule
const RuleTooltip = ({ rule }: { rule: IFGRule }) => (
  <div className='space-y-2'>
    <div className='font-medium'>IFG {rule.reference}</div>
    <div className='text-xs'>{rule.reason}</div>
    <div className='text-xs italic mt-1'>{rule.full_text}</div>
    {rule.url && (
      <a
        href={rule.url}
        target='_blank'
        rel='noopener noreferrer'
        className='text-xs text-blue-600 hover:underline block mt-1'
        onClick={e => e.stopPropagation()}
      >
        Gesetzestext
      </a>
    )}
  </div>
)

// Chevron icon component
const Chevron = ({ isExpanded }: { isExpanded: boolean }) => (
  <svg
    className='w-3 h-3 text-gray-500 flex-shrink-0'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
    xmlns='http://www.w3.org/2000/svg'
  >
    {isExpanded ? (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M19 9l-7 7-7-7'
      ></path>
    ) : (
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth='2'
        d='M9 5l7 7-7 7'
      ></path>
    )}
  </svg>
)

// Rule item component
const RuleItem = ({
  rule,
  onSelect
}: {
  rule: IFGRule
  onSelect: () => void
}) => (
  <Tooltip content={<RuleTooltip rule={rule} />} position='right'>
    <div
      onClick={onSelect}
      className='cursor-pointer hover:bg-gray-100 rounded px-2 py-0.5 text-sm block mb-0.5'
    >
      <span className='truncate inline-block'>{rule.title}</span>
    </div>
  </Tooltip>
)

export function IFGRulePopupSelector ({
  rules,
  onRuleSelect
}: IFGRulePopupSelectorProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {}
  )
  const ruleGroups = groupRulesByGroup(rules)
  const { language } = useLanguage()

  const toggleGroupExpansion = (group: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [group]: !prev[group]
    }))
  }

  return (
    <div className='bg-white border border-gray-300 rounded-md p-2 shadow-md max-w-xl w-full'>
      <div className='w-full'>
        {Object.entries(ruleGroups).map(([group, groupRules]) => {
          const hasSubsections = groupRules.length > 1
          const isExpanded = expandedGroups[group] || false

          return (
            <div key={group} className='mb-0.5 w-full'>
              {hasSubsections ? (
                <>
                  <div
                    className='flex items-center px-2 py-1 font-medium rounded cursor-pointer hover:bg-gray-100 w-full'
                    onClick={() => toggleGroupExpansion(group)}
                  >
                    <span className='mr-1.5 flex-shrink-0'>
                      <Chevron isExpanded={isExpanded} />
                    </span>
                    <span className='text-sm truncate'>{group}</span>
                  </div>

                  {isExpanded && (
                    <div className='ml-6 mt-0.5 flex flex-col'>
                      {groupRules.map(rule => (
                        <RuleItem
                          key={rule.reference}
                          rule={rule}
                          onSelect={() => onRuleSelect(rule)}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Tooltip
                  content={<RuleTooltip rule={groupRules[0]} />}
                  position='right'
                  className='block w-full'
                >
                  <div
                    className='flex items-center px-2 py-1.5 font-medium rounded cursor-pointer hover:bg-gray-100 w-full'
                    onClick={() => onRuleSelect(groupRules[0])}
                  >
                    <span className='text-sm truncate'>{group}</span>
                  </div>
                </Tooltip>
              )}
            </div>
          )
        })}
        <div className='w-full border-t pt-0.5'>
          <div
            className='flex items-center px-2 py-1 font-medium rounded cursor-pointer hover:bg-gray-100 w-full'
            onClick={() => onRuleSelect(undefined)}
          >
            <span className='text-sm truncate'>
              {t(language, 'ifgSelector.genericRedaction')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
