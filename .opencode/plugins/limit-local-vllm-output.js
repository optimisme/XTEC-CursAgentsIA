const LIMITS = {
  "spark-vllm/Qwen/Qwen3.6-27B": 4096,
  "local-vllm/gemma4-8b-local": 4096,
  "local-vllm/qwen3-8b-local": 4096,
  "local-vllm/qwen3-14b-local": 4096,
  "local-vllm/qwen35-9b-local": 4096,
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
