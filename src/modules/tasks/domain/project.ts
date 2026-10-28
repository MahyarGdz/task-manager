import { ValidationError } from '../../shared-kernel/domain'

export class InvalidProjectError extends ValidationError {}

export const PROJECT_COLORS = ['#5e6ad2', '#26b5ce', '#4cb782', '#f2c94c', '#f2994a', '#eb5757', '#bb87fc', '#95a2b3'] as const

export type ProjectProps = { id: number | null; key: string; name: string; description: string; color: string }

export function validProject(input: ProjectProps): ProjectProps {
  const name = input.name.trim()
  if (!name) throw new InvalidProjectError('نام پروژه الزامی است.')
  const key = input.key.trim().toUpperCase()
  if (!/^[A-Z][A-Z0-9]{1,4}$/.test(key)) throw new InvalidProjectError('کلید پروژه ۲ تا ۵ حرف لاتین است، مثل KAR.')
  if (!(PROJECT_COLORS as readonly string[]).includes(input.color)) throw new InvalidProjectError('رنگ پروژه نامعتبر است.')
  return { ...input, key, name, description: input.description.trim() }
}

export interface ProjectRepository {
  exists(id: number): Promise<boolean>
  save(project: ProjectProps): Promise<number>
  delete(id: number): Promise<void>
}
