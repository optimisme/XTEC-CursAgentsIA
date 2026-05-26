const LIMITS = {
  "spark-vllm/gemma4-8b-local": 16384,
  "vram16-vllm/gemma4-8b-local": 16384,
  "ieti-agents/local-vllm": 16384,
}

export const LimitLocalVllmOutput = async () => {
  return {
    "chat.params": async (input, output) => {
      const providerID = input.model.providerID ?? input.provider?.id ?? input.provider?.info?.id
      const key = `${providerID}/${input.model.id}`
      const limit = LIMITS[key]

      if (!limit) return

      output.maxOutputTokens = Math.min(output.maxOutputTokens ?? limit, limit)
    },
  }
}
