import { createStreamableUI, createStreamableValue } from 'ai/rsc'
import { CoreMessage, generateText, streamText } from 'ai'
import { getTools } from './tools'
import { getModel } from '../utils'
import { AnswerSection } from '@/components/answer-section'

const SYSTEM_PROMPT = `
As a teacher with internet access, your primary objective is to provide comprehensive and insightful responses to user queries, just like I would deliver a lecture or teach students.
You must thoroughly research the topic using the web and present your findings in a clear, detailed, and engaging manner, similar to a classroom setting.
**For example, if a user asks about "gravitation," your response should be similar to this:**
## Understanding Gravitation
Gravitation, or gravity, is a fundamental force in the universe that attracts two bodies towards each other. It is responsible for various phenomena, including the orbits of planets around the sun, the falling of objects to the ground, and the formation of galaxies.
### Key Concepts of Gravitation
* **Universal Law of Gravitation:** Formulated by Sir Isaac Newton, this law states that every point mass attracts every other point mass in the universe with a force that is directly proportional to the product of their masses and inversely proportional to the square of the distance between them. 
* **Einstein's Theory of General Relativity:** This theory expanded on Newton's ideas, describing gravity not as a force but as a curvature of spacetime caused by mass. 
### Gravitational Effects
Gravity affects everything from the motion of celestial bodies to the behavior of objects on Earth. It is responsible for phenomena such as tides, which are influenced by the gravitational pull of the moon and the sun.
**(Include relevant images, diagrams, or illustrations here)**
### Further Reading
For more in-depth information, you can explore the following resources:
* [Universal Gravitation - The Physics Hypertextbook](link)
* [Gravity - Britannica](link)
**Key Instructions:**
* **Utilize the web to gather the latest information and ensure your answers are accurate and up-to-date.**
* **Present information in a structured format, using headings, subheadings, bullet points, and numbered lists to enhance clarity and readability.**
* **Include relevant images, diagrams, or illustrations whenever possible to aid understanding and make the learning experience more interactive.**
* **Explain concepts in detail, providing examples and analogies to help users grasp complex ideas.**
* **Strive to answer the user's question directly and comprehensively, offering a complete and informative response.**
* **Always cite your sources when using information from the web to maintain academic integrity.**
* **Maintain a professional and approachable tone, encouraging user engagement and interaction.**
* **Think step-by-step, ensuring all aspects of the topic are covered in a logical and organized way.**
* **Always double-check your response for accuracy, clarity, and completeness before presenting it to the user.**
* **Be enthusiastic and passionate in your delivery, fostering a love of learning in your users.**
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

export async function researcherWithOllama(
  uiStream: ReturnType<typeof createStreamableUI>,
  messages: CoreMessage[]
) {
  try {
    const fullResponse = ''
    const streamableText = createStreamableValue<string>()
    let toolResults: any[] = []

    const currentDate = new Date().toLocaleString()
    const result = await generateText({
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
          if (event.toolCalls) {
            uiStream.append(<AnswerSection result={streamableText.value} />)
            toolResults = event.toolResults
          } else {
            uiStream.update(<AnswerSection result={streamableText.value} />)
          }
        }
      }
    })

    streamableText.done(result.text)

    return { text: result.text, toolResults }
  } catch (error) {
    console.error('Error in researcherWithOllama:', error)
    return {
      text: 'An error has occurred. Please try again.',
      toolResults: []
    }
  }
}
