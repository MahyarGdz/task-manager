import { Link, type LinkProps } from '@tanstack/react-router'
import { Button as AriaButton, type ButtonProps as AriaButtonProps, ProgressBar } from 'react-aria-components'
import { cx } from './cx'

const VARIANTS = {
  primary: 'ui-button-primary',
  secondary: 'ui-button-secondary',
  outline: 'ui-button-outline',
  soft: 'ui-button-soft',
  ghost: 'ui-button-ghost',
  danger: 'ui-button-danger',
  'danger-outline': 'ui-button-danger-outline',
  'danger-ghost': 'ui-button-danger-outline',
  dark: 'ui-button-dark'
} as const

const SIZES = {
  xs: 'h-7 px-2 text-xs gap-1 rounded-sm',
  sm: 'h-8 px-3 text-sm gap-1.5 rounded-md',
  md: 'h-10 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-base gap-2 rounded-lg',
  xl: 'h-14 px-6 text-md gap-2.5 rounded-lg'
} as const

const BASE = 'ui-button inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap font-semibold'

export type ButtonVariant = keyof typeof VARIANTS
export type ButtonSize = keyof typeof SIZES
type Look = { variant?: ButtonVariant; size?: ButtonSize; className?: string }
export type ButtonProps = Omit<AriaButtonProps, 'className'> & Look

export const buttonClass = ({ variant = 'secondary', size = 'md', className }: Look = {}) =>
  cx(BASE, VARIANTS[variant], SIZES[size], className)

export function Button({ variant, size, className, children, ...props }: ButtonProps) {
  return (
    <AriaButton {...props} className={buttonClass({ variant, size, className })}>
      {(state) => (
        <>
          {state.isPending && <ProgressBar isIndeterminate aria-label="در حال انجام" className="ui-button-spinner" />}
          {typeof children === 'function' ? children(state) : children}
        </>
      )}
    </AriaButton>
  )
}

/** A navigation that looks like a button (router link, so it opens a page rather than acting). */
export function ButtonLink({ variant, size, className, ...props }: LinkProps & Look) {
  return <Link {...props} className={buttonClass({ variant, size, className })} />
}

/** Square icon-only button; `label` is required for screen readers. */
export function IconButton({ label, className, size = 'md', ...props }: Omit<ButtonProps, 'aria-label'> & { label: string }) {
  return (
    <Button
      {...props}
      size={size}
      aria-label={label}
      variant={props.variant ?? 'ghost'}
      className={cx('ui-button-icon aspect-square !px-0', className)}
    />
  )
}
