import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RepoInput } from './components/RepoInput'
import { OverviewPanel } from './components/OverviewPanel'
import { IssueRanker } from './components/IssueRanker'
import { ArchDiagram } from './components/ArchDiagram'
import { ModelSwitcher } from './components/ModelSwitcher'
import './index.css'

// TODO: wire up useObject streaming from @ai-sdk/react against POST /analyze
// TODO: connect ModelSwitcher to GET/POST /models endpoint

const queryClient = new QueryClient()

function AppInner() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">BlinkGit</h1>
        <ModelSwitcher />
      </header>

      <main className="max-w-4xl mx-auto flex flex-col gap-6">
        <RepoInput onSubmit={() => {}} isLoading={false} />
        <OverviewPanel overview={undefined} />
        <IssueRanker issues={undefined} />
        <ArchDiagram architecture={undefined} />
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}
