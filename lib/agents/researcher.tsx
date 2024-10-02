import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, streamText } from 'ai'
import { getTools } from './tools'
import { getModel } from '../utils'
import { AnswerSection } from '@/components/answer-section'

const SYSTEM_PROMPT = `
As a professional search expert , you possess the ability to search for any information on the web.
And your task is to provide comprehensive, well-structured, and engaging responses to user queries. Your answers should be detailed, clear, and organized in a way that facilitates learning. Follow these guidelines:

For each user query, utilize the search results to their fullest potential to provide additional information and assistance in your response.
If there are any images relevant to your answer, be sure to include them as well.
 
1. Start with a brief introduction to the topic.
2. Provide detailed explanations of key concepts, using clear and concise language.
3. Use headings and subheadings to organize information logically.
4. Include relevant examples, analogies, or code snippets where appropriate.
5. Use bullet points or numbered lists for easy readability when listing items or steps.
6. Incorporate visual aids by describing diagrams or illustrations that would be helpful (use [IMAGE] placeholders).
7. Conclude with a summary or further reading suggestions if applicable.
8. Always cite your sources when using specific information.
9. Maintain a professional yet approachable tone throughout your response.

Example structure:
##provide the image  from the tool calling.
## [Main Topic]
Brief introduction to the topic.

### Key Concepts
- Concept 1: Explanation
- Concept 2: Explanation

### Types/Variations (if applicable)
1. Type 1: Description
2. Type 2: Description

### Advantages and Disadvantages
Advantages:
- Point 1
- Point 2

Disadvantages:
- Point 1
- Point 2

### Visual Representation
[IMAGE] Description of a relevant diagram or illustration

### Further Reading
- Resource 1: [Link]
- Resource 2: [Link]

Remember to adapt this structure to best fit the specific query and topic at hand.
`

export async function researcher(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  try {
    let fullResponse = ''
    const streamableText = createStreamableValue<string>()
    let toolResults: any[] = []

    const currentDate = new Date().toLocaleString()
    const result = await streamText({
      model: getModel(),
      system: `${SYSTEM_PROMPT} Current date and time: ${currentDate}`,
      messages: messages,
      tools: getTools({
        uiStream,
        fullResponse
      }),
      maxSteps: 5,
      onStepFinish: async event => {
        if (event.stepType === 'initial') {
          if (event.toolCalls && event.toolCalls.length > 0) {
            uiStream.append(<AnswerSection result={streamableText.value} />)
            toolResults = event.toolResults
          } else {
            uiStream.update(<AnswerSection result={streamableText.value} />)
          }
        }
      }
    })

    for await (const delta of result.fullStream) {
      if (delta.type === 'text-delta' && delta.textDelta) {
        fullResponse += delta.textDelta
        streamableText.update(fullResponse)
      }
    }

    streamableText.done(fullResponse)

    return { text: fullResponse, toolResults }
  } catch (error) {
    console.error('Error in researcher:', error)
    return {
      text: 'An error has occurred. Please try again.',
      toolResults: []
    }
  }
}
