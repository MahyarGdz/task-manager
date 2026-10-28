import { createHashHistory, createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { OverviewPage } from '../features/tasks/overview-page'
import { ProjectPage } from '../features/tasks/project-page'
import { TaskPage } from '../features/tasks/task-page'
import { type ViewKey, ViewsPage } from '../features/tasks/views-page'
import { Shell } from './shell'

const root = createRootRoute({ component: Shell })
const overview = createRoute({ getParentRoute: () => root, path: '/', component: OverviewPage })
const projectRoute = createRoute({
  getParentRoute: () => root,
  path: '/projects/$projectId',
  component: function Project() {
    const { projectId } = projectRoute.useParams()
    return <ProjectPage key={projectId} projectId={Number(projectId)} />
  }
})
const taskRoute = createRoute({
  getParentRoute: () => root,
  path: '/task/$taskId',
  component: function Task() {
    const { taskId } = taskRoute.useParams()
    return <TaskPage key={taskId} taskId={Number(taskId)} />
  }
})
const viewRoute = createRoute({
  getParentRoute: () => root,
  path: '/views/$view',
  component: function View() {
    const { view } = viewRoute.useParams()
    return <ViewsPage key={view} view={view as ViewKey} />
  }
})

const routeTree = root.addChildren([overview, projectRoute, taskRoute, viewRoute])

export const router = createRouter({ routeTree, history: createHashHistory(), defaultPreload: false })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
