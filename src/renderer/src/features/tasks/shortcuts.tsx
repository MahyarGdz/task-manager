import { Sheet } from '../../ui/dialog'
import { Kbd } from '../../ui/layout'

const MOD = window.bridge.platform === 'darwin' ? '⌘' : 'Ctrl'

const GROUPS: { title: string; items: [string, string[]][] }[] = [
  {
    title: 'عمومی',
    items: [
      ['جستجو و فرمان', [MOD, 'K']],
      ['جستجو', ['/']],
      ['تسک جدید', ['C']],
      ['جمع کردن نوار کناری', [MOD, '\\']],
      ['این راهنما', ['?']]
    ]
  },
  {
    title: 'تسک',
    items: [
      ['ثبت تسک یا یادداشت', [MOD, '↵']],
      ['بازگشت به پروژه', ['Esc']],
      ['تغییر وضعیت از فرمان‌ها', ['Tab']]
    ]
  }
]

export function ShortcutsSheet({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <Sheet title="میانبرهای صفحه‌کلید" isOpen={isOpen} onClose={onClose} width="max-w-md">
      <div className="space-y-5">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h3 className="mb-2 text-xs font-semibold text-ink-3">{g.title}</h3>
            <ul className="divide-y divide-divider rounded-lg border border-border">
              {g.items.map(([label, keys]) => (
                <li key={label} className="flex h-10 items-center justify-between px-3 text-sm">
                  {label}
                  <span className="flex gap-1" dir="ltr">
                    {keys.map((k) => (
                      <Kbd key={k}>{k}</Kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Sheet>
  )
}
