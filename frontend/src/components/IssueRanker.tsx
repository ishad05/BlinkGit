// TODO: implement ranked issue list with difficulty badges (beginner / moderate / high)

interface Issue {
  title: string
  url: string
  difficulty: 'beginner' | 'moderate' | 'high'
  reason: string
}

interface IssueRankerProps {
  issues: Issue[] | undefined
}

export function IssueRanker({ issues: _issues }: IssueRankerProps) {
  return (
    <div className="p-4 border rounded-lg">
      <p className="text-gray-400 text-sm">IssueRanker — TODO</p>
    </div>
  )
}
