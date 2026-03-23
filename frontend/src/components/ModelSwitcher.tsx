// TODO: implement LLM model selection panel (reads/writes model via GET/POST /models)

import { useModelStore } from '../stores/modelStore'

export function ModelSwitcher() {
  const { selectedModel, setSelectedModel: _setSelectedModel } = useModelStore()

  return (
    <div className="p-4 border rounded-lg">
      <p className="text-gray-400 text-sm">ModelSwitcher — TODO (current: {selectedModel})</p>
    </div>
  )
}
