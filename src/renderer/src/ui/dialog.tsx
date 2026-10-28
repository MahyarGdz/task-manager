import type { ReactNode } from 'react'
import { Dialog, Heading, Modal, ModalOverlay } from 'react-aria-components'
import { Button, IconButton } from './button'
import { cx } from './cx'
import { X } from './icons'

const overlay = 'ui-modal-overlay fixed inset-0 z-40'

function CloseButton({ onPress }: { onPress: () => void }) {
  return (
    <IconButton onPress={onPress} label="بستن" size="sm" className="ui-modal-close -me-2 -mt-1 shrink-0">
      <X size={18} aria-hidden="true" />
    </IconButton>
  )
}

/** Centred modal for a focused task (a form, a confirmation). */
export function Sheet({
  title,
  description,
  isOpen,
  onClose,
  children,
  footer,
  width = 'max-w-lg',
  dismissable = true
}: {
  title: string
  description?: ReactNode
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** Action row pinned under the scrolling body; primary action first (start side). */
  footer?: ReactNode
  width?: string
  dismissable?: boolean
}) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isDismissable={dismissable}
      isKeyboardDismissDisabled={!dismissable}
      className={cx(overlay, 'flex items-center justify-center p-6')}
    >
      <Modal className={cx('ui-modal w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-pop', width)}>
        <Dialog className="flex max-h-[calc(100dvh-3rem)] min-h-0 flex-col outline-none">
          <div className="ui-modal-header flex shrink-0 items-start justify-between gap-4 px-6 pb-2 pt-6">
            <div className="min-w-0">
              <Heading slot="title" className="font-sans text-[18px] font-bold leading-7">
                {title}
              </Heading>
              {description && <p className="mt-1.5 text-sm leading-6 text-ink-2">{description}</p>}
            </div>
            {dismissable && <CloseButton onPress={onClose} />}
          </div>
          <div className="ui-modal-body min-h-0 overflow-auto px-6 pb-6 pt-4">{children}</div>
          {footer && <div className="ui-modal-footer flex shrink-0 flex-wrap items-center gap-2 px-6 py-4">{footer}</div>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

/** Actions row at the end of a sheet body (legacy: prefer the `footer` prop). */
export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="ui-modal-footer -mx-6 -mb-6 mt-6 flex flex-wrap items-center gap-2 px-6 py-4">{children}</div>
}

/**
 * Side panel sliding in from the right, below the native title bar: quick views and edit forms that keep the
 * list visible behind them.
 */
export function Drawer({
  title,
  description,
  isOpen,
  onClose,
  children,
  footer,
  width = 'w-[30rem]'
}: {
  title: ReactNode
  description?: ReactNode
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  return (
    <ModalOverlay isOpen={isOpen} onOpenChange={(open) => !open && onClose()} isDismissable className={overlay}>
      <Modal
        className={cx(
          'ui-drawer fixed right-3 top-[60px] flex max-h-[calc(100dvh-72px)] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-pop',
          width
        )}
      >
        <Dialog className="flex max-h-full min-h-0 flex-col outline-none">
          <div className="ui-modal-header flex shrink-0 items-start justify-between gap-4 px-6 pb-2 pt-6">
            <div className="min-w-0">
              <Heading slot="title" className="font-sans text-[18px] font-bold leading-7">
                {title}
              </Heading>
              {description && <div className="mt-1.5 text-sm leading-6 text-ink-2">{description}</div>}
            </div>
            <CloseButton onPress={onClose} />
          </div>
          <div className="ui-modal-body min-h-0 flex-1 overflow-auto px-6 pb-6 pt-4">{children}</div>
          {footer && <div className="ui-modal-footer flex shrink-0 flex-wrap items-center gap-2 px-6 py-4">{footer}</div>}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

/** Yes/no for a consequential action. The confirm label names the action ("حذف پیش‌نویس"), never "OK". */
export function Confirm({
  title,
  children,
  confirmLabel,
  tone = 'primary',
  isOpen,
  onClose,
  onConfirm,
  pending = false
}: {
  title: string
  children?: ReactNode
  confirmLabel: string
  tone?: 'primary' | 'danger'
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  pending?: boolean
}) {
  return (
    <ModalOverlay
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      isDismissable
      className={cx(overlay, 'flex items-center justify-center p-6')}
    >
      <Modal className="ui-modal w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-pop">
        <Dialog role="alertdialog" className="max-h-[calc(100dvh-3rem)] overflow-auto outline-none">
          <div className="px-6 pb-6 pt-6">
            <Heading slot="title" className="font-sans text-[18px] font-bold leading-7">
              {title}
            </Heading>
            {children && <div className="mt-2 text-sm leading-6 text-ink-2">{children}</div>}
          </div>
          <div className="ui-modal-footer flex gap-2 px-6 py-4">
            <Button autoFocus isPending={pending} onPress={onConfirm} variant={tone}>
              {confirmLabel}
            </Button>
            <Button onPress={onClose}>انصراف</Button>
          </div>
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}
