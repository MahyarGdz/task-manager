import { Button, Dialog, DialogTrigger, Popover } from 'react-aria-components'
import { setPref, usePrefs } from '../../lib/prefs'
import { Settings } from '../../ui/icons'
import { Segmented } from '../../ui/segmented'

/** Linear's "Display" popover: layout and grouping, remembered per machine. */
export function DisplayMenu({ canBoard = true }: { canBoard?: boolean }) {
  const { view, groupBy } = usePrefs()
  return (
    <DialogTrigger>
      <Button className="flex h-7 items-center gap-1.5 rounded-md border border-border px-2 text-xs text-ink-2 outline-none hover:bg-hover hover:text-ink focus-visible:ring-2 focus-visible:ring-brand">
        <Settings size={14} /> نمایش
      </Button>
      <Popover
        placement="bottom end"
        offset={4}
        className="ui-popover w-72 rounded-xl border border-border bg-surface p-3 shadow-pop outline-none"
      >
        <Dialog aria-label="تنظیمات نمایش" className="space-y-3 outline-none">
          {canBoard && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs text-ink-2">چیدمان</span>
              <Segmented
                label="چیدمان"
                value={view}
                onChange={(v) => setPref('view', v)}
                options={[
                  { id: 'list', label: 'لیست' },
                  { id: 'board', label: 'برد' }
                ]}
              />
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-ink-2">گروه‌بندی</span>
            <Segmented
              label="گروه‌بندی"
              value={groupBy}
              onChange={(g) => setPref('groupBy', g)}
              options={[
                { id: 'status', label: canBoard ? 'وضعیت' : 'پروژه' },
                { id: 'priority', label: 'اولویت' },
                { id: 'none', label: 'هیچ' }
              ]}
            />
          </div>
        </Dialog>
      </Popover>
    </DialogTrigger>
  )
}
