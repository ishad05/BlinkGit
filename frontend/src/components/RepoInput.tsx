// TODO: implement URL input form and submission logic

interface RepoInputProps {
  onSubmit: (repoUrl: string) => void
  isLoading: boolean
}

export function RepoInput({ onSubmit: _onSubmit, isLoading: _isLoading }: RepoInputProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-gray-400 text-sm">RepoInput — TODO</p>
    </div>
  )
}
